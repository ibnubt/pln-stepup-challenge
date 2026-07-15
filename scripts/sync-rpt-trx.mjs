// ============================================================================
// Worker sync incremental: rpt_trx (SOURCE) → tabel bersih taps/employees (DST).
// Ambil HANYA tap baru dari reader tangga (index sourcename → ringan).
// Env:
//   DATABASE_URL          Postgres tujuan (tabel taps/employees/stair_reader/sync_state)
//   SOURCE_DATABASE_URL   Postgres sumber (rpt_trx)
//   SOURCE_PGSSL=true     SSL ke sumber
//   SYNC_INTERVAL=30      detik antar sync (loop). SYNC_ONCE=1 → sekali saja.
//   SYNC_BACKFILL_DAYS=35 batas backfill saat pertama (agar tak tarik tahunan)
//   SYNC_VALID_ONLY=1     hanya ambil tap 'Valid Credential' (default: +Invalid, fase enroll)
// ============================================================================
import pg from "pg";

const DST_URL = process.env.DATABASE_URL;
const SRC_URL = process.env.SOURCE_DATABASE_URL;
const SRC_SSL = process.env.SOURCE_PGSSL === "true";
const INTERVAL = Math.max(2, Number(process.env.SYNC_INTERVAL || 30)) * 1000;
const BACKFILL_DAYS = Number(process.env.SYNC_BACKFILL_DAYS || 35);
const ONCE = process.env.SYNC_ONCE === "1";
const WIB = 7 * 3600; // trxdate = epoch UTC + 7 jam (ber-WIB)

// Event tap yang dihitung sebagai "orang naik tangga".
// Fase enrollment: pemakai tangga yg kartunya BELUM di-authorize ter-log sebagai
// 'Invalid Credential' (mis. PRAYOGA) — mereka tetap fisik naik tangga, jadi ikut.
// Set SYNC_VALID_ONLY=1 setelah semua kartu di-enroll agar hanya tap sah yang diambil.
const EVTYPES = process.env.SYNC_VALID_ONLY === "1"
  ? ["Valid Credential"]
  : ["Valid Credential", "Invalid Credential"];

const log = (...a) => console.log(new Date().toISOString(), "[sync]", ...a);

async function syncOnce(dst, src) {
  const wmRow = await dst.query(`SELECT last_trxdate FROM sync_state WHERE source='rpt_trx'`);
  const wm = Number(wmRow.rows[0]?.last_trxdate ?? 0);
  const floorTrx = Math.floor(Date.now() / 1000) + WIB - BACKFILL_DAYS * 86400;
  const from = Math.max(wm, floorTrx);

  const readers = (await dst.query(`SELECT sourcename, level FROM stair_reader`)).rows;
  if (!readers.length) return log("stair_reader kosong — isi dulu, lewati");
  const levelOf = new Map(readers.map((r) => [r.sourcename, r.level]));
  const names = readers.map((r) => r.sourcename);

  // identitas pegawai: NIP (extsysid) bila ada, kalau tidak pakai nomor kartu (cardno)
  const eid = (r) => (r.extsysid && String(r.extsysid).trim()) || String(r.cardno);

  // tarik tap baru (idempotent via ts unique → boleh >= )
  const res = await src.query(
    `SELECT trxdate, extsysid, sourcename, fname, lname, cardno, identitydepartment
       FROM rpt_trx
      WHERE sourcename = ANY($1) AND evtypename = ANY($3)
        AND cardno IS NOT NULL AND trxdate >= $2
      ORDER BY trxdate
      LIMIT 5000`,
    [names, from, EVTYPES]
  );
  if (!res.rows.length) return;

  // upsert pegawai (dedup per identitas)
  const emps = [...new Map(res.rows.map((r) => [eid(r), r])).values()];
  const ev = [], ep = [];
  emps.forEach((r, k) => {
    const o = k * 4;
    ep.push(`($${o + 1},$${o + 2},$${o + 3},$${o + 4},TRUE)`);
    ev.push(
      eid(r),
      (r.fname || "").trim() || null,
      r.cardno != null ? Number(r.cardno) : null,
      (r.identitydepartment || r.lname || "").trim() || null
    );
  });
  await dst.query(
    `INSERT INTO employees (id,name,card,unit,is_real) VALUES ${ep.join(",")}
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, card=EXCLUDED.card, unit=EXCLUDED.unit`,
    ev
  );

  // insert taps (batch, idempotent)
  let ins = 0, maxT = wm;
  const B = 500;
  for (let i = 0; i < res.rows.length; i += B) {
    const chunk = res.rows.slice(i, i + B).filter((r) => levelOf.has(r.sourcename));
    if (!chunk.length) continue;
    const tv = [], tp = [];
    chunk.forEach((r, k) => {
      const o = k * 4;
      tp.push(`((to_timestamp($${o + 1}) AT TIME ZONE 'UTC')::timestamp,$${o + 2},$${o + 3},$${o + 4},'stair')`);
      tv.push(Number(r.trxdate), eid(r), levelOf.get(r.sourcename), r.sourcename);
      if (Number(r.trxdate) > maxT) maxT = Number(r.trxdate);
    });
    const q = await dst.query(
      `INSERT INTO taps (ts,employee_id,level,device,kind) VALUES ${tp.join(",")}
       ON CONFLICT (employee_id,ts,device) DO NOTHING`,
      tv
    );
    ins += q.rowCount;
  }

  await dst.query(
    `INSERT INTO sync_state (source,last_trxdate,updated_at) VALUES ('rpt_trx',$1,now())
     ON CONFLICT (source) DO UPDATE SET last_trxdate=$1, updated_at=now()`,
    [maxT]
  );
  log(`+${ins} tap baru (scan ${res.rows.length} baris), watermark→${maxT}`);
}

let dst = null, src = null;
// tutup koneksi dengan aman (abaikan error saat menutup)
async function closeClient(c) {
  try { await c?.end(); } catch { /* abaikan */ }
}
async function ensure() {
  if (!dst) {
    dst = new pg.Client({ connectionString: DST_URL });
    await dst.connect();
    dst.on("error", () => (dst = null));
  }
  if (!src) {
    src = new pg.Client({ connectionString: SRC_URL, ssl: SRC_SSL ? { rejectUnauthorized: false } : undefined });
    await src.connect();
    src.on("error", () => (src = null));
  }
}
async function tick() {
  try {
    await ensure();
    await syncOnce(dst, src);
  } catch (e) {
    log("ERROR", e.message);
    // PENTING: TUTUP koneksi sebelum reconnect. Tanpa ini, setiap error (mis. sumber
    // tak terjangkau) membocorkan 1 koneksi ke DB lokal → menumpuk → "too many clients"
    // → web gagal query → "server-side exception". (bug penyebab crash dashboard)
    await closeClient(dst);
    await closeClient(src);
    dst = null;
    src = null; // reconnect di tick berikutnya
  }
}

log(`start · interval=${INTERVAL / 1000}s · backfill=${BACKFILL_DAYS}d · once=${ONCE} · evtypes=[${EVTYPES.join(", ")}]`);
await tick();
if (!ONCE) setInterval(tick, INTERVAL);

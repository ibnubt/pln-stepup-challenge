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
//   SYNC_RESCAN_HOURS=72  pindai ulang N jam terakhir untuk tap yang MASUK TERLAMBAT ke rpt_trx
//                         (panel reader offline lalu mengirim belakangan dgn jam tap asli -> lebih
//                         tua dari watermark -> terlewat tarikan utama). 0 = nonaktif.
//   SYNC_RESCAN_MIN=15    jeda antar pindai ulang (menit). Pindai ulang juga jalan saat start.
// ============================================================================
import pg from "pg";

const DST_URL = process.env.DATABASE_URL;
const SRC_URL = process.env.SOURCE_DATABASE_URL;
const SRC_SSL = process.env.SOURCE_PGSSL === "true";
const INTERVAL = Math.max(2, Number(process.env.SYNC_INTERVAL || 30)) * 1000;
const BACKFILL_DAYS = Number(process.env.SYNC_BACKFILL_DAYS || 35);
const ONCE = process.env.SYNC_ONCE === "1";
const RESCAN_HOURS = Math.max(0, Number(process.env.SYNC_RESCAN_HOURS ?? 72));
const RESCAN_MS = Math.max(1, Number(process.env.SYNC_RESCAN_MIN || 15)) * 60 * 1000;
const WIB = 7 * 3600; // trxdate = epoch UTC + 7 jam (ber-WIB)

// Event tap yang dihitung sebagai "orang naik tangga".
// Fase enrollment: pemakai tangga yg kartunya BELUM di-authorize ter-log sebagai
// 'Invalid Credential' (mis. PRAYOGA) — mereka tetap fisik naik tangga, jadi ikut.
// Set SYNC_VALID_ONLY=1 setelah semua kartu di-enroll agar hanya tap sah yang diambil.
const EVTYPES = process.env.SYNC_VALID_ONLY === "1"
  ? ["Valid Credential"]
  : ["Valid Credential", "Invalid Credential"];

const log = (...a) => console.log(new Date().toISOString(), "[sync]", ...a);

// identitas pegawai: NIP (extsysid) bila ada, kalau tidak pakai nomor kartu (cardno)
const eid = (r) => (r.extsysid && String(r.extsysid).trim()) || String(r.cardno);
const PAGE = 5000;
const SRC_SQL = `SELECT trxdate, extsysid, sourcename, fname, lname, cardno, identitydepartment
       FROM rpt_trx
      WHERE sourcename = ANY($1) AND evtypename = ANY($3)
        AND cardno IS NOT NULL AND trxdate >= $2
      ORDER BY trxdate
      LIMIT ${PAGE}`;

async function loadReaders(dst) {
  const readers = (await dst.query(`SELECT sourcename, level FROM stair_reader`)).rows;
  return { levelOf: new Map(readers.map((r) => [r.sourcename, r.level])), names: readers.map((r) => r.sourcename) };
}

/** Simpan baris rpt_trx: upsert pegawai + insert tap (idempotent). Return jumlah tap BARU. */
async function ingest(dst, rows, levelOf) {
  // upsert pegawai (dedup per identitas)
  const emps = [...new Map(rows.map((r) => [eid(r), r])).values()];
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
  let ins = 0;
  const B = 500;
  for (let i = 0; i < rows.length; i += B) {
    const chunk = rows.slice(i, i + B).filter((r) => levelOf.has(r.sourcename));
    if (!chunk.length) continue;
    const tv = [], tp = [];
    chunk.forEach((r, k) => {
      const o = k * 4;
      tp.push(`((to_timestamp($${o + 1}) AT TIME ZONE 'UTC')::timestamp,$${o + 2},$${o + 3},$${o + 4},'stair')`);
      tv.push(Number(r.trxdate), eid(r), levelOf.get(r.sourcename), r.sourcename);
    });
    const q = await dst.query(
      `INSERT INTO taps (ts,employee_id,level,device,kind) VALUES ${tp.join(",")}
       ON CONFLICT (employee_id,ts,device) DO NOTHING`,
      tv
    );
    ins += q.rowCount;
  }
  return ins;
}

/** Tarikan utama: tap sejak watermark, lalu majukan watermark. */
async function syncOnce(dst, src) {
  const wmRow = await dst.query(`SELECT last_trxdate FROM sync_state WHERE source='rpt_trx'`);
  const wm = Number(wmRow.rows[0]?.last_trxdate ?? 0);
  const floorTrx = Math.floor(Date.now() / 1000) + WIB - BACKFILL_DAYS * 86400;
  const from = Math.max(wm, floorTrx);

  const { levelOf, names } = await loadReaders(dst);
  if (!names.length) return log("stair_reader kosong — isi dulu, lewati");

  // tarik tap baru (idempotent via ts unique → boleh >= )
  const res = await src.query(SRC_SQL, [names, from, EVTYPES]);
  if (!res.rows.length) return;

  const ins = await ingest(dst, res.rows, levelOf);
  // Batas atas watermark = sekarang + toleransi skew 10 mnt. Mencegah 1 tap dgn jam
  // reader SALAH (ke masa depan) melompatkan watermark → men-skip semua tap nyata
  // berikutnya (trxdate lebih kecil). Tap masa depan tetap DIsimpan, hanya tak
  // memajukan watermark.
  const nowCap = Math.floor(Date.now() / 1000) + WIB + 600;
  let maxT = wm;
  for (const r of res.rows) {
    const td = Number(r.trxdate);
    if (levelOf.has(r.sourcename) && td > maxT && td <= nowCap) maxT = td;
  }

  await dst.query(
    `INSERT INTO sync_state (source,last_trxdate,updated_at) VALUES ('rpt_trx',$1,now())
     ON CONFLICT (source) DO UPDATE SET last_trxdate=$1, updated_at=now()`,
    [maxT]
  );
  log(`+${ins} tap baru (scan ${res.rows.length} baris), watermark→${maxT}`);
}

/**
 * Pindai ulang RESCAN_HOURS jam terakhir (per halaman, urut trxdate) TANPA mengubah watermark.
 * Menangkap tap yang masuk rpt_trx terlambat (jam tap lebih tua dari watermark).
 */
async function rescan(dst, src) {
  const { levelOf, names } = await loadReaders(dst);
  if (!names.length) return;
  let cursor = Math.floor(Date.now() / 1000) + WIB - RESCAN_HOURS * 3600;
  let ins = 0, scanned = 0;
  for (let page = 0; page < 200; page++) {
    const res = await src.query(SRC_SQL, [names, cursor, EVTYPES]);
    if (!res.rows.length) break;
    scanned += res.rows.length;
    ins += await ingest(dst, res.rows, levelOf);
    if (res.rows.length < PAGE) break;
    const last = Number(res.rows[res.rows.length - 1].trxdate);
    cursor = last > cursor ? last : cursor + 1; // pastikan maju walau banyak baris di detik yang sama
  }
  log(`pindai ulang ${RESCAN_HOURS} jam: +${ins} tap terlambat (scan ${scanned} baris)`);
}

let dst = null, src = null;
let lastRescan = 0, rescanning = false;
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
    if (RESCAN_HOURS > 0 && !rescanning && Date.now() - lastRescan >= RESCAN_MS) {
      rescanning = true;
      lastRescan = Date.now(); // dicatat di awal: bila gagal, tak diulang tiap tick
      try {
        await rescan(dst, src);
      } finally {
        rescanning = false;
      }
    }
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

log(`start · interval=${INTERVAL / 1000}s · backfill=${BACKFILL_DAYS}d · rescan=${RESCAN_HOURS}j/${RESCAN_MS / 60000}m · once=${ONCE} · evtypes=[${EVTYPES.join(", ")}]`);
await tick();
if (ONCE) {
  await closeClient(dst);
  await closeClient(src);
} else setInterval(tick, INTERVAL);

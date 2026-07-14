# PLN Wellness — Command Center

Dashboard program **Naik Tangga** PLN Kantor Pusat: mendorong pegawai pakai tangga (bukan lift) dengan gamifikasi, memantau dampak ke **beban lift, emisi CO₂, dan kesehatan**.

Next.js 14 (App Router) · TypeScript · Tailwind · Recharts.

---

## Menjalankan (lokal / server)

```bash
# 1. install
npm install

# 2. dev
npm run dev            # http://localhost:3000

# atau production
npm run build
npm run start          # PORT=3200 npm run start  (ganti port bila 3000 terpakai)
```

**Login (statis, demo):** `admin` / `pln2026` — atur di [`src/lib/auth.ts`](src/lib/auth.ts).

> Ganti login statis dengan SSO/NextAuth untuk produksi. Kredensial hardcode hanya untuk demo.

---

## Docker — satu perintah, semua jalan

`docker compose` menyalakan **3 service**: `db` (Postgres) + `web` (dashboard, baca DB) + `sync` (worker menarik tap tangga dari `rpt_trx` tiap N detik). Data real, near-realtime.

```bash
git clone https://github.com/ibnubt/pln-stepup-challenge.git
cd pln-stepup-challenge

cp .env.example .env       # isi SOURCE_DATABASE_URL (rpt_trx), atur SYNC_INTERVAL, WEB_PORT
docker compose up -d --build
# → http://SERVER:3000  (login admin / pln2026)
```

`.env` yang perlu diisi:
```
SOURCE_DATABASE_URL=postgres://USER:PASS@HOST:5432/TransactionDB   # sumber rpt_trx (read-only)
SOURCE_PGSSL=true
SYNC_INTERVAL=30          # detik antar sync (mis. 5 utk lebih realtime)
WEB_PORT=3000             # ganti bila port host bentrok
```

Skema DB + 18 reader tangga dibuat otomatis (`db/init/`). Worker mengisi `taps`/`employees` secara incremental (watermark, idempotent). Dashboard refresh tiap ~20 dtk (TTL). Total jeda tap→muncul ≈ `SYNC_INTERVAL` + 20 dtk.

```bash
docker compose logs -f sync    # lihat sync
docker compose down            # stop (data tetap di volume)
docker compose down -v         # stop + hapus data
git pull && docker compose up -d --build   # update
```

> Reader tangga sedang disiapkan — kalau nama `sourcename` final berbeda, edit `db/init/02-stair-reader.sql` lalu `docker compose up -d`.

### Mode demo (tanpa DB)
Tanpa `.env`/DB: jalankan langsung dengan data sintetis — `npm install && npm run dev` (default `DATA_SOURCE` kosong → baca JSON).

---

## Data

App berjalan **mandiri** dari data sintetis di `src/data/` (`taps.json`, `employees.json`, `doors-by-floor.json`) — tidak butuh database untuk jalan.

**Regenerate data sintetis:**
```bash
npm run gen            # tulis ulang src/data/taps.json + employees.json (seeded, reproducible)
```

### Seed PostgreSQL (opsional)
Untuk memuat data ke Postgres di server:
```bash
npm run gen:sql        # tulis db/seed.sql (CREATE TABLE + INSERT)

# import ke server:
psql "postgres://USER:PASS@HOST:5432/DBNAME" -f db/seed.sql
```
Skema: tabel `employees` (30 baris) + `taps` (raw tap RFID). Cek: `SELECT kind, COUNT(*) FROM taps GROUP BY kind;`

> Catatan: default app **membaca data dari JSON** (demo). Untuk data real, lihat di bawah.

### Mode data REAL (PostgreSQL, dari `rpt_trx`)
App bisa membaca dari tabel bersih `taps`/`employees` yang di-ETL dari `rpt_trx` (sistem akses RFID).

```bash
# 1. buat tabel + reader tangga
psql "$DBURL" -f db/seed.sql            # skema taps/employees (isi demo, nanti ditimpa ETL)
psql "$DBURL" -f db/stair-reader.sql    # master 18 reader "... Tangga Darurat Tengah" → lantai
# 2. ekstrak event tangga real dari rpt_trx
psql "$DBURL" -f db/etl-rpt-trx.sql     # filter Valid Credential, trxdate→WIB, extsysid=NIP
# 3. jalankan app dengan sumber DB (isi kredensial via env, JANGAN hardcode)
DATA_SOURCE=db PGSSL=true DATABASE_URL="postgres://USER:PASS@HOST:5432/DBNAME" npm run start
```

Pemetaan kolom (`rpt_trx` → app): `trxdate`(WIB)→ts · `extsysid`→NIP · `fname`→nama · `cardno`→kartu · `sourcename`→reader/lantai (via `stair_reader`). Jadwalkan ETL via cron untuk data terbaru.

---

## Metodologi & Rumus

Setiap metrik didokumentasikan di halaman **`/metodologi`** (tombol "Metodologi" di app bar). Semua angka & rumus ditarik langsung dari [`src/lib/config.ts`](src/lib/config.ts) agar selalu sinkron.

Konstanta utama (di `config.ts` → `IMPACT`):
- Energi lift **20 Wh/perjalanan** — ACEEE (Sachs 2005)
- Faktor emisi **0,773 kg CO₂/kWh** — proyeksi grid nasional 2025 (773 g/kWh)
- Berat badan — Kemenkes AKG 2019 (L 60 / P 55 kg)
- Poin: naik `lantai × 100 × koef`, turun `lantai × 50 × koef` (koefisien progresif per-trip)

> **Catatan:** data pegawai bersifat sintetis (demo). Emisi CO₂ memakai asumsi *per-sesi* (batas atas) — lihat `/metodologi` untuk keterbatasan.

---

## Struktur

```
src/
  app/            # halaman: / (dashboard), /login, /metodologi
  components/     # UI + kartu dashboard
  lib/            # config (konstanta+rumus), scoring (engine), data, auth
  data/           # data sintetis (JSON)
scripts/          # generate-data.mjs, generate-sql.mjs
db/seed.sql       # seed PostgreSQL
```

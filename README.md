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

## Docker (deploy di server)

Image Next.js **standalone** — kecil (~230 MB), tanpa database.

```bash
git clone https://github.com/ibnubt/pln-stepup-challenge.git
cd pln-stepup-challenge

# Opsi A — docker compose (paling gampang)
docker compose up -d --build          # → http://SERVER:3000

# Opsi B — docker manual
docker build -t pln-wellness .
docker run -d -p 3000:3000 --name pln-wellness --restart unless-stopped pln-wellness
```

Ganti port host bila 3000 terpakai: `-p 8080:3000` (atau edit `docker-compose.yml`).

```bash
docker logs -f pln-wellness      # lihat log
docker compose down              # stop (compose)
docker rm -f pln-wellness        # stop (manual)
```

Update versi baru: `git pull && docker compose up -d --build`.

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

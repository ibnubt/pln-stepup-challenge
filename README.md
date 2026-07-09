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

> Catatan: versi ini **membaca data dari JSON**, bukan dari Postgres. `seed.sql` disediakan bila Anda ingin menyimpan/mengolah data di DB atau menyambungkannya ke backend nanti.

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

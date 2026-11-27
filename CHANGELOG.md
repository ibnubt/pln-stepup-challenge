# Catatan Perubahan

Nomor versi memakai format MAYOR.MINOR.PATCH (Semantic Versioning).

- PATCH (1.0.x): perbaikan bug, teks, atau tampilan kecil. Rumus poin tidak berubah.
- MINOR (1.x.0): fitur baru. Data dan angka lama tetap sebanding.
- MAYOR (x.0.0): aturan skor atau struktur data berubah, sehingga angka tidak sebanding dengan versi sebelumnya.

Tiap versi punya git tag `vX.Y.Z`. Cara rilis dan rollback ada di README bagian "Versi & rollback".

## [Belum dirilis]

Rencana nomor: 1.1.0. Build uji di DEV: 1.1.0-rc.1.

### Skor (aturan v2)
- Check-in harian LT1 sampai LT4 dihapus. Semua sesi tangga yang lolos deteksi sesi langsung dapat poin.
- Koefisien/multiplier 1,0 sampai 2,0 dihapus. Poin = lantai naik x 100 + lantai turun x 50.
- Aturan baru berlaku mulai tanggal `RULES_V2_START` di `.env` (isi dengan tanggal awal siklus, mis. 2026-11-23 atau 2026-12-23). Hari sebelumnya tetap memakai aturan lama, sehingga arsip siklus lama dan export lama tidak berubah. Kosong = aturan lama untuk semua hari.

### Dua gedung
- Gedung ditentukan dari nama reader: diawali "GD 1" = Gedung 1 (Tangga Darurat Timur, LT1 sampai LT9), selain itu Gedung Utama (Tangga Darurat Tengah, B2 sampai LT16).
- Sesi naik/turun dideteksi per gedung. Tap di dua gedung yang berurutan tidak lagi bisa membentuk satu sesi.
- Poin, KPI, dan leaderboard tetap digabung untuk dua gedung.
- Peta vertikal (dashboard, display, kiosk) menampilkan Gedung Utama dan Gedung 1 berdampingan dengan skala bar yang sama.
- Anak tangga Gedung 1 sementara 27 per lantai, menunggu angka dari GA.

### Tampilan
- Kartu "Aturan Reward", tooltip Total Poin, detail pegawai, dan halaman metodologi mengikuti aturan periode yang dipilih. Untuk aturan v2: tanpa label check-in, tanpa koefisien, dan tabel badge menggantikan tabel koefisien. Aturan lama tetap terdokumentasi di metodologi.
- Tooltip Total Poin sekarang menulis poin dasar yang benar (100 dan 50, sebelumnya tertulis 10 dan 5).

## [1.0.0] - 2026-11-27

Versi produksi pertama yang diberi nomor. Isinya sama dengan kode `main` per 22 Nov 2026 (commit `60fe3dc`), ditambah label versi di header dashboard.

### Data & sinkronisasi
- Sync worker membaca `rpt_trx` (ACM) secara read-only, lalu menyimpan pegawai dan tap ke Postgres lokal. Watermark di `sync_state`, backfill 35 hari.
- Identitas pegawai memakai `extsysid`, atau `cardno` bila `extsysid` kosong.
- Reader tangga: 18 reader Tangga Darurat Tengah (B2 sampai LT16) dan 9 reader Tangga Darurat Timur GD 1 (LT1 sampai LT9).
- Kartu tak dikenal (nama kosong, atau nama sama dengan nomor kartu) dibuang dari semua tampilan.

### Skor
- Sesi naik/turun dibentuk dari tap berurutan: selisih 1 lantai, jeda 4 sampai 90 detik per lantai.
- Check-in harian wajib: naik melewati LT1 sampai LT4. Tanpa check-in, semua sesi hari itu bernilai 0.
- Poin naik 100 per lantai, turun 50 per lantai, dikali koefisien harian 1,0 sampai 2,0 menurut total lantai naik hari itu.
- Konversi anak tangga: B2 ke B1 = 20, B1 ke LT1 = 24, LT1 ke atas = 27 per lantai.
- Dampak: energi lift 20 Wh per perjalanan, emisi 0,773 kg CO2/kWh, kalori dengan berat badan 60 kg.

### Periode
- Leaderboard reset per siklus mulai tanggal `RESET_DAY` (23), contoh 23 Jul sampai 22 Agu 2026. Siklus lama bisa dipilih dari dropdown.
- `PROGRAM_START` memotong tampilan ke 0 tanpa menghapus data lama.

### Tampilan
- Dashboard admin: KPI, leaderboard Pegawai PLN dan Non-Pegawai (pagination ellipsis), tren, peta lantai, halaman metodologi.
- Export rekap tim XLSX per siklus atau per rentang tanggal.
- Display (landscape 1920x1080) dan kiosk (portrait 1080x1920) dengan scale-to-fit dan auto-refresh. Kiosk punya teks berjalan peringatan keselamatan.

### Operasional
- Docker compose (db, web, sync). Dua environment: DEV (branch `dev`) dan PROD (branch `main`), update lewat `deploy.sh` / `deploy.bat`.
- Skrip export raw tap ke XLSX: `scripts/export_raw_db.py` dan `scripts/export_raw_xlsx.py`.

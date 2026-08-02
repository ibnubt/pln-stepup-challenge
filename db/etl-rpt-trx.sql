-- ============================================================================
-- ETL: rpt_trx (TransactionDB, public)  →  tabel bersih `taps` + `employees`
-- ----------------------------------------------------------------------------
-- rpt_trx = transaksi RFID nyata (bukan rpt_alltrx yg berisi audit).
-- Punya index di sourcename → JOIN ke stair_reader cepat.
--
-- PEMETAAN KOLOM (rpt_trx → model app):
--   trxdate (bigint, epoch detik BER-WIB) → ts  (as-UTC = jam WIB, tanpa konversi)
--   extsysid (NIP)                        → employees.id
--   fname (nama lengkap orang)            → employees.name
--   lname (organisasi: PLN/TAD/…)         → employees.unit  (atau identitydepartment)
--   cardno                                → employees.card
--   sourcename (nama reader RFID)         → taps.device  + JOIN stair_reader → level
--   evtypename = 'Valid Credential'       → filter tap sah (eventname 'Local Grant')
--
-- MASIH PERLU: master list reader TANGGA → isi tabel stair_reader (sourcename → lantai).
-- Prasyarat: tabel taps & employees sudah ada (skema di db/seed.sql).
-- ============================================================================

-- ---- 1. Master reader tangga ----
-- Dibuat & diisi via db/stair-reader.sql (18 reader "... Tangga Darurat Tengah").
-- Jalankan file itu SEBELUM ETL ini.
CREATE TABLE IF NOT EXISTS stair_reader (
  sourcename TEXT PRIMARY KEY,
  level      TEXT NOT NULL
);

-- ---- 2. Reset data lama (taps dulu karena FK, lalu pegawai demo) ----
TRUNCATE taps RESTART IDENTITY;
DELETE FROM employees;   -- buang pegawai demo; taps sudah kosong jadi aman

-- ---- 3. Pegawai unik dari event tangga (HARUS sebelum taps karena FK) ----
-- gender/weight/height TIDAK ada di rpt_trx → NULL (app fallback ke rata-rata Kemenkes).
-- identitas = NIP (extsysid) bila ada, kalau tidak pakai nomor kartu (cardno)
INSERT INTO employees (id, name, card, unit, persona, office, gender, weight_kg, height_cm, basement, is_real)
SELECT DISTINCT ON (COALESCE(NULLIF(TRIM(r.extsysid),''), r.cardno::text))
  COALESCE(NULLIF(TRIM(r.extsysid),''), r.cardno::text)   AS id,
  NULLIF(TRIM(r.fname), '')                               AS name,   -- fname = nama lengkap
  r.cardno::bigint                                        AS card,
  COALESCE(NULLIF(TRIM(r.identitydepartment), ''), NULLIF(TRIM(r.lname), '')) AS unit,
  'regular'                                               AS persona,
  NULL                                                    AS office,
  'L'                                                     AS gender,     -- default
  NULL                                                    AS weight_kg,  -- default → rata-rata
  NULL                                                    AS height_cm,
  NULL                                                    AS basement,
  TRUE                                                    AS is_real
FROM rpt_trx r
JOIN stair_reader sr ON sr.sourcename = r.sourcename
WHERE r.cardno IS NOT NULL AND r.evtypename IN ('Valid Credential','Invalid Credential')
ORDER BY COALESCE(NULLIF(TRIM(r.extsysid),''), r.cardno::text), r.trxdate DESC;

-- ---- 4. Event tap tangga → taps ----
INSERT INTO taps (ts, employee_id, level, device, kind)
SELECT
  (to_timestamp(r.trxdate) AT TIME ZONE 'UTC')::timestamp AS ts,  -- jam WIB apa adanya
  COALESCE(NULLIF(TRIM(r.extsysid),''), r.cardno::text)   AS employee_id,
  sr.level                                                AS level,
  r.sourcename                                            AS device,
  'stair'                                                 AS kind
FROM rpt_trx r
JOIN stair_reader sr ON sr.sourcename = r.sourcename       -- index sourcename → cepat
WHERE r.cardno IS NOT NULL
  AND r.evtypename IN ('Valid Credential','Invalid Credential')  -- +Invalid: pemakai tangga kartu belum di-enroll
  -- opsional batasi rentang (bulan berjalan):
  -- AND r.trxdate >= extract(epoch FROM date_trunc('month', now()))::bigint
;

CREATE INDEX IF NOT EXISTS idx_taps_emp_ts ON taps (employee_id, ts);

-- Cek:  SELECT level, COUNT(*) FROM taps GROUP BY 1 ORDER BY 1;
--       SELECT COUNT(DISTINCT employee_id) FROM taps;

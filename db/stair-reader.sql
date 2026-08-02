-- ============================================================================
-- Master reader TANGGA → lantai  (isi tabel stair_reader untuk ETL rpt_trx)
-- Nama harus PERSIS sama dengan rpt_trx.sourcename saat reader sudah live.
-- Reader "... Tangga Darurat Tengah" sedang disiapkan paralel — update bila
-- nama final berubah, lalu jalankan ulang db/etl-rpt-trx.sql.
-- ============================================================================
CREATE TABLE IF NOT EXISTS stair_reader (
  sourcename TEXT PRIMARY KEY,
  level      TEXT NOT NULL   -- B2, B1, LT1 .. LT16
);

INSERT INTO stair_reader (sourcename, level) VALUES
  ('B2 Tangga Darurat Tengah',  'B2'),
  ('B1 Tangga Darurat Tengah',  'B1'),
  ('L1 Tangga Darurat Tengah',  'LT1'),
  ('L2 Tangga Darurat Tengah',  'LT2'),
  ('L3 Tangga Darurat Tengah',  'LT3'),
  ('L4 Tangga Darurat Tengah',  'LT4'),
  ('L5 Tangga Darurat Tengah',  'LT5'),
  ('L6 Tangga Darurat Tengah',  'LT6'),
  ('L7 Tangga Darurat Tengah',  'LT7'),
  ('L8 Tangga Darurat Tengah',  'LT8'),
  ('L9 Tangga Darurat Tengah',  'LT9'),
  ('L10 Tangga Darurat Tengah', 'LT10'),
  ('L11 Tangga Darurat Tengah', 'LT11'),
  ('L12 Tangga Darurat Tengah', 'LT12'),
  ('L13 Tangga Darurat Tengah', 'LT13'),
  ('L14 Tangga Darurat Tengah', 'LT14'),
  ('L15 Tangga Darurat Tengah', 'LT15'),
  ('L16 Tangga Darurat Tengah', 'LT16')
ON CONFLICT (sourcename) DO UPDATE SET level = EXCLUDED.level;

-- Cek: SELECT * FROM stair_reader ORDER BY level;

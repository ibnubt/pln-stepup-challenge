-- Master reader tangga → lantai. Nama harus persis sama dengan rpt_trx.sourcename.
-- Rute Tengah: B2, B1, LT1–LT16 (18 reader). Rute Timur GD 1: LT1–LT9 (9 reader).
-- Entri "... - 1501 Internal SIO-0" dan "Exit ... tangga penunjang" sengaja TIDAK didaftarkan.
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
  ('L16 Tangga Darurat Tengah', 'LT16'),
  ('GD 1 TANGGA DARURAT TIMUR LT 1', 'LT1'),
  ('GD 1 TANGGA DARURAT TIMUR LT 2', 'LT2'),
  ('GD 1 TANGGA DARURAT TIMUR LT 3', 'LT3'),
  ('GD 1 TANGGA DARURAT TIMUR LT 4', 'LT4'),
  ('GD 1 TANGGA DARURAT TIMUR LT 5', 'LT5'),
  ('GD 1 TANGGA DARURAT TIMUR LT 6', 'LT6'),
  ('GD 1 TANGGA DARURAT TIMUR LT 7', 'LT7'),
  ('GD 1 TANGGA DARURAT TIMUR LT 8', 'LT8'),
  ('GD 1 TANGGA DARURAT TIMUR LT 9', 'LT9')
ON CONFLICT (sourcename) DO UPDATE SET level = EXCLUDED.level;

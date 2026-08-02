-- ============================================================================
-- Skema Postgres "wellness" (dibaca dashboard, diisi worker sync dari rpt_trx).
-- Dijalankan otomatis saat container Postgres pertama kali init.
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
  id         TEXT PRIMARY KEY,   -- extsysid (NIP)
  name       TEXT,
  card       BIGINT,
  unit       TEXT,
  persona    TEXT,
  office     TEXT,
  gender     CHAR(1),
  weight_kg  INTEGER,
  height_cm  INTEGER,
  basement   TEXT,
  is_real    BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS taps (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMP NOT NULL,   -- jam WIB (dari trxdate)
  employee_id TEXT NOT NULL,
  level       TEXT NOT NULL,        -- B2,B1,LT1..LT16
  device      TEXT,                 -- sourcename reader
  kind        TEXT NOT NULL DEFAULT 'stair',
  UNIQUE (employee_id, ts, device)  -- idempotent: sync ulang tak menduplikasi
);
CREATE INDEX IF NOT EXISTS idx_taps_emp_ts ON taps (employee_id, ts);
CREATE INDEX IF NOT EXISTS idx_taps_ts     ON taps (ts);

-- master reader tangga (sourcename → lantai)
CREATE TABLE IF NOT EXISTS stair_reader (
  sourcename TEXT PRIMARY KEY,
  level      TEXT NOT NULL
);

-- watermark sync (trxdate terakhir yang sudah ditarik)
CREATE TABLE IF NOT EXISTS sync_state (
  source        TEXT PRIMARY KEY,
  last_trxdate  BIGINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

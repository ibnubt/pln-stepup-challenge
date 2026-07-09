// ============================================================================
// Generator SQL seed untuk PostgreSQL — dari taps.json + employees.json
// Output: db/seed.sql  (CREATE TABLE + INSERT). Jalankan: npm run gen:sql
// Import ke server: psql "postgres://user:pass@host:5432/db" -f db/seed.sql
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "src", "data");
const OUT_DIR = path.join(__dirname, "..", "db");

const employees = JSON.parse(fs.readFileSync(path.join(DATA, "employees.json"), "utf8"));
const taps = JSON.parse(fs.readFileSync(path.join(DATA, "taps.json"), "utf8"));

const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const b = (v) => (v ? "TRUE" : "FALSE");
const n = (v) => (v === null || v === undefined ? "NULL" : Number(v));
const ts = (t) => `'${t.replace("T", " ")}'`; // 2026-07-01T06:43:00 -> '2026-07-01 06:43:00'

let sql = `-- ============================================================================
-- PLN Wellness — Program Naik Tangga · seed data (PostgreSQL)
-- Generated dari data sintetis. Rentang: ${taps[0].t} .. ${taps[taps.length - 1].t}
-- Import:  psql "postgres://user:pass@host:5432/dbname" -f db/seed.sql
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS taps CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

CREATE TABLE employees (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  card       INTEGER,
  unit       TEXT,
  persona    TEXT,            -- kebiasaan: champion|regular|occasional|rare
  office     TEXT,            -- lantai kantor (mis. LT12)
  gender     CHAR(1),         -- L | P
  weight_kg  INTEGER,         -- rujukan Kemenkes AKG 2019
  height_cm  INTEGER,
  basement   TEXT,            -- lokasi parkir basement (B1/B2) atau NULL
  is_real    BOOLEAN DEFAULT FALSE
);

CREATE TABLE taps (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMP NOT NULL,      -- waktu lokal (WIB)
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  level       TEXT NOT NULL,           -- B2,B1,LT1..LT15
  device      TEXT,                    -- nama reader/checkpoint
  kind        TEXT NOT NULL CHECK (kind IN ('stair','lift'))
);

CREATE INDEX idx_taps_emp_ts ON taps (employee_id, ts);
CREATE INDEX idx_taps_kind   ON taps (kind);
CREATE INDEX idx_taps_ts     ON taps (ts);

-- ---- Employees (${employees.length}) ----
INSERT INTO employees (id, name, card, unit, persona, office, gender, weight_kg, height_cm, basement, is_real) VALUES
`;

sql += employees
  .map(
    (e) =>
      `(${q(e.id)}, ${q(e.name)}, ${n(e.card)}, ${q(e.unit)}, ${q(e.persona)}, ${q(e.office)}, ${q(
        e.gender
      )}, ${n(e.weight)}, ${n(e.height)}, ${q(e.basement)}, ${b(e.real)})`
  )
  .join(",\n") + ";\n\n";

// ---- Taps (batched multi-row INSERT) ----
sql += `-- ---- Taps (${taps.length}) ----\n`;
const BATCH = 500;
for (let i = 0; i < taps.length; i += BATCH) {
  const chunk = taps.slice(i, i + BATCH);
  sql += "INSERT INTO taps (ts, employee_id, level, device, kind) VALUES\n";
  sql +=
    chunk
      .map((t) => `(${ts(t.t)}, ${q(t.e)}, ${q(t.lvl)}, ${q(t.dev)}, ${q(t.kind)})`)
      .join(",\n") + ";\n";
}

sql += `
COMMIT;

-- Ringkasan: ${employees.length} pegawai, ${taps.length} tap events.
-- Cek: SELECT kind, COUNT(*) FROM taps GROUP BY kind;
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "seed.sql"), sql);
console.log(
  `✓ db/seed.sql — ${employees.length} pegawai, ${taps.length} taps (${(sql.length / 1024).toFixed(0)} KB)`
);

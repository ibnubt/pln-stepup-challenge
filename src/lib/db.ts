// ============================================================================
// Adapter baca data dari PostgreSQL (tabel bersih `taps` + `employees`).
// Diaktifkan bila env DATA_SOURCE=db. Kalau tidak, app pakai JSON (demo).
// Tabel diisi oleh db/seed.sql (demo) atau db/etl-rpt-alltrx.sql (real).
// ============================================================================
import { Pool } from "pg";
import { IMPACT } from "./config";
import type { Tap, Employee } from "./scoring";

let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL, // postgres://user:pass@host:5432/db
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 4,
    });
  }
  return pool;
}

export async function loadFromDb(): Promise<{ taps: Tap[]; employees: Employee[] }> {
  const p = getPool();
  const [t, e] = await Promise.all([
    // ts diformat sebagai teks (hindari ambiguitas timezone di driver) — sudah jam WIB
    p.query(
      `SELECT to_char(ts, 'YYYY-MM-DD"T"HH24:MI:SS') AS t,
              employee_id AS e, level AS lvl, device AS dev, kind
         FROM taps ORDER BY ts`
    ),
    p.query(
      `SELECT id, name, card, unit, persona, office,
              gender, weight_kg, height_cm, basement, is_real
         FROM employees`
    ),
  ]);

  const taps: Tap[] = t.rows.map((r) => ({
    t: r.t,
    e: r.e,
    lvl: r.lvl,
    dev: r.dev,
    kind: r.kind === "lift" ? "lift" : "stair",
  }));

  const employees: Employee[] = e.rows.map((r) => ({
    id: r.id,
    name: r.name ?? r.id,
    card: Number(r.card ?? 0),
    unit: r.unit ?? "-",
    persona: r.persona ?? "regular",
    office: r.office ?? "LT1",
    gender: r.gender === "P" ? "P" : "L",
    weight: Number(r.weight_kg ?? IMPACT.avgBodyWeightKg),
    height: Number(r.height_cm ?? 165),
    basement: r.basement ?? null,
    real: r.is_real ?? true,
  }));

  return { taps, employees };
}

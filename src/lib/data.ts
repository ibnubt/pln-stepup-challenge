import tapsRaw from "@/data/taps.json";
import employeesRaw from "@/data/employees.json";
import { computeScores, type Tap, type Employee } from "./scoring";

// Sumber data:
//   default        → JSON demo (src/data/*.json) — statis, tanpa DB
//   DATA_SOURCE=db → PostgreSQL (tabel taps/employees) via src/lib/db.ts
//
// Cache: JSON di-cache selamanya (statis); mode DB pakai TTL pendek agar
// dashboard ikut update saat worker sync menambah tap baru (near-realtime).
const IS_DB = process.env.DATA_SOURCE === "db";
const TTL_MS = IS_DB ? Number(process.env.DASHBOARD_TTL_SEC || 10) * 1000 : Infinity;

let cache: { at: number; result: ReturnType<typeof computeScores> } | null = null;

export async function getScores() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.result;

  let taps: Tap[];
  let employees: Employee[];

  if (IS_DB) {
    try {
      const { loadFromDb } = await import("./db");
      ({ taps, employees } = await loadFromDb());
    } catch (e) {
      // DB error (mis. koneksi penuh/transien) → sajikan data terakhir bila ada,
      // jangan bikin halaman crash ("server-side exception").
      if (cache) return cache.result;
      throw e;
    }
  } else {
    taps = tapsRaw as Tap[];
    employees = employeesRaw as Employee[];
  }

  const result = computeScores(taps, employees);
  cache = { at: Date.now(), result };
  return result;
}

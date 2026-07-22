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

// cache data mentah (TTL) + cache skor per-bulan (dihitung ulang saat data mentah refresh)
let rawCache: { at: number; taps: Tap[]; employees: Employee[] } | null = null;
const scoreCache = new Map<string, { rawAt: number; result: ReturnType<typeof computeScores> }>();

async function loadRaw() {
  if (rawCache && Date.now() - rawCache.at < TTL_MS) return rawCache;
  let taps: Tap[];
  let employees: Employee[];
  if (IS_DB) {
    try {
      const { loadFromDb } = await import("./db");
      ({ taps, employees } = await loadFromDb());
    } catch (e) {
      // DB error (mis. koneksi penuh/transien) → sajikan data terakhir bila ada,
      // jangan bikin halaman crash ("server-side exception").
      if (rawCache) return rawCache;
      throw e;
    }
  } else {
    taps = tapsRaw as Tap[];
    employees = employeesRaw as Employee[];
  }
  rawCache = { at: Date.now(), taps, employees };
  return rawCache;
}

/** month = "YYYY-MM" (opsional). Default: bulan berjalan. */
export async function getScores(month?: string) {
  const raw = await loadRaw();
  const key = month || "current";
  const cached = scoreCache.get(key);
  if (cached && cached.rawAt === raw.at) return cached.result; // valid selama data mentah belum refresh
  const result = computeScores(raw.taps, raw.employees, { month, programStart: process.env.PROGRAM_START });
  scoreCache.set(key, { rawAt: raw.at, result });
  return result;
}

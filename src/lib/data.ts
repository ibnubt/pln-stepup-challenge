import tapsRaw from "@/data/taps.json";
import employeesRaw from "@/data/employees.json";
import { computeScores, type Tap, type Employee } from "./scoring";

// Sumber data:
//   default        → JSON demo (src/data/*.json) — statis, tanpa DB
//   DATA_SOURCE=db → PostgreSQL (tabel taps/employees) via src/lib/db.ts
let cached: ReturnType<typeof computeScores> | null = null;

export async function getScores() {
  if (cached) return cached;

  let taps: Tap[];
  let employees: Employee[];

  if (process.env.DATA_SOURCE === "db") {
    const { loadFromDb } = await import("./db");
    ({ taps, employees } = await loadFromDb());
  } else {
    taps = tapsRaw as Tap[];
    employees = employeesRaw as Employee[];
  }

  cached = computeScores(taps, employees);
  return cached;
}

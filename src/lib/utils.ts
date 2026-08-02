import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number, digits = 0) {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Geser tanggal "YYYY-MM-DD" sebanyak n hari (bisa negatif). */
export function dateShift(dateStr: string, n: number) {
  const dt = new Date(dateStr + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** Tanggal SENIN pada minggu yang memuat `dateStr` (awal minggu berjalan). */
export function startOfWeek(dateStr: string) {
  const dow = new Date(dateStr + "T00:00:00Z").getUTCDay(); // 0=Min .. 6=Sab
  const back = (dow + 6) % 7; // mundur ke Senin (Sen→0, Sel→1, … Min→6)
  return dateShift(dateStr, -back);
}

const BULAN_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/** Label bulan Indonesia dari "YYYY-MM" → mis. "Juli 2026". */
export function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const idx = Number(m) - 1;
  return `${BULAN_ID[idx] ?? m} ${y}`;
}

// ---- Periode "siklus" (reset tiap tanggal RESET_DAY), mis. 23 → 22 bulan berikutnya ----
const BULAN_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Kunci siklus "YYYY-MM" = bulan tempat siklus DIMULAI (hari resetDay) yang memuat `dateStr`. */
export function cycleKeyOf(dateStr: string, resetDay: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (d >= resetDay) return `${y}-${pad2(m)}`;
  const prev = new Date(Date.UTC(y, m - 2, 1)); // (m-1)=bln ini 0-based, -1 = bln lalu
  return `${prev.getUTCFullYear()}-${pad2(prev.getUTCMonth() + 1)}`;
}

/** Jendela siklus [start,end] (YYYY-MM-DD, inklusif) dari kunci siklus + resetDay. */
export function cycleWindow(key: string, resetDay: number): { start: string; end: string } {
  const [y, m] = key.split("-").map(Number);
  const start = `${key}-${pad2(resetDay)}`;
  const endDt = new Date(Date.UTC(y, m, resetDay - 1)); // m (1-based) sbg 0-based = bln berikutnya
  return { start, end: `${endDt.getUTCFullYear()}-${pad2(endDt.getUTCMonth() + 1)}-${pad2(endDt.getUTCDate())}` };
}

/** Label periode dari jendela: "23 Jul – 22 Agu 2026" (tahun ditulis sekali bila sama). */
export function periodLabel(start: string, end: string): string {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const left = `${ds} ${BULAN_SHORT[ms - 1]}${ys !== ye ? ` ${ys}` : ""}`;
  const right = `${de} ${BULAN_SHORT[me - 1]} ${ye}`;
  return `${left} – ${right}`;
}

/** Label periode langsung dari kunci siklus + resetDay. */
export function cycleLabel(key: string, resetDay: number): string {
  const { start, end } = cycleWindow(key, resetDay);
  return periodLabel(start, end);
}

export function fmtCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "jt";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "rb";
  return fmt(n);
}

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

export function fmtCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "jt";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "rb";
  return fmt(n);
}

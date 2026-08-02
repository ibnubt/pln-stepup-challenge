import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";
import { getRecap } from "@/lib/data";
import { AUTH_COOKIE } from "@/lib/auth";
import { cycleWindow, cycleKeyOf } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const YM = /^\d{4}-\d{2}$/;
const RESET_DAY = Math.min(28, Math.max(1, Number(process.env.RESET_DAY) || 1));

function wibNow() {
  return new Date(Date.now() + 7 * 3600 * 1000);
}
// jendela periode dari kunci siklus "YYYY-MM"
function periodBounds(ym: string) {
  const { start, end } = cycleWindow(ym, RESET_DAY);
  return { from: start, to: end };
}
function currentPeriodBounds() {
  const n = wibNow();
  const today = `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}-${String(n.getUTCDate()).padStart(2, "0")}`;
  return periodBounds(cycleKeyOf(today, RESET_DAY));
}

// warna (ARGB)
const NAVY = "FF12395B", NAVY2 = "FF1D5286", GOLD = "FFFFC72C", ZEBRA = "FFEEF3F8", WHITE = "FFFFFFFF", INK = "FF1F2A37";

export async function GET(req: NextRequest) {
  // /api tidak lewat middleware → cek auth di sini (isi rekap = data internal pegawai)
  if (req.cookies.get(AUTH_COOKIE)?.value !== "1") {
    return new Response("Unauthorized", { status: 401 });
  }
  const q = req.nextUrl.searchParams;
  let from = q.get("from") || "";
  let to = q.get("to") || "";
  const month = q.get("month") || "";

  if (YM.test(month)) {
    ({ from, to } = periodBounds(month));
  } else if (!(ISO.test(from) && ISO.test(to))) {
    ({ from, to } = currentPeriodBounds());
  }
  if (from > to) [from, to] = [to, from];

  const { rows, totals } = await getRecap(from, to);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rekap Tim", { views: [{ state: "frozen", ySplit: 5 }] });
  const headers = [
    { h: "No", w: 5, num: false },
    { h: "Nama", w: 30, num: false },
    { h: "Unit", w: 18, num: false },
    { h: "Status", w: 15, num: false },
    { h: "Hari Aktif", w: 11, num: true },
    { h: "Naik (lt)", w: 11, num: true },
    { h: "Turun (lt)", w: 11, num: true },
    { h: "Anak Tangga", w: 13, num: true },
    { h: "Poin", w: 12, num: true },
    { h: "Best Streak", w: 11, num: true },
    { h: "Lift Dihindari (kali)", w: 16, num: true },
  ];
  ws.columns = headers.map((c) => ({ width: c.w }));
  const NC = headers.length;

  // baris 1: judul
  ws.mergeCells(1, 1, 1, NC);
  const t = ws.getCell(1, 1);
  t.value = "REKAP TIM — PLN Step Up Challenge";
  t.font = { name: "Segoe UI", size: 15, bold: true, color: { argb: WHITE } };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  t.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 30;
  // baris 2: aksen emas
  ws.mergeCells(2, 1, 2, NC);
  ws.getCell(2, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
  ws.getRow(2).height = 4;
  // baris 3: periode
  ws.mergeCells(3, 1, 3, NC);
  const sub = ws.getCell(3, 1);
  sub.value = `Periode: ${from} s/d ${to}   ·   ${totals.participants} partisipan`;
  sub.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: NAVY } };
  sub.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(3).height = 20;
  ws.getRow(4).height = 6; // spacer

  // baris 5: header tabel
  const HR = 5;
  const hrow = ws.getRow(HR);
  headers.forEach((c, i) => {
    const cell = hrow.getCell(i + 1);
    cell.value = c.h;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY2 } };
    cell.alignment = { vertical: "middle", horizontal: c.num ? "center" : "left", wrapText: true, indent: c.num ? 0 : 1 };
  });
  hrow.height = 26;

  // data
  rows.forEach((r, idx) => {
    const rowIdx = HR + 1 + idx;
    const vals = [r.rank, r.name, r.unit, r.status, r.activeDays, r.upFloors, r.downFloors, r.stairSteps, r.points, r.longestStreak, r.liftAvoided];
    const row = ws.getRow(rowIdx);
    vals.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v as any;
      cell.font = { name: "Segoe UI", size: 10, color: { argb: INK } };
      cell.alignment = { vertical: "middle", horizontal: headers[i].num ? "center" : "left", indent: headers[i].num ? 0 : 1 };
      cell.border = { bottom: { style: "thin", color: { argb: "FFD7DEE6" } } };
      if (headers[i].num && i >= 7) cell.numFmt = "#,##0"; // anak tangga, poin, dst
      if (idx % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
    });
    row.height = 20;
  });

  // baris total
  const TR = HR + 1 + rows.length;
  const trow = ws.getRow(TR);
  const totalVals = ["", "TOTAL", "", "", "", totals.upFloors, totals.downFloors, totals.stairSteps, totals.points, "", totals.liftAvoided];
  totalVals.forEach((v, i) => {
    const cell = trow.getCell(i + 1);
    cell.value = v as any;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: i >= 5 ? GOLD : WHITE } };
    cell.alignment = { vertical: "middle", horizontal: i === 1 ? "left" : "center", indent: i === 1 ? 1 : 0 };
    if (typeof v === "number") cell.numFmt = "#,##0";
  });
  trow.height = 26;

  const buf = await wb.xlsx.writeBuffer();
  const fname = `Rekap_Tim_${from}_sd_${to}.xlsx`;
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
    },
  });
}

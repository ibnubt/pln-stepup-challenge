"use client";

// Tombol export rekap tim (XLSX): mode Per Bulan atau Rentang Tanggal.
import { useState } from "react";
import { Download } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const mLabel = (m: string) => {
  const [y, mo] = m.split("-");
  return `${MONTHS[Number(mo) - 1]} ${y}`;
};

export function ExportControl({ month, availableMonths }: { month: string; availableMonths: string[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"bulan" | "rentang">("bulan");
  const months = availableMonths.includes(month) ? availableMonths : [month, ...availableMonths];
  const [selMonth, setSelMonth] = useState(month);
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const [from, setFrom] = useState(`${month}-01`);
  const [to, setTo] = useState(today);

  const download = () => {
    const url = mode === "bulan" ? `/api/export?month=${selMonth}` : `/api/export?from=${from}&to=${to}`;
    window.location.href = url;
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Export rekap tim (XLSX)"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-lg">
            <div className="mb-2 text-xs font-semibold text-foreground">Export Rekap Tim (XLSX)</div>
            <div className="mb-3 flex rounded-lg border border-border p-0.5 text-xs">
              {(["bulan", "rentang"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "bulan" ? "Per Bulan" : "Rentang Tanggal"}
                </button>
              ))}
            </div>
            {mode === "bulan" ? (
              <select
                value={selMonth}
                onChange={(e) => setSelMonth(e.target.value)}
                className="mb-3 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {mLabel(m)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <label className="text-[11px] text-muted-foreground">
                  Dari
                  <input
                    type="date"
                    value={from}
                    max={to}
                    onChange={(e) => setFrom(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
                  />
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Sampai
                  <input
                    type="date"
                    value={to}
                    min={from}
                    max={today}
                    onChange={(e) => setTo(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
                  />
                </label>
              </div>
            )}
            <button
              onClick={download}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" /> Unduh XLSX
            </button>
          </div>
        </>
      )}
    </div>
  );
}

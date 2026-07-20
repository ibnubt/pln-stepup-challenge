import type { EmployeeStat } from "@/lib/scoring";
import { fmt } from "@/lib/utils";
import { Flame, Trophy } from "lucide-react";

const MEDAL = ["#ffcb05", "#c0c6ce", "#c2803f"];

/** Leaderboard read-only untuk layar display (kanvas tetap, di-skala oleh FitScreen). */
export function BoardLeaderboard({
  stats,
  limit = 10,
  title = "Leaderboard",
  subtitle = "Peringkat Pegawai",
}: {
  stats: EmployeeStat[];
  limit?: number;
  title?: string;
  subtitle?: string;
}) {
  const rows = [...stats].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, limit);
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-6 py-4">
        <Trophy className="h-6 w-6 shrink-0 text-pln-gold" />
        <h2 className="truncate text-2xl font-bold tracking-tight">{title}</h2>
        <span className="ml-auto shrink-0 text-sm font-medium uppercase tracking-wider text-muted-foreground">{subtitle}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border/60">
        {rows.length === 0 && <div className="flex flex-1 items-center justify-center text-lg text-muted-foreground">Belum ada data</div>}
        {rows.map((s, i) => {
          const rank = i + 1;
          const name = s.emp.name.replace(/ — .*/, "");
          return (
            <div key={s.emp.id} className="flex min-h-0 flex-1 items-center gap-3 px-6">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                style={rank <= 3 ? { background: `${MEDAL[rank - 1]}22`, color: MEDAL[rank - 1] } : { color: "hsl(var(--muted-foreground))" }}
              >
                {rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xl font-semibold leading-tight">{name}</div>
                <div className="flex items-center gap-1.5 truncate text-sm leading-tight text-muted-foreground">
                  <span className={s.isPln ? "text-primary" : ""}>{s.isPln ? "PLN" : "Non"}</span>
                  <span className="opacity-50">·</span>
                  <span className="truncate">{s.emp.unit || "-"}</span>
                </div>
              </div>
              <span className="flex w-14 shrink-0 items-center justify-end gap-1 text-lg font-bold text-[hsl(var(--warning))]">
                {s.longestStreak > 0 && <Flame className="h-5 w-5" />}
                {s.longestStreak}
              </span>
              <span className="tabular w-24 shrink-0 text-right text-lg text-[hsl(var(--success))]">{fmt(s.upFloors)} lt</span>
              <span className="tabular w-28 shrink-0 text-right text-2xl font-extrabold text-foreground">{fmt(s.totalPoints)}</span>
            </div>
          );
        })}
        {/* baris pengisi agar tinggi baris konsisten & kartu terisi penuh (kedua leaderboard sama) */}
        {Array.from({ length: Math.max(0, limit - rows.length) }).map((_, k) => (
          <div key={`fill-${k}`} className="flex min-h-0 flex-1 items-center gap-3 px-6 opacity-25">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-muted-foreground">{rows.length + k + 1}</span>
            <div className="flex-1 text-lg text-muted-foreground">—</div>
          </div>
        ))}
      </div>
    </div>
  );
}

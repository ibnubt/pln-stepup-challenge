import type { EmployeeStat } from "@/lib/scoring";
import { fmt } from "@/lib/utils";
import { Flame, Trophy } from "lucide-react";

const MEDAL = ["#ffcb05", "#c0c6ce", "#c2803f"];

/** Leaderboard read-only untuk layar display (top N, tanpa interaksi). */
export function BoardLeaderboard({ stats, limit = 10 }: { stats: EmployeeStat[]; limit?: number }) {
  const rows = [...stats].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, limit);
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Trophy className="h-5 w-5 text-pln-gold" />
        <h2 className="text-lg font-bold tracking-tight">Leaderboard</h2>
        <span className="ml-auto text-xs font-medium uppercase tracking-wider text-muted-foreground">Peringkat Pegawai</span>
      </div>
      <div className="flex-1 divide-y divide-border/60">
        {rows.map((s, i) => {
          const rank = i + 1;
          const name = s.emp.name.replace(/ — .*/, "");
          return (
            <div key={s.emp.id} className="flex items-center gap-3 px-5 py-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={
                  rank <= 3
                    ? { background: `${MEDAL[rank - 1]}22`, color: MEDAL[rank - 1] }
                    : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold leading-tight">{name}</div>
                <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <span className={s.isPln ? "text-primary" : ""}>{s.isPln ? "PLN" : "Non"}</span>
                  <span className="opacity-50">·</span>
                  <span className="truncate">{s.emp.unit || "-"}</span>
                </div>
              </div>
              <span className="tabular flex w-16 shrink-0 items-center justify-end gap-1 text-sm font-bold text-[hsl(var(--warning))]">
                {s.longestStreak > 0 && <Flame className="h-4 w-4" />}
                {s.longestStreak}
              </span>
              <span className="tabular w-20 shrink-0 text-right text-sm text-[hsl(var(--success))]">{fmt(s.upFloors)} lt</span>
              <span className="tabular w-24 shrink-0 text-right text-lg font-extrabold text-foreground">{fmt(s.totalPoints)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

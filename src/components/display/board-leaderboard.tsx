import type { EmployeeStat } from "@/lib/scoring";
import { fmt } from "@/lib/utils";
import { Flame, Trophy, ArrowUp, ArrowDown } from "lucide-react";

const MEDAL = ["#ffcb05", "#c0c6ce", "#c2803f"];

/** Leaderboard read-only untuk layar display — baris 2-baris (nama tak terpotong). */
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
        {rows.map((s, i) => {
          const rank = i + 1;
          const name = s.emp.name.replace(/ — .*/, "");
          const up = s.upFloorsRaw;
          const down = s.downFloorsRaw;
          return (
            <div key={s.emp.id} className="flex min-h-0 flex-1 items-center gap-3 px-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                style={rank <= 3 ? { background: `${MEDAL[rank - 1]}22`, color: MEDAL[rank - 1] } : { color: "hsl(var(--muted-foreground))" }}
              >
                {rank}
              </span>
              <div className="min-w-0 flex-1">
                {/* baris 1: nama + badge */}
                <div className="flex items-center gap-2">
                  <span className="truncate text-xl font-bold leading-tight">{name}</span>
                  <span className="shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: `${s.tier.color}22`, color: s.tier.color }}>
                    {s.tier.emoji} {s.tier.name}
                  </span>
                </div>
                {/* baris 2: status · streak · naik/turun */}
                <div className="mt-0.5 flex items-center gap-3 text-sm leading-tight text-muted-foreground">
                  <span className="truncate">
                    <span className={s.isPln ? "font-semibold text-primary" : "font-semibold"}>{s.isPln ? "PLN" : "Non"}</span> · {s.emp.unit || "-"}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[hsl(var(--warning))]">
                    <Flame className="h-4 w-4" />
                    {s.longestStreak}
                  </span>
                  <span className="tabular flex shrink-0 items-center gap-0.5">
                    <ArrowUp className="h-4 w-4 text-[hsl(var(--success))]" />
                    {fmt(up)}
                    <ArrowDown className="ml-1 h-4 w-4 text-primary" />
                    {fmt(down)} lt
                  </span>
                </div>
              </div>
              <span className="tabular shrink-0 text-2xl font-extrabold text-foreground">{fmt(s.totalPoints)}</span>
            </div>
          );
        })}
        {/* baris pengisi agar tinggi konsisten & kartu terisi penuh */}
        {Array.from({ length: Math.max(0, limit - rows.length) }).map((_, k) => (
          <div key={`fill-${k}`} className="flex min-h-0 flex-1 items-center gap-3 px-5 opacity-25">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-muted-foreground">{rows.length + k + 1}</span>
            <div className="flex-1 text-lg text-muted-foreground">—</div>
          </div>
        ))}
      </div>
    </div>
  );
}

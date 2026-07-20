import type { EmployeeStat } from "@/lib/scoring";
import { fmt } from "@/lib/utils";
import { Flame, Trophy } from "lucide-react";

const MEDAL = ["#ffcb05", "#c0c6ce", "#c2803f"];

/** Leaderboard read-only fluid untuk layar display (top N, tanpa interaksi). */
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
      <div className="flex shrink-0 items-center gap-2 border-b border-border" style={{ padding: "1vmin 1.5vmin" }}>
        <Trophy style={{ width: "2.3vmin", height: "2.3vmin" }} className="shrink-0 text-pln-gold" />
        <h2 className="truncate font-bold tracking-tight" style={{ fontSize: "clamp(0.85rem,2.3vmin,2rem)" }}>{title}</h2>
        <span className="ml-auto shrink-0 font-medium uppercase tracking-wider text-muted-foreground" style={{ fontSize: "clamp(0.5rem,1.15vmin,0.95rem)" }}>
          {subtitle}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border/60">
        {rows.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground" style={{ fontSize: "clamp(0.7rem,1.6vmin,1.2rem)" }}>
            Belum ada data
          </div>
        )}
        {rows.map((s, i) => {
          const rank = i + 1;
          const name = s.emp.name.replace(/ — .*/, "");
          return (
            <div key={s.emp.id} className="flex min-h-0 flex-1 items-center overflow-hidden" style={{ gap: "1vmin", padding: "0 1.5vmin" }}>
              <span
                className="flex shrink-0 items-center justify-center rounded-full font-bold"
                style={{
                  width: "3.2vmin",
                  height: "3.2vmin",
                  fontSize: "clamp(0.6rem,1.6vmin,1.3rem)",
                  ...(rank <= 3 ? { background: `${MEDAL[rank - 1]}22`, color: MEDAL[rank - 1] } : { color: "hsl(var(--muted-foreground))" }),
                }}
              >
                {rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold leading-tight" style={{ fontSize: "clamp(0.72rem,2vmin,1.6rem)" }}>{name}</div>
                <div className="flex items-center gap-1 truncate leading-tight text-muted-foreground" style={{ fontSize: "clamp(0.5rem,1.15vmin,0.95rem)" }}>
                  <span className={s.isPln ? "text-primary" : ""}>{s.isPln ? "PLN" : "Non"}</span>
                  <span className="opacity-50">·</span>
                  <span className="truncate">{s.emp.unit || "-"}</span>
                </div>
              </div>
              <span className="tabular flex shrink-0 items-center gap-1 font-bold text-[hsl(var(--warning))]" style={{ fontSize: "clamp(0.62rem,1.7vmin,1.4rem)" }}>
                {s.longestStreak > 0 && <Flame style={{ width: "1.9vmin", height: "1.9vmin" }} />}
                {s.longestStreak}
              </span>
              <span className="tabular shrink-0 text-right text-[hsl(var(--success))]" style={{ fontSize: "clamp(0.6rem,1.6vmin,1.3rem)", width: "8vmin" }}>{fmt(s.upFloors)} lt</span>
              <span className="tabular shrink-0 text-right font-extrabold text-foreground" style={{ fontSize: "clamp(0.82rem,2.1vmin,1.8rem)", width: "10vmin" }}>{fmt(s.totalPoints)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { LEVELS, levelIndex, CHECKPOINT_MIN_IDX, CHECKPOINT_MAX_IDX, LIFT_MIN_IDX } from "@/lib/config";
import { cn, fmt, dateShift } from "@/lib/utils";
import { Building2 } from "lucide-react";

/** Peta vertikal gedung read-only fluid — agregasi 7 hari terakhir. */
export function BoardFloorMap({
  data,
  today,
}: {
  data: { level: string; date: string; stair: number; lift: number }[];
  today: string;
}) {
  const lo = dateShift(today, -6);
  const agg = new Map<string, number>();
  for (const d of data) {
    if (d.date < lo || d.date > today) continue;
    agg.set(d.level, (agg.get(d.level) ?? 0) + d.stair);
  }
  const max = Math.max(1, ...Array.from(agg.values(), (v) => v));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex shrink-0 items-center gap-2 border-b border-border" style={{ padding: "1vmin 1.5vmin" }}>
        <Building2 style={{ width: "2.3vmin", height: "2.3vmin" }} className="shrink-0 text-primary" />
        <h2 className="truncate font-bold tracking-tight" style={{ fontSize: "clamp(0.85rem,2.3vmin,2rem)" }}>Peta Vertikal Gedung</h2>
        <span className="ml-auto shrink-0 font-medium uppercase tracking-wider text-muted-foreground" style={{ fontSize: "clamp(0.5rem,1.15vmin,0.95rem)" }}>7 hari</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col" style={{ padding: "0.8vmin 1.2vmin", gap: "0.35vmin" }}>
        {[...LEVELS].reverse().map((lvl) => {
          const idx = levelIndex(lvl);
          const stair = agg.get(lvl) ?? 0;
          const isCp = idx >= CHECKPOINT_MIN_IDX && idx <= CHECKPOINT_MAX_IDX;
          const isBasement = idx < LIFT_MIN_IDX;
          const pct = (stair / max) * 100;
          return (
            <div key={lvl} className={cn("flex min-h-0 flex-1 items-center rounded", isCp && "bg-pln-yellow/[0.07]")} style={{ gap: "1vmin", padding: "0 0.4vmin" }}>
              <span
                className={cn("tabular shrink-0 font-semibold", isCp ? "text-pln-gold" : isBasement ? "text-muted-foreground" : "text-foreground")}
                style={{ width: "6vmin", fontSize: "clamp(0.58rem,1.5vmin,1.2rem)" }}
              >
                {lvl}
              </span>
              <div className="relative h-[55%] flex-1 overflow-hidden rounded bg-muted/60">
                <div className="h-full rounded bg-gradient-to-r from-primary/70 to-primary" style={{ width: `${Math.max(pct, stair > 0 ? 4 : 0)}%` }} />
              </div>
              <span className="tabular shrink-0 text-right text-muted-foreground" style={{ width: "5vmin", fontSize: "clamp(0.55rem,1.4vmin,1.1rem)" }}>{fmt(stair)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

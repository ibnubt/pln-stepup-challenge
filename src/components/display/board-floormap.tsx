import { LEVELS, levelIndex, CHECKPOINT_MIN_IDX, CHECKPOINT_MAX_IDX, LIFT_MIN_IDX } from "@/lib/config";
import { cn, fmt, dateShift } from "@/lib/utils";
import { Building2 } from "lucide-react";

/** Peta vertikal gedung read-only untuk display — agregasi 7 hari terakhir. */
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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">Peta Vertikal Gedung</h2>
        <span className="ml-auto text-xs font-medium uppercase tracking-wider text-muted-foreground">7 hari terakhir</span>
      </div>
      <div className="flex-1 space-y-1 overflow-hidden px-4 py-3">
        {[...LEVELS].reverse().map((lvl) => {
          const idx = levelIndex(lvl);
          const stair = agg.get(lvl) ?? 0;
          const isCp = idx >= CHECKPOINT_MIN_IDX && idx <= CHECKPOINT_MAX_IDX;
          const isBasement = idx < LIFT_MIN_IDX;
          const pct = (stair / max) * 100;
          return (
            <div key={lvl} className={cn("flex items-center gap-2 rounded px-1", isCp && "bg-pln-yellow/[0.07]")}>
              <span className={cn("tabular w-12 shrink-0 text-sm font-semibold", isCp ? "text-pln-gold" : isBasement ? "text-muted-foreground" : "text-foreground")}>
                {lvl}
              </span>
              <div className="relative h-3.5 flex-1 overflow-hidden rounded bg-muted/60">
                <div className="h-full rounded bg-gradient-to-r from-primary/70 to-primary" style={{ width: `${Math.max(pct, stair > 0 ? 4 : 0)}%` }} />
              </div>
              <span className="tabular w-10 shrink-0 text-right text-sm text-muted-foreground">{fmt(stair)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

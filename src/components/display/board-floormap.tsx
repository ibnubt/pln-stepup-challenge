import { LEVELS, levelIndex, CHECKPOINT_MIN_IDX, CHECKPOINT_MAX_IDX, LIFT_MIN_IDX } from "@/lib/config";
import { cn, fmt, monthLabel } from "@/lib/utils";
import { Building2 } from "lucide-react";

/** Peta vertikal gedung read-only untuk display — agregasi bulan berjalan (month = "YYYY-MM"). */
export function BoardFloorMap({
  data,
  month,
}: {
  data: { level: string; date: string; stair: number; lift: number }[];
  month: string;
}) {
  const agg = new Map<string, number>();
  for (const d of data) {
    if (!d.date.startsWith(month)) continue;
    agg.set(d.level, (agg.get(d.level) ?? 0) + d.stair);
  }
  const max = Math.max(1, ...Array.from(agg.values(), (v) => v));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-6 py-4">
        <Building2 className="h-6 w-6 shrink-0 text-primary" />
        <h2 className="truncate text-2xl font-bold tracking-tight">Peta Vertikal Gedung</h2>
        <span className="ml-auto shrink-0 text-sm font-medium uppercase tracking-wider text-muted-foreground">{monthLabel(month)}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 px-5 py-3">
        {[...LEVELS].reverse().map((lvl) => {
          const idx = levelIndex(lvl);
          const stair = agg.get(lvl) ?? 0;
          const isCp = idx >= CHECKPOINT_MIN_IDX && idx <= CHECKPOINT_MAX_IDX;
          const isBasement = idx < LIFT_MIN_IDX;
          const pct = (stair / max) * 100;
          return (
            <div key={lvl} className={cn("flex min-h-0 flex-1 items-center gap-3 rounded px-1", isCp && "bg-pln-yellow/[0.07]")}>
              <span className={cn("w-14 shrink-0 text-base font-semibold", isCp ? "text-pln-gold" : isBasement ? "text-muted-foreground" : "text-foreground")}>
                {lvl}
              </span>
              <div className="relative h-1/2 flex-1 overflow-hidden rounded bg-muted/60">
                <div className="h-full rounded bg-gradient-to-r from-primary/70 to-primary" style={{ width: `${Math.max(pct, stair > 0 ? 4 : 0)}%` }} />
              </div>
              <span className="tabular w-12 shrink-0 text-right text-base text-muted-foreground">{fmt(stair)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import {
  LEVELS,
  LEVEL_LABEL,
  levelIndex,
  CHECKPOINT_MIN_IDX,
  CHECKPOINT_MAX_IDX,
  LIFT_MIN_IDX,
  LIFT_MAX_IDX,
  type Level,
} from "@/lib/config";
import { cn, fmt } from "@/lib/utils";
import { ArrowUpDown, MoveVertical } from "lucide-react";

export function FloorHeatmap({
  data,
}: {
  data: { level: string; stair: number; lift: number }[];
}) {
  const map = new Map(data.map((d) => [d.level, d]));
  const maxStair = Math.max(1, ...data.map((d) => d.stair));

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>
          <SectionLabel>Peta Vertikal Gedung</SectionLabel>
          <h3 className="text-sm font-semibold">Intensitas Tangga per Lantai</h3>
        </CardTitle>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm bg-primary" /> jumlah tap tangga
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-[3px]">
          {[...LEVELS].reverse().map((lvl) => {
            const idx = levelIndex(lvl);
            const d = map.get(lvl);
            const stair = d?.stair ?? 0;
            const isCp = idx >= CHECKPOINT_MIN_IDX && idx <= CHECKPOINT_MAX_IDX;
            const isBasement = idx < LIFT_MIN_IDX;
            const pct = (stair / maxStair) * 100;
            return (
              <div
                key={lvl}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-[3px] transition-colors hover:bg-muted/50",
                  isCp && "bg-pln-yellow/[0.06]"
                )}
              >
                <div className="flex w-16 shrink-0 items-center gap-1">
                  <span
                    className={cn(
                      "tabular text-[11px] font-semibold",
                      isCp ? "text-pln-gold" : isBasement ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {lvl}
                  </span>
                  {isCp && (
                    <span className="rounded-sm bg-pln-yellow/20 px-1 text-[8px] font-bold uppercase text-pln-gold">
                      CP
                    </span>
                  )}
                </div>
                <div className="relative h-4 flex-1 overflow-hidden rounded bg-muted/60">
                  <div
                    className="h-full rounded bg-gradient-to-r from-primary/70 to-primary transition-all"
                    style={{ width: `${Math.max(pct, stair > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="tabular w-10 shrink-0 text-right text-[11px] text-muted-foreground">
                  {fmt(stair)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MoveVertical className="h-3 w-3" /> {LEVELS.length} level · {LEVELS[0]} → {LEVELS[LEVELS.length - 1]}
          </span>
          <span className="flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Checkpoint reward: LT1–LT4
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

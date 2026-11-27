"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import {
  LEVELS,
  BUILDINGS,
  levelIndex,
  CHECKPOINT_MIN_IDX,
  CHECKPOINT_MAX_IDX,
  LIFT_MIN_IDX,
} from "@/lib/config";
import { cn, fmt, startOfWeek } from "@/lib/utils";
import { ArrowUpDown, MoveVertical } from "lucide-react";

// kolom: label lantai + satu kolom per gedung (lebar sama, boleh menyusut)
const GRID = { gridTemplateColumns: `3.25rem repeat(${BUILDINGS.length}, minmax(0, 1fr))` };

export function FloorHeatmap({
  data,
  today,
  showCheckpoint = true,
}: {
  data: { building: string; level: string; date: string; stair: number; lift: number }[];
  today: string;
  showCheckpoint?: boolean; // zona check-in LT1–LT4 hanya relevan untuk aturan v1
}) {
  // filter interval tanggal — default: minggu ini (sejak Senin s/d hari ini)
  const [from, setFrom] = useState(startOfWeek(today));
  const [to, setTo] = useState(today);

  const { agg, maxStair, total, perBuilding } = useMemo(() => {
    const lo = from <= to ? from : to;
    const hi = from <= to ? to : from;
    const m = new Map<string, number>();
    const pb = new Map<string, number>();
    let tot = 0;
    for (const d of data) {
      if (d.date < lo || d.date > hi) continue;
      const k = `${d.building}|${d.level}`;
      m.set(k, (m.get(k) ?? 0) + d.stair);
      pb.set(d.building, (pb.get(d.building) ?? 0) + d.stair);
      tot += d.stair;
    }
    // skala bar SAMA untuk semua gedung → panjang bar bisa dibandingkan antar-gedung
    return { agg: m, maxStair: Math.max(1, ...Array.from(m.values(), (v) => v)), total: tot, perBuilding: pb };
  }, [data, from, to]);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex-col items-stretch gap-2">
        <CardTitle>
          <SectionLabel>Peta Vertikal Gedung</SectionLabel>
          <h3 className="text-sm font-semibold">Intensitas Tangga per Lantai</h3>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          <input
            type="date"
            value={from}
            max={today}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-border bg-background px-1.5 py-1 text-[10px] outline-none focus:border-primary/50"
          />
          <span>s/d</span>
          <input
            type="date"
            value={to}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-border bg-background px-1.5 py-1 text-[10px] outline-none focus:border-primary/50"
          />
          <button
            onClick={() => {
              setFrom(startOfWeek(today));
              setTo(today);
            }}
            className="rounded-md border border-border px-1.5 py-1 transition-colors hover:text-foreground"
            title="sejak Senin minggu ini"
          >
            Minggu ini
          </button>
          <span className="ml-auto tabular">{fmt(total)} tap</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div style={GRID} className="mb-1 grid gap-x-2 px-2 text-[10px] font-semibold text-muted-foreground">
          <span />
          {BUILDINGS.map((b) => (
            <span key={b.key} className="flex items-baseline justify-between gap-1 truncate">
              <span className="truncate text-foreground">{b.name}</span>
              <span className="tabular font-normal">{fmt(perBuilding.get(b.key) ?? 0)}</span>
            </span>
          ))}
        </div>
        <div className="space-y-[3px]">
          {[...LEVELS].reverse().map((lvl) => {
            const idx = levelIndex(lvl);
            const isCp = showCheckpoint && idx >= CHECKPOINT_MIN_IDX && idx <= CHECKPOINT_MAX_IDX;
            const isBasement = idx < LIFT_MIN_IDX;
            return (
              <div
                key={lvl}
                style={GRID}
                className={cn(
                  "group grid items-center gap-x-2 rounded-md px-2 py-[3px] transition-colors hover:bg-muted/50",
                  isCp && "bg-pln-yellow/[0.06]"
                )}
              >
                <div className="flex items-center gap-1">
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
                {BUILDINGS.map((b) => {
                  if (!b.levels.includes(lvl)) return <span key={b.key} className="h-4" />; // lantai tak ada di gedung ini
                  const stair = agg.get(`${b.key}|${lvl}`) ?? 0;
                  const pct = (stair / maxStair) * 100;
                  return (
                    <div key={b.key} className="flex min-w-0 items-center gap-1.5">
                      <div className="relative h-4 min-w-0 flex-1 overflow-hidden rounded bg-muted/60">
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
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MoveVertical className="h-3 w-3" />
            {BUILDINGS.map((b) => `${b.name} ${b.levels[0]}–${b.levels[b.levels.length - 1]}`).join(" · ")}
          </span>
          {showCheckpoint && (
            <span className="flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" /> Checkpoint reward: LT1–LT4
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

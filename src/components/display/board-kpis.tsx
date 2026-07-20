import { fmt } from "@/lib/utils";
import type { ScoreResult } from "@/lib/scoring";
import { Users, TrendingUp, Trophy, Footprints, Leaf, Flame } from "lucide-react";

/** 6 KPI tile besar untuk layar display. */
export function BoardKpis({ kpi, className = "" }: { kpi: ScoreResult["kpi"]; className?: string }) {
  const items = [
    { label: "Pegawai Aktif", value: fmt(kpi.activeEmployees), icon: Users, accent: "212 82% 50%" },
    { label: "Lantai Naik", value: fmt(kpi.upFloors), icon: TrendingUp, accent: "152 62% 40%" },
    { label: "Total Poin", value: fmt(kpi.totalPoints), icon: Trophy, accent: "45 100% 51%" },
    { label: "Lift Dihindari", value: fmt(kpi.liftRidesAvoided), icon: Footprints, accent: "199 89% 55%" },
    { label: "CO₂ Dihindari", value: `${fmt(kpi.co2KgAvoided, 2)} kg`, icon: Leaf, accent: "152 62% 40%" },
    { label: "Kalori Terbakar", value: fmt(kpi.calories), icon: Flame, accent: "24 90% 55%" },
  ];
  return (
    <div className={`grid gap-3 ${className}`}>
      {items.map((it) => {
        const accent = `hsl(${it.accent})`;
        return (
          <div key={it.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{it.label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}>
                <it.icon className="h-5 w-5" />
              </span>
            </div>
            <div className="tabular mt-2 text-4xl font-extrabold tracking-tight text-foreground xl:text-5xl">{it.value}</div>
          </div>
        );
      })}
    </div>
  );
}

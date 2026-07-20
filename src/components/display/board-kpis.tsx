import { fmt } from "@/lib/utils";
import type { ScoreResult } from "@/lib/scoring";
import { Users, TrendingUp, Trophy, Footprints, Leaf, Flame } from "lucide-react";

/** 6 KPI tile fluid (skala mengikuti ukuran layar) untuk display/kiosk. */
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
    <div className={`grid h-full ${className}`} style={{ gap: "1.1vmin" }}>
      {items.map((it) => {
        const accent = `hsl(${it.accent})`;
        return (
          <div key={it.label} className="relative flex min-h-0 flex-col justify-center overflow-hidden rounded-2xl border border-border bg-card" style={{ padding: "1.6vmin" }}>
            <div className="absolute inset-x-0 top-0" style={{ height: "0.5vmin", background: accent }} />
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-[0.1em] text-muted-foreground" style={{ fontSize: "clamp(0.55rem,1.15vmin,1rem)" }}>
                {it.label}
              </span>
              <span className="flex items-center justify-center rounded-xl" style={{ width: "3.4vmin", height: "3.4vmin", background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}>
                <it.icon style={{ width: "1.9vmin", height: "1.9vmin" }} />
              </span>
            </div>
            <div className="tabular font-extrabold leading-none tracking-tight text-foreground" style={{ fontSize: "clamp(1.3rem,4.4vmin,5rem)", marginTop: "0.8vmin" }}>
              {it.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

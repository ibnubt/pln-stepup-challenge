import { fmt } from "@/lib/utils";
import type { ScoreResult } from "@/lib/scoring";
import { Users, TrendingUp, Trophy, Footprints, Leaf, Flame } from "lucide-react";

/** 6 KPI tile untuk layar display/kiosk — ikon besar terpusat, judul besar, nilai lebih ringkas. */
export function BoardKpis({ kpi, className = "" }: { kpi: ScoreResult["kpi"]; className?: string }) {
  const items = [
    { label: "Partisipan Aktif", value: `${fmt(kpi.activeEmployees)} (${fmt(kpi.activeEmployeesPln)}/${fmt(kpi.activeEmployeesNon)})`, icon: Users, accent: "212 82% 50%" },
    { label: "Jumlah Lantai Naik/Turun", value: `${fmt(kpi.upFloors)}/${fmt(kpi.downFloors)}`, icon: TrendingUp, accent: "152 62% 40%" },
    { label: "Total Poin", value: fmt(kpi.totalPoints), icon: Trophy, accent: "45 100% 51%" },
    { label: "Sesi Lift Dihindari", value: fmt(kpi.liftRidesAvoided), icon: Footprints, accent: "199 89% 55%" },
    { label: "CO₂ Dihindari", value: `${fmt(kpi.co2KgAvoided, 2)} kg`, icon: Leaf, accent: "152 62% 40%" },
    { label: "Kalori Terbakar", value: fmt(kpi.calories), icon: Flame, accent: "24 90% 55%" },
  ];
  return (
    <div className={`grid h-full gap-4 ${className}`}>
      {items.map((it) => {
        const accent = `hsl(${it.accent})`;
        return (
          <div key={it.label} className="relative flex min-h-0 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-border bg-card px-4 py-4 text-center">
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}>
              <it.icon className="h-9 w-9" />
            </span>
            <span className="text-2xl font-bold uppercase leading-tight tracking-wide text-muted-foreground">{it.label}</span>
            <span className="tabular text-5xl font-extrabold leading-none tracking-tight text-foreground">{it.value}</span>
          </div>
        );
      })}
    </div>
  );
}

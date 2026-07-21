import { fmt } from "@/lib/utils";
import type { ScoreResult } from "@/lib/scoring";
import { Users, TrendingUp, Trophy, Footprints, Leaf, Flame } from "lucide-react";

/** 6 KPI tile untuk display/kiosk — judul besar, nilai lebih kecil, ikon besar di KANAN (centered vertikal). */
export function BoardKpis({ kpi, className = "" }: { kpi: ScoreResult["kpi"]; className?: string }) {
  const items = [
    { label: "Partisipan Aktif", value: fmt(kpi.activeEmployees), sub: `${fmt(kpi.activeEmployeesPln)}/${fmt(kpi.activeEmployeesNon)} · PLN/Non`, icon: Users, accent: "212 82% 50%" },
    { label: "Jumlah Anak Tangga", value: fmt(kpi.stairSteps), sub: "", icon: TrendingUp, accent: "152 62% 40%" },
    { label: "Total Poin", value: fmt(kpi.totalPoints), sub: "", icon: Trophy, accent: "45 100% 51%" },
    { label: "Perjalanan Lift Dihindari", value: `${fmt(kpi.liftRidesAvoided)} kali`, sub: "", icon: Footprints, accent: "199 89% 55%" },
    { label: "CO₂ Dihindari", value: `${fmt(kpi.co2KgAvoided, 2)} kg`, sub: "", icon: Leaf, accent: "152 62% 40%" },
    { label: "Kalori Terbakar", value: fmt(kpi.calories), sub: "", icon: Flame, accent: "24 90% 55%" },
  ];
  return (
    <div className={`grid h-full gap-4 ${className}`}>
      {items.map((it) => {
        const accent = `hsl(${it.accent})`;
        return (
          <div key={it.label} className="relative flex min-h-0 items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card px-6 py-4">
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-bold uppercase leading-tight tracking-wide text-muted-foreground">{it.label}</div>
              <div className="tabular mt-1.5 text-4xl font-extrabold leading-none tracking-tight text-foreground">{it.value}</div>
              {it.sub && <div className="mt-1 text-sm font-medium text-muted-foreground">{it.sub}</div>}
            </div>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center self-center rounded-2xl" style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}>
              <it.icon className="h-9 w-9" />
            </span>
          </div>
        );
      })}
    </div>
  );
}

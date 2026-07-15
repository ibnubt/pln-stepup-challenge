import { Card } from "@/components/ui/card";
import { fmt } from "@/lib/utils";
import type { ScoreResult } from "@/lib/scoring";
import {
  Users,
  TrendingUp,
  Trophy,
  Footprints,
  Leaf,
  Flame,
} from "lucide-react";

export function KpiStrip({ kpi }: { kpi: ScoreResult["kpi"] }) {
  const items = [
    {
      label: "Pegawai Aktif",
      value: fmt(kpi.activeEmployees),
      sub: `${Math.round(kpi.participation * 100)}% partisipasi · dari ${kpi.totalEmployees}`,
      icon: Users,
      accent: "212 82% 50%",
      tip: "Pegawai dengan minimal 1 hari sesi tangga valid dalam periode.",
    },
    {
      label: "Lantai Naik",
      value: fmt(kpi.upFloors),
      sub: `${fmt(kpi.downFloors)} lantai turun`,
      icon: TrendingUp,
      accent: "152 62% 40%",
      tip: "Total segmen antar-lantai yang ditempuh via tangga (sesi valid). LT1→LT4 = 3 lantai.",
    },
    {
      label: "Total Poin",
      value: fmt(kpi.totalPoints),
      sub: "reward: lantai × poin × koef progresif",
      icon: Trophy,
      accent: "45 100% 51%",
      tip: "Naik = lantai×10×koef, Turun = lantai×5×koef. Koef 1.0–2.0 progresif per-trip.",
    },
    {
      label: "Lift Dihindari",
      value: `${fmt(kpi.liftRidesAvoided)}`,
      sub: `perjalanan lift · dari sesi tangga naik+turun`,
      icon: Footprints,
      accent: "199 89% 55%",
      tip: `Tiap sesi tangga (naik/turun) = 1 perjalanan lift yang dihindari. Total ${fmt(kpi.liftRidesAvoided)} perjalanan lift 800 kg tak perlu jalan.`,
    },
    {
      label: "CO₂ Dihindari",
      value: `${fmt(kpi.co2KgAvoided, 2)} kg`,
      sub: `${fmt(kpi.energyKwhAvoided, 2)} kWh listrik lift tak terpakai`,
      icon: Leaf,
      accent: "152 62% 40%",
      tip: "(perjalanan lift dihindari × ~20 Wh/perjalanan ÷ 1000 → kWh) × faktor emisi grid 0,773 kg CO₂/kWh (proyeksi grid nasional 2025). Sumber energi: ACEEE 2005.",
    },
    {
      label: "Kalori Terbakar",
      value: fmt(kpi.calories),
      sub: `↑${fmt(kpi.caloriesUp)} naik · ↓${fmt(kpi.caloriesDown)} turun kcal`,
      icon: Flame,
      accent: "24 90% 55%",
      tip: "Berbasis berat badan tetap 60 kg (tanpa bedakan gender): naik 0.11 kcal/kg/lantai, turun 0.045 kcal/kg/lantai.",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map((it, i) => {
        const accent = `hsl(${it.accent})`;
        return (
          <Card
            key={it.label}
            title={it.tip}
            className="group relative cursor-help overflow-hidden animate-fade-in"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {it.label}
                </span>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}
                >
                  <it.icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 tabular text-2xl font-bold tracking-tight text-foreground">
                {it.value}
              </div>
              <div className="mt-1 truncate text-[11px] text-muted-foreground">{it.sub}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

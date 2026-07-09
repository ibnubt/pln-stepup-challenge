import { Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { IMPACT, ANTHRO_ID } from "@/lib/config";
import type { ScoreResult } from "@/lib/scoring";
import { fmt } from "@/lib/utils";
import { Leaf, Flame, ArrowDownUp, Car, Utensils } from "lucide-react";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular whitespace-nowrap font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ImpactCard({ kpi }: { kpi: ScoreResult["kpi"] }) {
  const carKm = kpi.co2KgAvoided / 0.12; // ~0,12 kg CO₂ / km mobil bensin
  const nasi = kpi.calories / 200; // ~200 kcal / porsi nasi
  const lariMenit = kpi.calories / 10; // ~10 kcal / menit lari
  const tonFloor = kpi.liftLoadAvoidedKgFloor / 1000;

  const panels = [
    {
      icon: ArrowDownUp,
      accent: "199 89% 55%",
      title: "Beban Lift Berkurang",
      big: fmt(kpi.liftRidesAvoided),
      bigUnit: "perjalanan lift dihindari",
      metrics: [
        ["Sesi tangga (naik + turun)", fmt(kpi.liftPersonTripsAvoided)],
        ["Beban tak dipindah lift", `${fmt(tonFloor, 1)} ton·lantai`],
        ["Kapasitas lift", `${IMPACT.liftCapacityKg} kg`],
      ],
      note: `Asumsi 1 sesi tangga = 1 perjalanan lift (okupansi belum dikoreksi → angka batas atas, menunggu koreksi lanjutan).`,
      highlight: null as null | { icon: any; text: string },
    },
    {
      icon: Leaf,
      accent: "152 62% 40%",
      title: "Emisi CO₂ Ditekan",
      big: fmt(kpi.co2KgAvoided, 2),
      bigUnit: "kg CO₂",
      metrics: [
        ["Listrik lift dihemat", `${fmt(kpi.energyKwhAvoided, 2)} kWh`],
        ["Energi per perjalanan lift", `${IMPACT.liftWhPerTrip} Wh`],
        ["Faktor emisi (ESDM 2019)", `${IMPACT.gridEfKgPerKwh} kg/kWh`],
      ],
      note: `Energi ~${IMPACT.liftWhPerTrip} Wh/perjalanan — ACEEE/Sachs 2005 (Enermodal 2004): 1.900 kWh/th ÷ 100.000 trip ≈ 19 Wh (rentang 19–30). Faktor emisi ${IMPACT.gridEfKgPerKwh} = ESDM 2019 Jamali. Emisi = perjalanan × ${IMPACT.liftWhPerTrip} Wh → kWh × ${IMPACT.gridEfKgPerKwh}.`,
      highlight: { icon: Car, text: `Setara ${fmt(carKm, 1)} km berkendara mobil` },
    },
    {
      icon: Flame,
      accent: "24 90% 55%",
      title: "Kalori Terbakar",
      big: fmt(kpi.calories),
      bigUnit: "kkal total",
      metrics: [
        ["Dari naik tangga", `${fmt(kpi.caloriesUp)} kcal`],
        ["Dari turun tangga", `${fmt(kpi.caloriesDown)} kcal`],
      ],
      note: `Pakai berat rata-rata orang Indonesia — L ${ANTHRO_ID.male.weight} kg, P ${ANTHRO_ID.female.weight} kg (${ANTHRO_ID.source}).`,
      highlight: { icon: Utensils, text: `Setara ${fmt(nasi)} porsi nasi · ${fmt(lariMenit)} menit lari` },
    },
  ];

  // Rantai konversi emisi — ISO 25745-2 → CO₂ (ditampilkan jelas di depan)
  const flow: Array<
    | { op: string }
    | { label: string; value: string; detail: string; tone: "in" | "factor" | "mid" | "out" }
  > = [
    { label: "Perjalanan lift dihindari", value: fmt(kpi.liftRidesAvoided), detail: `dari ${fmt(kpi.liftPersonTripsAvoided)} sesi tangga`, tone: "in" },
    { op: "×" },
    { label: "Energi / perjalanan", value: `${IMPACT.liftWhPerTrip} Wh`, detail: `${IMPACT.liftWhPerTripNote} · lift ${IMPACT.liftCapacityKg} kg`, tone: "factor" },
    { op: "=" },
    { label: "Total energi lift", value: `${fmt(kpi.energyKwhAvoided, 2)} kWh`, detail: `${fmt(kpi.liftRidesAvoided)} × ${IMPACT.liftWhPerTrip} Wh`, tone: "mid" },
    { op: "×" },
    { label: "Faktor emisi grid", value: `${IMPACT.gridEfKgPerKwh}`, detail: `kg CO₂/kWh · ${IMPACT.gridEfSource}`, tone: "factor" },
    { op: "=" },
    { label: "Emisi CO₂ ditekan", value: `${fmt(kpi.co2KgAvoided, 2)} kg`, detail: "hasil akhir", tone: "out" },
  ];
  const toneColor = {
    in: "hsl(199 89% 55%)",
    mid: "hsl(var(--foreground))",
    factor: "hsl(var(--muted-foreground))",
    out: "hsl(152 62% 40%)",
  } as const;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>
          <SectionLabel>Dampak Program</SectionLabel>
          <h3 className="text-sm font-semibold">Apa Untungnya? — Lift, Lingkungan &amp; Kesehatan</h3>
        </CardTitle>
      </CardHeader>

      {/* Rantai konversi emisi — jelas di depan */}
      <div className="border-b border-border bg-muted/20 px-5 py-4">
        <div className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Leaf className="h-3 w-3 text-[hsl(152_62%_40%)]" />
          Cara hitung emisi CO₂ — {IMPACT.liftEnergyRef}
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
          {flow.map((s, i) =>
            "op" in s ? (
              <span key={i} className="tabular px-0.5 text-base font-semibold text-muted-foreground/70">
                {s.op}
              </span>
            ) : (
              <div
                key={i}
                className="min-w-[104px] flex-1 rounded-lg border border-border bg-card px-3 py-2"
                style={s.tone === "out" ? { borderColor: "hsl(152 62% 40% / 0.4)", background: "hsl(152 62% 40% / 0.08)" } : undefined}
              >
                <div className="text-[9px] uppercase leading-tight tracking-wide text-muted-foreground">{s.label}</div>
                <div className="tabular text-base font-bold leading-tight" style={{ color: toneColor[s.tone] }}>
                  {s.value}
                </div>
                <div className="mt-0.5 text-[9px] leading-tight text-muted-foreground">{s.detail}</div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-3">
        {panels.map((p) => {
          const accent = `hsl(${p.accent})`;
          return (
            <div key={p.title} className="bg-card p-5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}
                >
                  <p.icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {p.title}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="tabular text-3xl font-bold tracking-tight" style={{ color: accent }}>
                  {p.big}
                </span>
                <span className="text-xs text-muted-foreground">{p.bigUnit}</span>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                {p.metrics.map(([k, v]) => (
                  <Metric key={k} label={k} value={v} />
                ))}
              </div>
              {p.highlight && (
                <div
                  className="mt-3 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium"
                  style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
                >
                  <p.highlight.icon className="h-3.5 w-3.5 shrink-0" />
                  {p.highlight.text}
                </div>
              )}
              <p className="mt-2.5 text-[10px] leading-relaxed text-muted-foreground">{p.note}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

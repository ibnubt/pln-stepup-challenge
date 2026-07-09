"use client";

import { useEffect } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { EmployeeStat } from "@/lib/scoring";
import { TierBadge } from "@/components/ui/badge";
import { tierFor, PERSONA_LABEL, PERSONA_DESC } from "@/lib/config";
import { cn, fmt } from "@/lib/utils";
import {
  X,
  Flame,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  Trophy,
  Footprints,
  Gauge,
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const shortDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};

function Stat({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
}: {
  icon: any;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={cn("tabular mt-1 text-lg font-bold", tone)}>{value}</div>
    </div>
  );
}

function DayTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="font-semibold">{shortDate(d.date)}</div>
      <div className="tabular mt-1 text-muted-foreground">
        {fmt(d.points)} poin · {d.upFloors} lt naik
      </div>
      <div className="mt-0.5">
        <TierBadge tier={tierFor(d.upFloors)} />
      </div>
    </div>
  );
}

export function EmployeeDrawer({
  stat,
  onClose,
}: {
  stat: EmployeeStat | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!stat) return null;
  const e = stat.emp;
  const initials = e.name.replace(/—.*/, "").trim().split(" ").slice(0, 2).map((w) => w[0]).join("");
  const bestDay = Math.max(1, ...stat.days.map((d) => d.points));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl animate-fade-in">
        {/* header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-base font-bold text-primary ring-1 ring-primary/20">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{e.name}</h3>
                {e.real && (
                  <span className="rounded bg-[hsl(var(--success))]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[hsl(var(--success))]">
                    Real
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {e.unit} · Kartu {e.card} · Kantor {e.office}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {e.gender === "L" ? "Laki-laki" : "Perempuan"} · {e.weight} kg · {e.height} cm ·{" "}
                {e.basement ? `parkir ${e.basement}` : "parkir non-basement"}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <TierBadge tier={stat.tier} size="md" />
                <span className="text-[10px] text-muted-foreground">
                  Level · avg {stat.avgUpFloorsPerDay} lt naik/hari
                </span>
                <span
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  title={PERSONA_DESC[e.persona]}
                >
                  {PERSONA_LABEL[e.persona] ?? e.persona}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-2.5">
            <Stat icon={Trophy} label="Total Poin" value={fmt(stat.totalPoints)} tone="text-pln-gold" />
            <Stat icon={Gauge} label="Rata2 / Hari" value={fmt(stat.avgPointsPerDay)} />
            <Stat icon={TrendingUp} label="Lantai Naik" value={fmt(stat.upFloors)} tone="text-[hsl(var(--success))]" />
            <Stat icon={TrendingDown} label="Lantai Turun" value={fmt(stat.downFloors)} />
            <Stat icon={CalendarCheck} label="Hari Aktif" value={`${stat.activeDays}`} />
            <Stat icon={Flame} label="Streak Terbaik" value={`${stat.longestStreak} hari`} tone="text-[hsl(var(--warning))]" />
            <Stat icon={Footprints} label="Trip Tangga" value={fmt(stat.stairTrips)} />
            <Stat icon={Gauge} label="Share Tangga" value={`${Math.round(stat.stairShare * 100)}%`} />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Poin Harian
              </span>
              <span className="text-[10px] text-muted-foreground">Best: {fmt(stat.bestDayPoints)} poin</span>
            </div>
            <div className="h-[130px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stat.days} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} minTickGap={16} />
                  <Tooltip content={<DayTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                  <Bar dataKey="points" radius={[3, 3, 0, 0]}>
                    {stat.days.map((d, i) => (
                      <Cell key={i} fill={d.points >= bestDay * 0.8 ? "#ffcb05" : "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Riwayat Terakhir
            </span>
            <div className="mt-2 space-y-1">
              {[...stat.days].reverse().slice(0, 6).map((d) => (
                <div key={d.date} className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-[11px]">
                  <span className="tabular w-12 text-muted-foreground">{shortDate(d.date)}</span>
                  <TierBadge tier={d.tier} />
                  <span className="tabular text-[10px] text-muted-foreground" title="koefisien harian">
                    ×{d.tier.koef.toFixed(1)}
                  </span>
                  <span className="tabular ml-auto text-muted-foreground">
                    ↑{d.upFloors} · ↓{d.downFloors} lt
                  </span>
                  <span className="tabular w-16 text-right font-semibold text-foreground">{fmt(d.points)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

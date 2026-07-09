"use client";

import { useState } from "react";
import {
  Area,
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import type { DayStat, HourStat } from "@/lib/scoring";
import { cn, fmt } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function shortDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day} ${MONTHS[Number(m) - 1]}`;
}
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

const UP = "hsl(var(--success))";
const DOWN = "#f5a623";

function TT({ active, payload, title }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 font-semibold text-foreground">{title(payload[0].payload)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="tabular ml-auto font-medium text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({
  monthly,
  today,
  todayDate,
}: {
  monthly: DayStat[];
  today: HourStat[];
  todayDate: string;
}) {
  const [mode, setMode] = useState<"month" | "today">("month");
  const todaySlice = today.filter((d) => d.hour >= 5 && d.hour <= 21);

  return (
    <Card className="flex h-full flex-col animate-fade-in">
      <CardHeader>
        <CardTitle>
          <SectionLabel>Aktivitas</SectionLabel>
          <h3 className="text-sm font-semibold">
            {mode === "month" ? "Tren Bulan Berjalan" : `Hari Ini · ${shortDate(todayDate)}`}
          </h3>
        </CardTitle>
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          {(
            [
              ["month", "Bulanan"],
              ["today", "Hari Ini"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={cn(
                "rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                mode === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" /> Poin
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: UP }} /> Lantai Naik
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: DOWN }} /> Lantai Turun
          </span>
        </div>
        <div className="min-h-[248px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            {mode === "month" ? (
              <ComposedChart data={monthly} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="pt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="r" orientation="right" hide />
                <Tooltip content={<TT title={(p: DayStat) => shortDate(p.date)} />} cursor={{ stroke: "hsl(var(--border))" }} />
                <Area yAxisId="l" type="monotone" dataKey="points" name="Poin" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#pt)" />
                <Line yAxisId="r" type="monotone" dataKey="upFloors" name="Lantai Naik" stroke={UP} strokeWidth={2} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey="downFloors" name="Lantai Turun" stroke={DOWN} strokeWidth={2} strokeDasharray="4 3" dot={false} />
              </ComposedChart>
            ) : (
              <ComposedChart data={todaySlice} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tickFormatter={(h) => String(h).padStart(2, "0")} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="r" orientation="right" hide />
                <Tooltip content={<TT title={(p: HourStat) => hourLabel(p.hour)} />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                <Bar yAxisId="l" dataKey="points" name="Poin" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={26} />
                <Line yAxisId="r" type="monotone" dataKey="upFloors" name="Lantai Naik" stroke={UP} strokeWidth={2} dot={{ r: 2 }} />
                <Line yAxisId="r" type="monotone" dataKey="downFloors" name="Lantai Turun" stroke={DOWN} strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2 }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

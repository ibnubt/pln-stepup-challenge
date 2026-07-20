"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { fmt, dateShift } from "@/lib/utils";

const UP = "hsl(var(--success))";
const DOWN = "hsl(var(--primary))";

function TT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 font-semibold">{String(label).padStart(2, "0")}:00</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="tabular ml-auto font-medium">{fmt(p.value)} trip</span>
        </div>
      ))}
    </div>
  );
}

export function HourlyChart({
  data,
  today,
}: {
  data: { date: string; hour: number; up: number; down: number }[];
  today: string;
}) {
  const [from, setFrom] = useState(dateShift(today, -6));
  const [to, setTo] = useState(today);

  const { slice, totalUp, totalDown } = useMemo(() => {
    const lo = from <= to ? from : to;
    const hi = from <= to ? to : from;
    const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, up: 0, down: 0 }));
    for (const d of data) {
      if (d.date < lo || d.date > hi) continue;
      hours[d.hour].up += d.up;
      hours[d.hour].down += d.down;
    }
    return {
      slice: hours.filter((d) => d.hour >= 5 && d.hour <= 21),
      totalUp: hours.reduce((a, d) => a + d.up, 0),
      totalDown: hours.reduce((a, d) => a + d.down, 0),
    };
  }, [data, from, to]);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex-col items-stretch gap-2">
        <CardTitle>
          <SectionLabel>Distribusi Jam</SectionLabel>
          <h3 className="text-sm font-semibold">Kapan Pegawai Naik &amp; Turun Tangga</h3>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          <input type="date" value={from} max={today} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-border bg-background px-1.5 py-1 outline-none focus:border-primary/50" />
          <span>s/d</span>
          <input type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-border bg-background px-1.5 py-1 outline-none focus:border-primary/50" />
          <button onClick={() => { setFrom(dateShift(today, -6)); setTo(today); }} className="rounded-md border border-border px-1.5 py-1 transition-colors hover:text-foreground" title="7 hari terakhir">Minggu ini</button>
          <span className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: UP }} /> Naik ({fmt(totalUp)})</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: DOWN }} /> Turun ({fmt(totalDown)})</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={slice} margin={{ top: 6, right: 6, left: -20, bottom: 0 }} barCategoryGap="18%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={(h) => `${String(h).padStart(2, "0")}`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<TT />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
              <Bar dataKey="up" name="Naik" fill={UP} radius={[2, 2, 0, 0]} />
              <Bar dataKey="down" name="Turun" fill={DOWN} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Jumlah trip tangga per jam. Naik memuncak pagi (masuk kerja), turun memuncak sore (pulang).
        </p>
      </CardContent>
    </Card>
  );
}

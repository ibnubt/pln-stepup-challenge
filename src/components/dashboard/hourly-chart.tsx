"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { fmt } from "@/lib/utils";

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

export function HourlyChart({ data }: { data: { hour: number; up: number; down: number }[] }) {
  const slice = data.filter((d) => d.hour >= 5 && d.hour <= 21);
  const totalUp = data.reduce((a, d) => a + d.up, 0);
  const totalDown = data.reduce((a, d) => a + d.down, 0);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>
          <SectionLabel>Distribusi Jam</SectionLabel>
          <h3 className="text-sm font-semibold">Kapan Pegawai Naik &amp; Turun Tangga</h3>
        </CardTitle>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ background: UP }} /> Naik ({fmt(totalUp)})
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ background: DOWN }} /> Turun ({fmt(totalDown)})
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

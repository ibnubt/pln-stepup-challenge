"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { EmployeeStat, Session, DayStat } from "@/lib/scoring";
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
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// —— satu baris sesi: collapsible, tampilkan waktu mulai–selesai ——
function SessionRow({ s }: { s: Session }) {
  const [open, setOpen] = useState(false);
  const up = s.dir === "up";
  const start = s.steps[0]?.t.slice(0, 5) ?? s.time.slice(11, 16);
  const end = s.steps[s.steps.length - 1]?.t.slice(0, 5) ?? start;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        s.counted ? "border-border/70" : "border-dashed border-border/50 opacity-60"
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[11px] transition-colors hover:bg-muted/40"
      >
        <ChevronRight className={cn("h-3 w-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="tabular shrink-0 whitespace-nowrap text-muted-foreground">{start}–{end}</span>
        <span className={cn("inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap font-medium", up ? "text-[hsl(var(--success))]" : "text-primary")}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {s.startLevel}→{s.endLevel}
        </span>
        {s.checkpoint && (
          <span className="shrink-0 whitespace-nowrap rounded-sm bg-pln-yellow/20 px-1 text-[8px] font-bold uppercase leading-normal text-pln-gold" title="sesi ini melewati seluruh LT1→LT4">
            check-in
          </span>
        )}
        <span className="tabular shrink-0 whitespace-nowrap text-muted-foreground">{s.floors} lt</span>
        <span className="tabular ml-auto shrink-0 text-right text-[10px]">
          {s.counted ? (
            <span className="font-semibold text-foreground">
              {fmt(s.points)} <span className="font-normal text-muted-foreground">poin ×{s.koef.toFixed(1)}</span>
            </span>
          ) : (
            <span className="rounded bg-muted px-1 py-0.5 text-muted-foreground">tanpa check-in</span>
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-border/50 px-2.5 py-2">
          <div className="mb-1.5 flex items-center justify-between text-[9px] text-muted-foreground">
            <span>Jejak lantai ({s.steps.length} tap)</span>
            <span className="tabular">mulai {s.steps[0]?.t} · selesai {s.steps[s.steps.length - 1]?.t}</span>
          </div>
          <div className="flex flex-wrap items-center gap-y-1 text-[9px]">
            {s.steps.map((st, j) => (
              <span key={j} className="inline-flex items-center">
                {j > 0 && <span className="mx-0.5 text-muted-foreground/50">→</span>}
                <span className="tabular rounded bg-muted px-1 py-0.5 text-foreground" title={st.t}>
                  {st.lvl}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// —— grup satu tanggal: collapsible ——
function DayGroup({ date, sessions, day }: { date: string; sessions: Session[]; day?: DayStat }) {
  const [open, setOpen] = useState(false);
  const [sp, setSp] = useState(1);
  const SESS_PER_PAGE = 6;
  const ordered = [...sessions].reverse();
  const totalSp = Math.max(1, Math.ceil(ordered.length / SESS_PER_PAGE));
  const safeSp = Math.min(sp, totalSp);
  const shownSess = ordered.slice((safeSp - 1) * SESS_PER_PAGE, safeSp * SESS_PER_PAGE);
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[10px] transition-colors hover:bg-muted/40"
      >
        <ChevronRight className={cn("h-3 w-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="tabular font-semibold text-foreground">{dayLabel(date)}</span>
        {day ? (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
            style={{ background: `${day.tier.color}1a`, color: day.tier.color }}
            title="koefisien pengali poin hari itu (dari akumulasi lantai naik)"
          >
            Koef ×{day.tier.koef.toFixed(1)}
          </span>
        ) : (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">tanpa check-in</span>
        )}
        <span className="tabular ml-auto text-muted-foreground">
          {sessions.length} sesi · ↑{day?.upFloors ?? 0} ↓{day?.downFloors ?? 0} lt · {fmt(day?.points ?? 0)} poin
        </span>
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-border/50 bg-muted/10 p-2">
          {shownSess.map((s, i) => (
            <SessionRow key={i} s={s} />
          ))}
          {totalSp > 1 && (
            <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
              <span className="tabular">
                {(safeSp - 1) * SESS_PER_PAGE + 1}–{Math.min(safeSp * SESS_PER_PAGE, ordered.length)} dari {ordered.length} sesi
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSp((p) => Math.max(1, p - 1))}
                  disabled={safeSp <= 1}
                  className="rounded border border-border px-1.5 py-0.5 transition-colors hover:text-foreground disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="tabular">{safeSp}/{totalSp}</span>
                <button
                  onClick={() => setSp((p) => Math.min(totalSp, p + 1))}
                  disabled={safeSp >= totalSp}
                  className="rounded border border-border px-1.5 py-0.5 transition-colors hover:text-foreground disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const dayLabel = (d: string) => {
  const [, m, day] = d.split("-");
  return `${Number(day)} ${MONTHS[Number(m) - 1]}`;
};
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
        {fmt(d.points)} poin · {d.upFloors} lt naik · Koef ×{tierFor(d.upFloors).koef.toFixed(1)}
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
  const [dayPage, setDayPage] = useState(1);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!stat) return null;
  const e = stat.emp;
  const initials = e.name.replace(/—.*/, "").trim().split(" ").slice(0, 2).map((w) => w[0]).join("");
  const bestDay = Math.max(1, ...stat.days.map((d) => d.points));
  const noScore = stat.totalPoints === 0; // naik tangga tapi belum check-in → tampilkan raw, abu-abu
  // tap terakhir (langkah terakhir dari sesi terbaru)
  const lastSess = stat.sessions[stat.sessions.length - 1];
  const lastStep = lastSess?.steps[lastSess.steps.length - 1];
  const lastTap = lastStep ? `${lastStep.lvl} · ${dayLabel(lastSess.date)} ${lastStep.t.slice(0, 5)}` : "—";

  // kelompokkan sesi per hari (terbaru dulu)
  const dayMap = new Map(stat.days.map((d) => [d.date, d]));
  const sessByDay = new Map<string, Session[]>();
  for (const s of stat.sessions) {
    const arr = sessByDay.get(s.date) ?? [];
    arr.push(s);
    sessByDay.set(s.date, arr);
  }
  const dayEntries = [...sessByDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  // paging grup hari (data bisa banyak)
  const DAYS_PER_PAGE = 5;
  const totalDayPages = Math.max(1, Math.ceil(dayEntries.length / DAYS_PER_PAGE));
  const safeDayPage = Math.min(dayPage, totalDayPages);
  const pagedDays = dayEntries.slice((safeDayPage - 1) * DAYS_PER_PAGE, safeDayPage * DAYS_PER_PAGE);

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
                <span className="inline-flex items-center gap-0.5 rounded bg-[hsl(var(--warning))]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[hsl(var(--warning))]" title="streak hari-kerja berjalan saat ini">
                  <Flame className="h-2.5 w-2.5" /> Streak berjalan: {stat.currentStreak} hari
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                <span className={cn("mr-1 rounded px-1 text-[9px] font-semibold", stat.isPln ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                  {stat.isPln ? "Pegawai PLN" : "Non-Pegawai"}
                </span>
                {e.unit || "-"} · Kartu {e.card}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tap terakhir: <span className="font-medium text-foreground">{lastTap}</span>
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <TierBadge tier={stat.tier} size="md" />
                <span className="text-[10px] text-muted-foreground">
                  Badge · avg {stat.avgUpFloorsPerDay} lt naik/hari
                </span>
                <span
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  title={PERSONA_DESC[stat.persona]}
                >
                  {PERSONA_LABEL[stat.persona] ?? stat.persona}
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
            <Stat icon={TrendingUp} label="Lantai Naik" value={fmt(noScore ? stat.upFloorsRaw : stat.upFloors)} tone={noScore ? "text-muted-foreground" : "text-[hsl(var(--success))]"} />
            <Stat icon={TrendingDown} label="Lantai Turun" value={fmt(noScore ? stat.downFloorsRaw : stat.downFloors)} />
            <Stat icon={CalendarCheck} label="Hari Aktif" value={`${stat.activeDays}`} />
            <Stat icon={Flame} label="Streak Terbaik" value={`${stat.longestStreak} hari`} tone="text-[hsl(var(--warning))]" />
            <Stat icon={Footprints} label="Trip Tangga" value={fmt(noScore ? stat.stairTripsRaw : stat.stairTrips)} />
            <Stat icon={Gauge} label="Rata2 Lantai/Hari" value={`↑${stat.avgUpFloorsPerDay} ↓${stat.avgDownFloorsPerDay}`} />
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
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Riwayat Sesi &amp; Jejak Lantai
              </span>
              <span className="text-[10px] text-muted-foreground">
                {dayEntries.length} hari · {stat.sessions.length} sesi
              </span>
            </div>
            <div className="space-y-1.5">
              {pagedDays.map(([date, sessions]) => (
                <DayGroup key={date} date={date} sessions={sessions} day={dayMap.get(date)} />
              ))}
            </div>

            {/* paging grup hari */}
            {totalDayPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Hal {safeDayPage}/{totalDayPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDayPage((p) => Math.max(1, p - 1))}
                    disabled={safeDayPage <= 1}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <button
                    onClick={() => setDayPage((p) => Math.min(totalDayPages, p + 1))}
                    disabled={safeDayPage >= totalDayPages}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

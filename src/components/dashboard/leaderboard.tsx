"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmployeeStat } from "@/lib/scoring";
import { Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { cn, fmt } from "@/lib/utils";
import { EmployeeDrawer } from "./employee-drawer";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Flame, Medal } from "lucide-react";

const PAGE_SIZE = 10;

type SortKey = "totalPoints" | "upFloors" | "stairTrips" | "longestStreak" | "activeDays";

const COLS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "longestStreak", label: "Best Streak", align: "right" },
  { key: "totalPoints", label: "Poin", align: "right" },
  { key: "upFloors", label: "Lantai Naik", align: "right" },
  { key: "stairTrips", label: "Trip Tangga", align: "right" },
];

const ORGS = [
  { key: "all", label: "Semua" },
  { key: "pln", label: "Pegawai PLN" },
  { key: "non", label: "Non-Pegawai" },
];

const MEDAL = ["#ffcb05", "#c0c6ce", "#c2803f"];

export function Leaderboard({ stats }: { stats: EmployeeStat[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("totalPoints");
  const [asc, setAsc] = useState(false);
  const [q, setQ] = useState("");
  const [org, setOrg] = useState("all");
  const [selected, setSelected] = useState<EmployeeStat | null>(null);
  const [page, setPage] = useState(1);

  // reset ke halaman 1 saat filter/sort berubah
  useEffect(() => setPage(1), [q, org, sortKey, asc]);

  const rankMap = useMemo(() => {
    const m = new Map<string, number>();
    [...stats].sort((a, b) => b.totalPoints - a.totalPoints).forEach((s, i) => m.set(s.emp.id, i + 1));
    return m;
  }, [stats]);

  const maxPoints = Math.max(1, ...stats.map((s) => s.totalPoints));

  const rows = useMemo(() => {
    let r = stats.filter((s) => {
      const matchQ =
        !q ||
        s.emp.name.toLowerCase().includes(q.toLowerCase()) ||
        s.emp.unit.toLowerCase().includes(q.toLowerCase());
      const matchOrg = org === "all" || (org === "pln" ? s.isPln : !s.isPln);
      return matchQ && matchOrg;
    });
    r = [...r].sort((a, b) => {
      const d = (a[sortKey] as number) - (b[sortKey] as number);
      return asc ? d : -d;
    });
    return r;
  }, [stats, q, org, sortKey, asc]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const fromRow = rows.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const toRow = Math.min(safePage * PAGE_SIZE, rows.length);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setAsc((v) => !v);
    else {
      setSortKey(k);
      setAsc(false);
    }
  };

  return (
    <>
      <Card className="animate-fade-in">
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle>
            <SectionLabel>Peringkat Pegawai</SectionLabel>
            <h3 className="text-sm font-semibold">Leaderboard · {rows.length} pegawai</h3>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama / unit…"
                className="h-8 w-40 rounded-lg border border-border bg-background pl-8 pr-2 text-xs outline-none transition-colors focus:border-primary/50"
              />
            </div>
          </div>
        </CardHeader>

        <div className="flex flex-wrap gap-1 px-5 pb-3">
          {ORGS.map((p) => (
            <button
              key={p.key}
              onClick={() => setOrg(p.key)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                org === p.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="w-14 px-4 py-2.5 text-left font-semibold">#</th>
                <th className="px-2 py-2.5 text-left font-semibold">Pegawai</th>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className="cursor-pointer select-none px-3 py-2.5 text-right font-semibold hover:text-foreground"
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      <span className="flex flex-col -space-y-1.5">
                        <ChevronUp className={cn("h-3 w-3", sortKey === c.key && asc ? "text-primary" : "text-muted-foreground/40")} />
                        <ChevronDown className={cn("h-3 w-3", sortKey === c.key && !asc ? "text-primary" : "text-muted-foreground/40")} />
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => {
                const rank = rankMap.get(s.emp.id)!;
                const initials = s.emp.name.replace(/—.*/, "").trim().split(" ").slice(0, 2).map((w) => w[0]).join("");
                const noScore = s.totalPoints === 0; // naik tangga tapi belum check-in → abu-abu
                const floors = noScore ? s.upFloorsRaw : s.upFloors; // tetap tampilkan lantai yang dinaiki
                const trips = noScore ? s.stairTripsRaw : s.stairTrips;
                return (
                  <tr
                    key={s.emp.id}
                    onClick={() => setSelected(s)}
                    className={cn(
                      "cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/40",
                      noScore && "opacity-45"
                    )}
                  >
                    <td className="px-4 py-2.5">
                      {rank <= 3 ? (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                          style={{ background: `${MEDAL[rank - 1]}22`, color: MEDAL[rank - 1] }}
                        >
                          {rank}
                        </span>
                      ) : (
                        <span className="tabular pl-1.5 text-xs text-muted-foreground">{rank}</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate font-medium">
                            {s.emp.name.replace(/ — .*/, "")}
                            {s.live ? (
                              <span
                                className="inline-flex shrink-0 animate-pulse items-center gap-0.5 rounded px-1 text-[10px] font-bold leading-normal"
                                style={{ color: s.live.color, background: `${s.live.color}22` }}
                                title={`Sedang naik tangga — ${s.live.floors} lantai (koef ×${s.live.koef.toFixed(1)})`}
                              >
                                {s.live.emoji} {s.live.floors}
                              </span>
                            ) : (
                              s.emp.real && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--success))]" />
                            )}
                            {noScore && (
                              <span className="shrink-0 whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground" title="naik tangga tapi belum check-in (lewati LT1→LT4) — skor 0">
                                belum check-in
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                            <span className={cn("shrink-0 rounded px-1 text-[9px] font-semibold", s.isPln ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                              {s.isPln ? "PLN" : "Non"}
                            </span>
                            <span className="truncate">{s.emp.unit || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="tabular inline-flex items-center gap-1 text-base font-bold text-[hsl(var(--warning))]">
                        {s.longestStreak > 0 && <Flame className="h-5 w-5" />}
                        {s.longestStreak}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="tabular font-bold text-foreground">{fmt(s.totalPoints)}</span>
                        <span className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-primary to-pln-yellow"
                            style={{ width: `${(s.totalPoints / maxPoints) * 100}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className={cn("tabular px-3 py-2.5 text-right", noScore ? "text-muted-foreground" : "text-[hsl(var(--success))]")}>{fmt(floors)}</td>
                    <td className="tabular px-3 py-2.5 text-right text-muted-foreground">{fmt(trips)}</td>
                  </tr>
                );
              })}
              {/* baris pengisi agar tinggi card tetap konsisten walau baris < PAGE_SIZE */}
              {Array.from({ length: Math.max(0, PAGE_SIZE - pageRows.length) }).map((_, i) => (
                <tr key={`filler-${i}`} className="border-b border-border/50">
                  <td colSpan={2 + COLS.length} className="h-[45px]" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Medal className="h-3.5 w-3.5" />
            {fromRow}–{toRow} dari {rows.length} · klik baris untuk detail
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "h-7 w-7 rounded-md text-[11px] font-medium transition-colors",
                  p === safePage
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>

      <EmployeeDrawer key={selected?.emp.id ?? "none"} stat={selected} onClose={() => setSelected(null)} />
    </>
  );
}

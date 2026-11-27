import { LEVELS, BUILDINGS, levelIndex, CHECKPOINT_MIN_IDX, CHECKPOINT_MAX_IDX, LIFT_MIN_IDX } from "@/lib/config";
import { cn, fmt } from "@/lib/utils";
import { Building2 } from "lucide-react";

// kolom: label lantai + satu kolom per gedung (lebar sama, boleh menyusut)
const GRID = { gridTemplateColumns: `3.5rem repeat(${BUILDINGS.length}, minmax(0, 1fr))` };
const ROWS = [...LEVELS].reverse(); // atas → bawah

/**
 * Peta vertikal read-only untuk display/kiosk — semua gedung berdampingan, sumbu lantai sama
 * (Gedung 1 hanya LT1–LT9, sel lantai lain kosong). Tiap gedung satu kolom utuh dengan garis
 * pemisah vertikal di antaranya. Data sudah ter-scope ke periode berjalan.
 */
export function BoardFloorMap({
  data,
  label,
  showCheckpoint = true,
}: {
  data: { building: string; level: string; date: string; stair: number; lift: number }[];
  label: string;
  showCheckpoint?: boolean; // zona check-in LT1–LT4 hanya relevan untuk aturan v1
}) {
  const agg = new Map<string, number>();
  const perBuilding = new Map<string, number>();
  for (const d of data) {
    const k = `${d.building}|${d.level}`;
    agg.set(k, (agg.get(k) ?? 0) + d.stair);
    perBuilding.set(d.building, (perBuilding.get(d.building) ?? 0) + d.stair);
  }
  const max = Math.max(1, ...Array.from(agg.values(), (v) => v)); // skala sama untuk semua gedung
  const isCp = (lvl: string) => {
    const idx = levelIndex(lvl);
    return showCheckpoint && idx >= CHECKPOINT_MIN_IDX && idx <= CHECKPOINT_MAX_IDX;
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-6 py-4">
        <Building2 className="h-6 w-6 shrink-0 text-primary" />
        <h2 className="truncate text-2xl font-bold tracking-tight">Peta Vertikal Gedung</h2>
        <span className="ml-auto shrink-0 text-sm font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div style={GRID} className="grid min-h-0 flex-1 gap-x-3 px-5 pb-3 pt-3">
        {/* kolom label lantai */}
        <div className="flex min-h-0 flex-col">
          <div className="h-8 shrink-0" />
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            {ROWS.map((lvl) => {
              const isBasement = levelIndex(lvl) < LIFT_MIN_IDX;
              return (
                <div key={lvl} className={cn("flex min-h-0 flex-1 items-center rounded px-1", isCp(lvl) && "bg-pln-yellow/[0.07]")}>
                  <span className={cn("text-base font-semibold", isCp(lvl) ? "text-pln-gold" : isBasement ? "text-muted-foreground" : "text-foreground")}>
                    {lvl}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* satu kolom per gedung; kolom ke-2 dst diberi garis pemisah di kiri */}
        {BUILDINGS.map((b, bi) => (
          <div key={b.key} className={cn("flex min-h-0 min-w-0 flex-col", bi > 0 && "border-l-2 border-border pl-3")}>
            <div className="flex h-8 shrink-0 items-baseline justify-between gap-2 truncate">
              <span className="truncate text-base font-bold text-foreground">{b.name}</span>
              <span className="tabular text-sm text-muted-foreground">{fmt(perBuilding.get(b.key) ?? 0)}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1">
              {ROWS.map((lvl) => {
                if (!b.levels.includes(lvl)) return <div key={lvl} className="min-h-0 flex-1" />; // lantai tak ada di gedung ini
                const stair = agg.get(`${b.key}|${lvl}`) ?? 0;
                const pct = (stair / max) * 100;
                return (
                  <div key={lvl} className={cn("flex min-h-0 min-w-0 flex-1 items-center gap-2 rounded px-1", isCp(lvl) && "bg-pln-yellow/[0.07]")}>
                    <div className="relative h-1/2 min-w-0 flex-1 overflow-hidden rounded bg-muted/60">
                      <div className="h-full rounded bg-gradient-to-r from-primary/70 to-primary" style={{ width: `${Math.max(pct, stair > 0 ? 4 : 0)}%` }} />
                    </div>
                    <span className="tabular w-16 shrink-0 text-right text-base text-muted-foreground">{fmt(stair)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { TIERS, POINTS_UP_PER_FLOOR, POINTS_DOWN_PER_FLOOR } from "@/lib/config";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import { dateLabel } from "@/lib/utils";

export function SchemeCard({ rules = "v1", rulesV2Start = null }: { rules?: "v1" | "v2"; rulesV2Start?: string | null }) {
  if (rules === "v2") return <SchemeCardV2 since={rulesV2Start} />;
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>
          <SectionLabel>Aturan Reward</SectionLabel>
          <h3 className="text-sm font-semibold">Skema Poin & Koefisien</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[hsl(var(--success))]/25 bg-[hsl(var(--success))]/[0.07] p-3">
            <div className="flex items-center gap-1.5 text-[hsl(var(--success))]">
              <ArrowUp className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Naik</span>
            </div>
            <div className="mt-1.5 tabular text-xs text-muted-foreground">
              lantai × <b className="text-foreground">{POINTS_UP_PER_FLOOR}</b> × koef
            </div>
          </div>
          <div className="rounded-lg border border-primary/25 bg-primary/[0.07] p-3">
            <div className="flex items-center gap-1.5 text-primary">
              <ArrowDown className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Turun</span>
            </div>
            <div className="mt-1.5 tabular text-xs text-muted-foreground">
              lantai × <b className="text-foreground">{POINTS_DOWN_PER_FLOOR}</b> × koef
            </div>
          </div>
        </div>

        <p className="mt-3 flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          <span>
            <b className="text-foreground">Koefisien progresif per-trip</b>: makin banyak lantai naik
            terkumpul dalam sehari, makin tinggi pengali trip berikutnya. Wajib{" "}
            <b className="text-pln-gold">check-in (NAIK LT1→LT2→LT3→LT4)</b> sekali saat datang; setelah itu
            semua sesi tangga hari itu (termasuk turun) dapat poin.
          </span>
        </p>

        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 px-2.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="w-[86px]">Tingkat</span>
            <span className="ml-auto">Lantai naik/hari</span>
            <span className="w-12 text-center">Koef</span>
          </div>
          {TIERS.map((t) => (
            <div
              key={t.key}
              className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1.5"
            >
              <span className="text-sm">{t.emoji}</span>
              <span className="w-[62px] text-[11px] font-medium" style={{ color: t.color }}>
                {t.name}
              </span>
              <span className="tabular ml-auto text-[11px] text-muted-foreground">
                {t.minDaily}–{t.maxDaily === 999 ? "∞" : t.maxDaily}
              </span>
              <span
                className="tabular w-12 rounded px-1.5 py-0.5 text-center text-[11px] font-semibold"
                style={{ background: `${t.color}1a`, color: t.color }}
              >
                ×{t.koef.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
          <b className="text-foreground">Badge pegawai</b> (di leaderboard & detail) dihitung dari
          <b className="text-foreground"> rata-rata lantai naik / hari aktif</b> — beda dari koefisien
          harian di atas.
        </p>
      </CardContent>
    </Card>
  );
}

/** Aturan v2: tanpa check-in, tanpa koefisien. Tabel tingkat = badge (rata-rata lantai naik/hari aktif). */
function SchemeCardV2({ since }: { since: string | null }) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>
          <SectionLabel>Aturan Reward</SectionLabel>
          <h3 className="text-sm font-semibold">Skema Poin & Badge</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[hsl(var(--success))]/25 bg-[hsl(var(--success))]/[0.07] p-3">
            <div className="flex items-center gap-1.5 text-[hsl(var(--success))]">
              <ArrowUp className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Naik</span>
            </div>
            <div className="mt-1.5 tabular text-xs text-muted-foreground">
              lantai × <b className="text-foreground">{POINTS_UP_PER_FLOOR}</b>
            </div>
          </div>
          <div className="rounded-lg border border-primary/25 bg-primary/[0.07] p-3">
            <div className="flex items-center gap-1.5 text-primary">
              <ArrowDown className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Turun</span>
            </div>
            <div className="mt-1.5 tabular text-xs text-muted-foreground">
              lantai × <b className="text-foreground">{POINTS_DOWN_PER_FLOOR}</b>
            </div>
          </div>
        </div>

        <p className="mt-3 flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          <span>
            <b className="text-foreground">Semua sesi tangga dihitung</b>, di Gedung Utama maupun Gedung 1. Tidak ada
            check-in dan tidak ada pengali: setiap lantai bernilai sama untuk semua peserta.
            {since && <> Berlaku sejak {dateLabel(since)}.</>}
          </span>
        </p>

        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 px-2.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="w-[86px]">Badge</span>
            <span className="ml-auto">Rata-rata lantai naik / hari aktif</span>
          </div>
          {TIERS.map((t) => (
            <div key={t.key} className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1.5">
              <span className="text-sm">{t.emoji}</span>
              <span className="w-[62px] text-[11px] font-medium" style={{ color: t.color }}>
                {t.name}
              </span>
              <span className="tabular ml-auto text-[11px] text-muted-foreground">
                {t.minAvg === 0 ? "di bawah 3" : `${t.minAvg} atau lebih`}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
          <b className="text-foreground">Badge</b> hanya tanda kebiasaan, tidak mengubah poin. Badge tinggi perlu
          cukup hari aktif: 1 hari maksimal Bronze, 2 hari Silver, 3 hari Gold, 4 hari Platinum, 5 hari atau lebih
          Champion.
        </p>
      </CardContent>
    </Card>
  );
}

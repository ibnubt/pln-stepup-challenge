import { Card, CardContent, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { TIERS } from "@/lib/config";
import type { EmployeeStat } from "@/lib/scoring";
import { fmt } from "@/lib/utils";

export function TierDistribution({ stats }: { stats: EmployeeStat[] }) {
  const counts = TIERS.map((t) => ({
    tier: t,
    n: stats.filter((s) => s.tier.key === t.key && s.activeDays > 0).length,
  }));
  const total = Math.max(1, counts.reduce((a, c) => a + c.n, 0));

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>
          <SectionLabel>Sebaran Badge</SectionLabel>
          <h3 className="text-sm font-semibold">Distribusi Badge Pegawai</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {counts.map(({ tier, n }) => (
          <div key={tier.key} className="flex items-center gap-3">
            <span className="flex w-24 items-center gap-1.5 text-[11px] font-medium" style={{ color: tier.color }}>
              <span>{tier.emoji}</span>
              {tier.name}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(n / total) * 100}%`, background: tier.color }}
              />
            </div>
            <span className="tabular w-8 text-right text-[11px] text-muted-foreground">{fmt(n)}</span>
          </div>
        ))}
        <p className="pt-1 text-[10px] text-muted-foreground">
          Badge = rata-rata lantai naik / hari aktif (beda dari koefisien harian).
        </p>
      </CardContent>
    </Card>
  );
}

import { getScores } from "@/lib/data";
import { AppBar } from "@/components/dashboard/app-bar";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { SchemeCard } from "@/components/dashboard/scheme-card";
import { Leaderboard } from "@/components/dashboard/leaderboard";
import { FloorHeatmap } from "@/components/dashboard/floor-heatmap";
import { HourlyChart } from "@/components/dashboard/hourly-chart";
import { TierDistribution } from "@/components/dashboard/tier-distribution";
import { ImpactCard } from "@/components/dashboard/impact-card";

export const dynamic = "force-dynamic"; // render per request; kesegaran diatur cache TTL di getScores

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const s = await getScores(searchParams?.month); // bulan terpilih (historis) atau bulan berjalan

  // Distribusi tier: hanya pegawai BERPOIN (sudah check-in). Leaderboard: tampilkan SEMUA yang
  // naik tangga (punya sesi) — yang belum check-in muncul abu-abu, skor 0 (lihat Leaderboard).
  const ranked = s.employeeStats.filter((e) => e.activeDays > 0);

  return (
    <div className="min-h-screen">
      <AppBar month={s.month} availableMonths={s.availableMonths} />

      <main className="container space-y-4 py-6">
        <KpiStrip kpi={s.kpi} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrendChart monthly={s.byDate} today={s.todayHourly} todayDate={s.today} />
          </div>
          <SchemeCard />
        </div>

        <ImpactCard kpi={s.kpi} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Leaderboard stats={s.employeeStats} />
          </div>
          <FloorHeatmap data={s.floorHeat} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HourlyChart data={s.hourly} />
          </div>
          <TierDistribution stats={ranked} />
        </div>

        <footer className="flex flex-col items-center gap-1 py-6 text-center text-[11px] text-muted-foreground">
          <p>
            PLN Wellness · Program Naik Tangga — mengurangi beban lift dengan menggamifikasi penggunaan tangga.
          </p>
        </footer>
      </main>
    </div>
  );
}

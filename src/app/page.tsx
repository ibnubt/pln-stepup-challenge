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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function labelDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export const dynamic = "force-dynamic"; // render per request; kesegaran diatur cache TTL di getScores

export default async function DashboardPage() {
  const s = await getScores();

  const first = s.byDate[0]?.date ?? s.today;
  const period = `${Number(first.split("-")[2])}–${labelDate(s.today)}`;

  return (
    <div className="min-h-screen">
      <AppBar period={`Bulan Berjalan · ${period}`} />

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
          <TierDistribution stats={s.employeeStats} />
        </div>

        <footer className="flex flex-col items-center gap-1 py-6 text-center text-[11px] text-muted-foreground">
          <p>
            PLN Wellness · Program Naik Tangga — mengurangi beban lift dengan menggamifikasi penggunaan tangga.
          </p>
          <p className="text-muted-foreground/60">
            Data sintetis 30 pegawai (bulan berjalan) · peta lantai dari Door Config Report (159 reader, B2–LT15).
          </p>
        </footer>
      </main>
    </div>
  );
}

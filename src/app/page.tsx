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

  // Papan peringkat & distribusi tier: hanya pegawai BERPOIN (sudah check-in / activeDays>0).
  // Yang pakai tangga tapi belum check-in tetap dihitung di KPI partisipasi (penyebut), tapi
  // tak jadi baris serba-nol di leaderboard.
  const ranked = s.employeeStats.filter((e) => e.activeDays > 0);

  // Periode "Bulan Berjalan" = tanggal 1 s/d HARI INI (WIB), lepas dari ada/tidaknya data.
  // (dulu diambil dari rentang tanggal DATA → mandek "14–14" saat data hari ini belum masuk)
  const nowWib = new Date(Date.now() + 7 * 3600 * 1000); // WIB = UTC+7
  const todayStr = `${nowWib.getUTCFullYear()}-${String(nowWib.getUTCMonth() + 1).padStart(2, "0")}-${String(nowWib.getUTCDate()).padStart(2, "0")}`;
  const period = `1–${labelDate(todayStr)}`; // mis. "1–15 Jul 2026"

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
            <Leaderboard stats={ranked} />
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
          <p className="text-muted-foreground/60">
            Data sintetis 30 pegawai (bulan berjalan) · peta lantai dari Door Config Report (159 reader, B2–LT15).
          </p>
        </footer>
      </main>
    </div>
  );
}

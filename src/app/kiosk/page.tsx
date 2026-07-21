import { getScores } from "@/lib/data";
import { BoardKpis } from "@/components/display/board-kpis";
import { BoardLeaderboard } from "@/components/display/board-leaderboard";
import { BoardFloorMap } from "@/components/display/board-floormap";
import { AutoRefresh } from "@/components/display/auto-refresh";
import { FitScreen } from "@/components/display/fit-screen";
import { monthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Layar PORTRAIT (kiosk) — kanvas 1080×1920 di-skala utuh oleh FitScreen.
export default async function KioskPage({ searchParams }: { searchParams: { month?: string } }) {
  const s = await getScores(searchParams?.month);
  const pln = s.employeeStats.filter((e) => e.isPln);
  const non = s.employeeStats.filter((e) => !e.isPln);
  return (
    <FitScreen w={1080} h={1920}>
      <AutoRefresh sec={15} />
      <div className="flex h-full w-full flex-col gap-5 bg-background p-8">
        <header className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
              <img src="/logo-pln.svg" alt="PLN" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <h1 className="text-3xl font-extrabold tracking-tight">PLN Step Up Challenge</h1>
              <p className="text-base text-muted-foreground">
                Gerakan Naik Tangga · <span className="font-semibold text-foreground">Data Bulan {monthLabel(s.month)}</span>
              </p>
            </div>
          </div>
          <span className="flex items-center gap-2.5 rounded-xl border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 px-4 py-2.5 text-base font-semibold text-[hsl(var(--success))]">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[hsl(var(--success))]" />
            </span>
            LIVE
          </span>
        </header>

        <div className="h-[440px] shrink-0">
          <BoardKpis kpi={s.kpi} className="grid-cols-2" />
        </div>

        <div className="grid min-h-0 grid-cols-2 gap-5" style={{ flex: "1.35 1 0%" }}>
          <BoardLeaderboard stats={pln} limit={10} title="Pegawai PLN" subtitle="Leaderboard" />
          <BoardLeaderboard stats={non} limit={10} title="Non-Pegawai" subtitle="Leaderboard" />
        </div>
        <div className="min-h-0" style={{ flex: "1 1 0%" }}>
          <BoardFloorMap data={s.floorByDate} month={s.month} />
        </div>
      </div>
    </FitScreen>
  );
}

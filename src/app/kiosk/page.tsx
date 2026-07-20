import { getScores } from "@/lib/data";
import { BoardKpis } from "@/components/display/board-kpis";
import { BoardLeaderboard } from "@/components/display/board-leaderboard";
import { BoardFloorMap } from "@/components/display/board-floormap";
import { AutoRefresh } from "@/components/display/auto-refresh";

export const dynamic = "force-dynamic";

// Layar PORTRAIT (kiosk 9:16). Tanpa login. Auto-refresh.
export default async function KioskPage({ searchParams }: { searchParams: { month?: string } }) {
  const s = await getScores(searchParams?.month);
  const pln = s.employeeStats.filter((e) => e.isPln);
  const non = s.employeeStats.filter((e) => !e.isPln);
  return (
    <div className="flex min-h-screen w-screen flex-col gap-4 bg-background p-6">
      <AutoRefresh sec={15} />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
            <img src="/logo-pln.svg" alt="PLN" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-extrabold tracking-tight">PLN Step Up Challenge</h1>
            <p className="text-xs text-muted-foreground">Gerakan Naik Tangga · Kantor Pusat</p>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 px-2.5 py-1.5 text-xs font-semibold text-[hsl(var(--success))]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
          </span>
          LIVE
        </span>
      </header>

      <BoardKpis kpi={s.kpi} className="grid-cols-2" />

      <div className="grid grid-cols-2 gap-4">
        <div className="min-h-[40vh]">
          <BoardLeaderboard stats={pln} limit={10} title="Pegawai PLN" subtitle="Leaderboard" />
        </div>
        <div className="min-h-[40vh]">
          <BoardLeaderboard stats={non} limit={10} title="Non-Pegawai" subtitle="TAD · ICON · dll" />
        </div>
      </div>
      <div className="min-h-[30vh]">
        <BoardFloorMap data={s.floorByDate} today={s.today} />
      </div>
    </div>
  );
}

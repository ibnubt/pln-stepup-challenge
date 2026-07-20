import { getScores } from "@/lib/data";
import { BoardKpis } from "@/components/display/board-kpis";
import { BoardLeaderboard } from "@/components/display/board-leaderboard";
import { BoardFloorMap } from "@/components/display/board-floormap";
import { AutoRefresh } from "@/components/display/auto-refresh";

export const dynamic = "force-dynamic";

// Layar LANDSCAPE (monitor besar 16:9). Tanpa login (kiosk). Auto-refresh.
export default async function DisplayPage({ searchParams }: { searchParams: { month?: string } }) {
  const s = await getScores(searchParams?.month);
  return (
    <div className="flex h-screen w-screen flex-col gap-4 overflow-hidden bg-background p-6">
      <AutoRefresh sec={15} />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
            <img src="/logo-pln.svg" alt="PLN" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <h1 className="text-2xl font-extrabold tracking-tight">PLN Step Up Challenge</h1>
            <p className="text-sm text-muted-foreground">Gerakan Naik Tangga · Kantor Pusat</p>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 px-3 py-2 text-sm font-semibold text-[hsl(var(--success))]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
          </span>
          LIVE
        </span>
      </header>

      <BoardKpis kpi={s.kpi} className="grid-cols-3 xl:grid-cols-6" />

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
        <div className="col-span-2 min-h-0">
          <BoardLeaderboard stats={s.employeeStats} limit={10} />
        </div>
        <div className="min-h-0">
          <BoardFloorMap data={s.floorByDate} today={s.today} />
        </div>
      </div>
    </div>
  );
}

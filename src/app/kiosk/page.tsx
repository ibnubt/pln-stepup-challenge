import { getScores } from "@/lib/data";
import { BoardKpis } from "@/components/display/board-kpis";
import { BoardLeaderboard } from "@/components/display/board-leaderboard";
import { BoardFloorMap } from "@/components/display/board-floormap";
import { AutoRefresh } from "@/components/display/auto-refresh";

export const dynamic = "force-dynamic";

// Layar PORTRAIT (kiosk). Fluid — fit segala ukuran. Publik, auto-refresh.
export default async function KioskPage({ searchParams }: { searchParams: { month?: string } }) {
  const s = await getScores(searchParams?.month);
  const pln = s.employeeStats.filter((e) => e.isPln);
  const non = s.employeeStats.filter((e) => !e.isPln);
  return (
    <div className="flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-background" style={{ padding: "1.5vmin", gap: "1.2vmin" }}>
      <AutoRefresh sec={15} />

      <header className="flex shrink-0 items-center justify-between" style={{ gap: "1vmin" }}>
        <div className="flex min-w-0 items-center" style={{ gap: "1.2vmin" }}>
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5" style={{ width: "7vmin", height: "7vmin", padding: "0.8vmin" }}>
            <img src="/logo-pln.svg" alt="PLN" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate font-extrabold tracking-tight" style={{ fontSize: "clamp(1rem,3.2vmin,2.8rem)" }}>PLN Step Up Challenge</h1>
            <p className="truncate text-muted-foreground" style={{ fontSize: "clamp(0.6rem,1.7vmin,1.3rem)" }}>Gerakan Naik Tangga · Kantor Pusat</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 font-semibold text-[hsl(var(--success))]" style={{ fontSize: "clamp(0.6rem,1.7vmin,1.2rem)", padding: "0.8vmin 1.4vmin" }}>
          <span className="relative flex" style={{ width: "1.6vmin", height: "1.6vmin" }}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75" />
            <span className="relative inline-flex h-full w-full rounded-full bg-[hsl(var(--success))]" />
          </span>
          LIVE
        </span>
      </header>

      <div className="shrink-0" style={{ height: "22vh" }}>
        <BoardKpis kpi={s.kpi} className="grid-cols-2" />
      </div>

      <div className="grid min-h-0 grid-cols-2" style={{ flex: "1.4 1 0%", gap: "1.2vmin" }}>
        <BoardLeaderboard stats={pln} limit={10} title="Pegawai PLN" subtitle="Leaderboard" />
        <BoardLeaderboard stats={non} limit={10} title="Non-Pegawai" subtitle="TAD · ICON" />
      </div>
      <div className="min-h-0" style={{ flex: "1 1 0%" }}>
        <BoardFloorMap data={s.floorByDate} today={s.today} />
      </div>
    </div>
  );
}

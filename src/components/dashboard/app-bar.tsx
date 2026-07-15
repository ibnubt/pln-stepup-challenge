import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/ui/logout-button";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { CalendarRange, BookOpen } from "lucide-react";

export function AppBar({ period }: { period: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
            <img src="/logo-pln.svg" alt="PLN" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold tracking-tight">PLN Wellness</h1>
              <span className="rounded bg-pln-yellow/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pln-gold">
                Command Center
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Program Naik Tangga · Kantor Pusat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex">
            <CalendarRange className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{period}</span>
          </div>
          <LiveIndicator intervalSec={Number(process.env.DASHBOARD_REFRESH_SEC) || 15} />
          <Link
            href="/metodologi"
            title="Metodologi & rumus perhitungan"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Metodologi</span>
          </Link>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

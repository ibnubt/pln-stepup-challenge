"use client";

// Indikator "Live" sekaligus auto-refresh. Tiap `intervalSec` memanggil
// router.refresh() → Next menarik ulang server component (getScores, TTL cache)
// tanpa reload penuh. Cocok dgn worker sync yang jalan tiap 5 detik.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function LiveIndicator({ intervalSec = 15 }: { intervalSec?: number }) {
  const router = useRouter();
  const [ago, setAgo] = useState(0);
  const secs = Math.max(2, intervalSec); // jaga-jaga: minimal 2 dtk

  useEffect(() => {
    let elapsed = 0;
    const id = setInterval(() => {
      elapsed += 1;
      if (elapsed >= secs) {
        router.refresh(); // tarik ulang data terbaru dari server
        elapsed = 0;
      }
      setAgo(elapsed);
    }, 1000);
    return () => clearInterval(id);
  }, [router, secs]);

  return (
    <div
      title={`Auto-refresh data tiap ${secs} dtk`}
      className="hidden items-center gap-1.5 rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 px-3 py-2 text-xs font-medium text-[hsl(var(--success))] md:flex"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
      </span>
      Live
      <span className="tabular-nums opacity-70">· {ago}s</span>
    </div>
  );
}

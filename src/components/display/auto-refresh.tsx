"use client";

// Auto-refresh headless (tanpa UI) untuk layar display/kiosk.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ sec = 15 }: { sec?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), Math.max(3, sec) * 1000);
    return () => clearInterval(id);
  }, [router, sec]);
  return null;
}

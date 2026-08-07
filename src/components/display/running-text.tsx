import { AlertTriangle } from "lucide-react";

/** Teks berjalan (marquee) peringatan untuk layar kiosk/display. Seamless loop (teks digandakan). */
export function RunningText({ text }: { text: string }) {
  return (
    <div className="flex shrink-0 items-center gap-4 overflow-hidden rounded-2xl border border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/10 px-5 py-3">
      <AlertTriangle className="h-7 w-7 shrink-0 text-[hsl(var(--warning))]" />
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap will-change-transform">
          <span className="px-10 text-lg font-medium text-foreground">{text}</span>
          <span className="px-10 text-lg font-medium text-foreground" aria-hidden="true">{text}</span>
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";

/** Teks berjalan (marquee) peringatan untuk layar kiosk/display. Bar amber lembut, seamless loop. */
export function RunningText({ text }: { text: string }) {
  return (
    <div className="flex shrink-0 items-center gap-5 overflow-hidden rounded-2xl bg-amber-200/90 px-6 py-5 ring-1 ring-amber-300/70">
      <AlertTriangle className="h-12 w-12 shrink-0 text-amber-700" />
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap will-change-transform">
          <span className="px-12 text-3xl font-bold tracking-tight text-amber-900">{text}</span>
          <span className="px-12 text-3xl font-bold tracking-tight text-amber-900" aria-hidden="true">{text}</span>
        </div>
      </div>
    </div>
  );
}

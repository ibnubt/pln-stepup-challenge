import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/config";

export function TierBadge({ tier, size = "sm" }: { tier: Tier; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium leading-none",
        size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
      )}
      style={{
        color: tier.color,
        borderColor: `${tier.color}55`,
        backgroundColor: `${tier.color}18`,
      }}
    >
      <span>{tier.emoji}</span>
      {tier.name}
    </span>
  );
}

export function Pill({
  children,
  className,
  tone = "muted",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "muted" | "primary" | "success" | "warning" | "accent";
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    success: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    warning: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    accent: "bg-pln-yellow/15 text-pln-gold",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

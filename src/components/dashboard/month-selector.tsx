"use client";

// Dropdown pilih PERIODE/siklus (filter historis). Navigasi ke ?month=<kunci-siklus> →
// server menghitung ulang untuk siklus itu. Siklus berjalan = opsi teratas.
import { useRouter, usePathname } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { cycleLabel } from "@/lib/utils";

export function MonthSelector({ month, available, resetDay }: { month: string; available: string[]; resetDay: number }) {
  const router = useRouter();
  const pathname = usePathname();
  // pastikan siklus terpilih selalu ada di daftar
  const opts = available.includes(month) ? available : [month, ...available];

  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
      <CalendarRange className="h-3.5 w-3.5 text-primary" />
      <select
        value={month}
        onChange={(e) => router.push(e.target.value === opts[0] ? pathname : `${pathname}?month=${e.target.value}`)}
        className="cursor-pointer bg-transparent font-medium text-foreground outline-none"
        title="Pilih periode (historis)"
      >
        {opts.map((m) => (
          <option key={m} value={m}>
            {cycleLabel(m, resetDay)}
          </option>
        ))}
      </select>
    </label>
  );
}

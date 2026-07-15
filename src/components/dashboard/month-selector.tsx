"use client";

// Dropdown pilih bulan (filter historis). Navigasi ke ?month=YYYY-MM → server
// menghitung ulang untuk bulan itu. Bulan berjalan = opsi teratas.
import { useRouter, usePathname } from "next/navigation";
import { CalendarRange } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return `${MONTHS[Number(mo) - 1]} ${y}`;
}

export function MonthSelector({ month, available }: { month: string; available: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  // pastikan bulan terpilih selalu ada di daftar
  const opts = available.includes(month) ? available : [month, ...available];

  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
      <CalendarRange className="h-3.5 w-3.5 text-primary" />
      <select
        value={month}
        onChange={(e) => router.push(e.target.value === opts[0] ? pathname : `${pathname}?month=${e.target.value}`)}
        className="cursor-pointer bg-transparent font-medium text-foreground outline-none"
        title="Pilih bulan (historis)"
      >
        {opts.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </select>
    </label>
  );
}

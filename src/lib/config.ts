// ============================================================================
// Model gedung PLN Pusat + parameter program "Naik Tangga"
// Sumber lantai: Door Config Report.csv (159 reader, mencakup B2..LT15).
// ============================================================================

/** Urutan level dari bawah ke atas. Index dipakai untuk hitung jumlah lantai. */
export const LEVELS = [
  "B2", "B1", "LT1", "LT2", "LT3", "LT4", "LT5", "LT6",
  "LT7", "LT8", "LT9", "LT10", "LT11", "LT12", "LT13", "LT14", "LT15",
] as const;

export type Level = (typeof LEVELS)[number];

export const LEVEL_LABEL: Record<Level, string> = {
  B2: "Basement 2",
  B1: "Basement 1",
  LT1: "Lantai 1 (Dasar)",
  LT2: "Lantai 2",
  LT3: "Lantai 3",
  LT4: "Lantai 4",
  LT5: "Lantai 5",
  LT6: "Lantai 6",
  LT7: "Lantai 7",
  LT8: "Lantai 8",
  LT9: "Lantai 9",
  LT10: "Lantai 10",
  LT11: "Lantai 11",
  LT12: "Lantai 12",
  LT13: "Lantai 13",
  LT14: "Lantai 14",
  LT15: "Lantai 15",
};

export const levelIndex = (l: Level | string) => LEVELS.indexOf(l as Level);

/** Zona checkpoint reward yang WAJIB dilewati (LT1–LT4). */
export const CHECKPOINT_ZONE: Level[] = ["LT1", "LT2", "LT3", "LT4"];
export const CHECKPOINT_MIN_IDX = levelIndex("LT1");
export const CHECKPOINT_MAX_IDX = levelIndex("LT4");

/** Lift hanya melayani LT1..LT15 (bukan basement). */
export const LIFT_MIN_IDX = levelIndex("LT1");
export const LIFT_MAX_IDX = levelIndex("LT15");

// ---- Poin dasar ----
export const POINTS_UP_PER_FLOOR = 100;
export const POINTS_DOWN_PER_FLOOR = 50;

// ---- Validasi sesi tangga (anti-curang) ----
export const SEC_PER_FLOOR_MIN = 4;
export const SEC_PER_FLOOR_MAX = 90;

// ============================================================================
// TIER / LEVEL
// Dua konsep berbeda memakai nama & warna yang sama:
//  (1) TIER KOEFISIEN  — dari lantai NAIK kumulatif dalam 1 HARI → pengali 1.0–2.0
//  (2) LEVEL PEGAWAI    — dari rata-rata lantai naik / hari aktif → badge peringkat
// ============================================================================
export interface Tier {
  key: string;
  name: string;
  emoji: string;
  koef: number;
  minDaily: number; // ambang lantai-naik kumulatif harian (untuk koefisien)
  maxDaily: number; // batas atas (tampilan)
  minAvg: number; // ambang rata-rata lantai-naik/hari (untuk level pegawai)
  color: string;
}

export const TIERS: Tier[] = [
  { key: "starter", name: "Starter", emoji: "🟢", koef: 1.0, minDaily: 0, maxDaily: 5, minAvg: 0, color: "#64748b" },
  { key: "bronze", name: "Bronze", emoji: "🥉", koef: 1.2, minDaily: 6, maxDaily: 10, minAvg: 3, color: "#c2803f" },
  { key: "silver", name: "Silver", emoji: "🥈", koef: 1.4, minDaily: 11, maxDaily: 15, minAvg: 5, color: "#9aa7b5" },
  { key: "gold", name: "Gold", emoji: "🥇", koef: 1.6, minDaily: 16, maxDaily: 20, minAvg: 8, color: "#f5a623" },
  { key: "platinum", name: "Platinum", emoji: "💎", koef: 1.8, minDaily: 21, maxDaily: 30, minAvg: 11, color: "#38bdf8" },
  { key: "champion", name: "Champion", emoji: "🏆", koef: 2.0, minDaily: 31, maxDaily: 999, minAvg: 15, color: "#ffcb05" },
];

/** Tier koefisien untuk lantai-naik kumulatif harian (gap-free). */
export function tierFor(dailyFloors: number): Tier {
  const f = Math.max(0, dailyFloors);
  let out = TIERS[0];
  for (const t of TIERS) if (f >= t.minDaily) out = t;
  return out;
}
export const koefFor = (dailyFloors: number) => tierFor(dailyFloors).koef;

/**
 * Level pegawai: dari rata-rata lantai-naik/hari aktif (gap-free) DAN konsistensi.
 * Level tinggi perlu cukup hari aktif — cegah "1 hari banyak naik → langsung Champion".
 *   1 hari aktif → maks Bronze · 2 → Silver · 3 → Gold · 4 → Platinum · 5+ → Champion
 */
export function levelFor(avgUpPerDay: number, activeDays = 99): Tier {
  const a = Math.max(0, avgUpPerDay);
  let baseIdx = 0;
  for (let i = 0; i < TIERS.length; i++) if (a >= TIERS[i].minAvg) baseIdx = i;
  const allowedMax = Math.min(TIERS.length - 1, Math.max(1, activeDays));
  return TIERS[Math.min(baseIdx, allowedMax)];
}

// ============================================================================
// PERSONA — kebiasaan pakai tangga (arketipe perilaku pada data)
// ============================================================================
export const PERSONA_LABEL: Record<string, string> = {
  champion: "Pegiat Tangga",
  regular: "Rutin",
  occasional: "Kadang",
  rare: "Jarang",
};
export const PERSONA_DESC: Record<string, string> = {
  champion: "Hampir selalu pilih tangga",
  regular: "Sering pakai tangga",
  occasional: "Kadang-kadang pakai tangga",
  rare: "Jarang pakai tangga",
};

// ============================================================================
// PARAMETER DAMPAK LIFT — model ISO 25745-2 (per-perjalanan)
// Tiap sesi tangga (naik/turun) = 1 perjalanan lift yang dihindari.
// Energi listrik per perjalanan lift 800 kg traksi ≈ 20 Wh — diskala dari
// contoh ISO 25745-2 (lift traksi ~25–28 Wh/perjalanan). Emisi = energi × grid.
// Ref: ISO 25745-2:2015 · EN ISO 25745-1:2012 · VDI 4707-1 · ACEEE.
// ============================================================================
export const IMPACT = {
  liftCapacityKg: 800, // kapasitas rated lift PLN Pusat
  liftWhPerTrip: 20, // Wh per PERJALANAN KABIN — ACEEE/Sachs 2005 (Enermodal 2004): 1.900 kWh/th ÷ 100.000 trip ≈ 19 Wh
  liftEnergyRef: "ACEEE 2005 (Sachs)",
  liftWhPerTripNote: "≈19 Wh/perjalanan · ACEEE 2005",
  avgBodyWeightKg: 58, // rujukan Kemenkes AKG 2019 (rata2 L 60 / P 55 kg)
  gridEfKgPerKwh: 0.87, // ESDM 2019 — grid Jamali, Combined Margin (kol.7). Alt OM=0,80
  gridEfSource: "ESDM 2019 · grid Jamali (CM)",
  floorHeightM: 3.5, // tinggi antar-lantai (m) — untuk info beban
  // Kalori (per kg berat badan per lantai naik/turun):
  kcalPerKgFloorUp: 0.11,
  kcalPerKgFloorDown: 0.045,
};

/** Rujukan antropometri Kemenkes AKG 2019 (Permenkes No. 28/2019). */
export const ANTHRO_ID = {
  source: "Kemenkes AKG 2019 (Permenkes 28/2019)",
  male: { weight: 60, height: 168 },
  female: { weight: 55, height: 159 },
};


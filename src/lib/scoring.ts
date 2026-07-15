// ============================================================================
// Scoring engine — Program "Naik Tangga"
// 1) rekonstruksi sesi tangga dari raw tap  2) koefisien progresif per-trip
// ============================================================================
import {
  levelIndex,
  koefFor,
  tierFor,
  levelFor,
  IMPACT,
  CHECKPOINT_MIN_IDX,
  CHECKPOINT_MAX_IDX,
  POINTS_UP_PER_FLOOR,
  POINTS_DOWN_PER_FLOOR,
  SEC_PER_FLOOR_MIN,
  SEC_PER_FLOOR_MAX,
  type Tier,
} from "./config";

export interface Tap {
  t: string; // "YYYY-MM-DDTHH:mm:ss" (waktu lokal)
  e: string; // employee id
  lvl: string;
  dev: string;
  kind: "stair" | "lift";
}

export interface Employee {
  id: string;
  name: string;
  card: number;
  unit: string;
  persona: string;
  office: string;
  gender: "L" | "P";
  weight: number;
  height: number;
  basement: string | null;
  real: boolean;
}

export interface SessionStep {
  lvl: string; // lantai
  t: string; // waktu tap (HH:mm:ss)
}

export interface Session {
  emp: string;
  date: string; // YYYY-MM-DD
  time: string; // waktu mulai
  hour: number;
  dir: "up" | "down";
  floors: number;
  startLevel: string;
  endLevel: string;
  checkpoint: boolean; // sesi ini melewati SELURUH zona LT1→LT4 (dipakai deteksi check-in harian)
  counted: boolean; // dapat poin (hari ini sudah check-in)
  koef: number;
  points: number;
  steps: SessionStep[]; // jejak lantai per tap
}

const ms = (t: string) => new Date(t).getTime();
const dateKey = (t: string) => t.slice(0, 10);

function groupBy<T>(arr: T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of arr) {
    const k = key(x);
    (m.get(k) ?? m.set(k, []).get(k)!).push(x);
  }
  return m;
}

/** Rekonstruksi sesi tangga dari deretan tap (1 pegawai, sudah urut waktu). */
function detectSessions(stairTaps: Tap[]): Omit<Session, "koef" | "points" | "counted">[] {
  const out: Omit<Session, "koef" | "points" | "counted">[] = [];
  let i = 0;
  while (i < stairTaps.length) {
    const run: Tap[] = [stairTaps[i]];
    let dir = 0;
    let j = i + 1;
    while (j < stairTaps.length) {
      const prev = stairTaps[j - 1];
      const now = stairTaps[j];
      const di = levelIndex(now.lvl) - levelIndex(prev.lvl);
      const gap = (ms(now.t) - ms(prev.t)) / 1000;
      const stepOk = Math.abs(di) === 1 && gap >= SEC_PER_FLOOR_MIN && gap <= SEC_PER_FLOOR_MAX;
      const dirOk = dir === 0 || Math.sign(di) === dir;
      if (stepOk && dirOk) {
        if (dir === 0) dir = Math.sign(di);
        run.push(now);
        j++;
      } else break;
    }
    if (run.length >= 2) {
      const startLevel = run[0].lvl;
      const endLevel = run[run.length - 1].lvl;
      const si = levelIndex(startLevel);
      const ei = levelIndex(endLevel);
      const lo = Math.min(si, ei);
      const hi = Math.max(si, ei);
      // check-in: sesi ini harus MELEWATI SELURUH zona LT1→LT4 (mencakup LT1 s/d LT4,
      // naik atau turun). Sekadar menyentuh tepi zona (mis. B1→LT1) TIDAK cukup.
      const checkpoint = lo <= CHECKPOINT_MIN_IDX && hi >= CHECKPOINT_MAX_IDX;
      out.push({
        emp: run[0].e,
        date: dateKey(run[0].t),
        time: run[0].t,
        hour: new Date(run[0].t).getHours(),
        dir: dir > 0 ? "up" : "down",
        floors: run.length - 1,
        startLevel,
        endLevel,
        checkpoint,
        steps: run.map((r) => ({ lvl: r.lvl, t: r.t.slice(11, 19) })),
      });
      i = j;
    } else {
      i += 1;
    }
  }
  return out;
}

/**
 * Skoring 1 pegawai dalam 1 hari.
 * ATURAN CHECK-IN: pegawai harus melewati SELURUH zona LT1→LT4 dalam satu sesi
 * (tap 1-2-3-4 atau sebaliknya) minimal sekali hari itu agar memenuhi syarat.
 * Setelah check-in, SEMUA sesi tangga hari itu dapat poin (termasuk gerakan antar-lantai
 * atas seperti LT7→LT9). Koefisien progresif per-trip.
 */
function scoreDay(daySessions: Omit<Session, "koef" | "points" | "counted">[]): Session[] {
  const sorted = [...daySessions].sort((a, b) => (a.time < b.time ? -1 : 1));
  const checkedIn = sorted.some((s) => s.checkpoint); // sudah tap checkpoint LT1-4 hari ini?
  let cumUp = 0; // akumulasi lantai NAIK hari itu
  const scored: Session[] = [];
  for (const s of sorted) {
    if (!checkedIn) {
      scored.push({ ...s, counted: false, koef: 0, points: 0 }); // belum check-in → tak dapat poin
      continue;
    }
    if (s.dir === "up") {
      const koef = koefFor(cumUp + s.floors);
      const points = s.floors * POINTS_UP_PER_FLOOR * koef;
      cumUp += s.floors;
      scored.push({ ...s, counted: true, koef, points: Math.round(points) });
    } else {
      const koef = koefFor(cumUp);
      const points = s.floors * POINTS_DOWN_PER_FLOOR * koef;
      scored.push({ ...s, counted: true, koef, points: Math.round(points) });
    }
  }
  return scored;
}

export interface DayStat {
  date: string;
  upFloors: number;
  downFloors: number;
  points: number;
  tier: Tier;
  stairTrips: number;
  liftTrips: number;
  checkedIn: boolean; // sudah tap checkpoint LT1-4 hari itu
}

export interface EmployeeStat {
  emp: Employee;
  totalPoints: number;
  upFloors: number;
  downFloors: number;
  upFloorsRaw: number; // termasuk sesi TANPA check-in (untuk tampilan "naik" abu-abu)
  downFloorsRaw: number;
  stairTripsRaw: number;
  activeDays: number;
  avgPointsPerDay: number;
  avgUpFloorsPerDay: number;
  bestDayPoints: number;
  stairTrips: number;
  liftTrips: number;
  stairShare: number; // 0..1 (tangga / total trip vertikal)
  currentStreak: number;
  longestStreak: number;
  tier: Tier; // berdasarkan rata2 lantai naik/hari
  days: DayStat[];
  sessions: Session[]; // seluruh sesi (untuk detail + jejak lantai)
}

export interface HourStat {
  hour: number;
  points: number;
  upFloors: number;
  downFloors: number;
  stairTrips: number;
}

export interface ScoreResult {
  sessions: Session[];
  employeeStats: EmployeeStat[];
  byDate: DayStat[];
  today: string;
  todayHourly: HourStat[];
  floorHeat: { level: string; stair: number; lift: number }[];
  hourly: { hour: number; up: number; down: number }[];
  kpi: {
    activeEmployees: number;
    totalEmployees: number;
    participation: number;
    upFloors: number;
    downFloors: number;
    totalPoints: number;
    stairTrips: number;
    liftTrips: number;
    stairShare: number;
    // ---- Dampak lift (kapasitas 800 kg) ----
    liftPersonTripsAvoided: number; // orang-perjalanan naik via tangga
    liftRidesAvoided: number; // ≈ orang-trip / kapasitas (10 pax)
    liftLoadAvoidedKgFloor: number; // beban (kg·lantai) tak dibebankan ke lift
    // ---- Energi & emisi lift yang tidak terpakai ----
    energyKwhAvoided: number;
    co2KgAvoided: number;
    // ---- Kalori ----
    caloriesUp: number;
    caloriesDown: number;
    calories: number;
  };
}

function streaks(dates: string[]): { current: number; longest: number } {
  if (!dates.length) return { current: 0, longest: 0 };
  const uniq = Array.from(new Set(dates)).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniq.length; i++) {
    const prev = new Date(uniq[i - 1]);
    const cur = new Date(uniq[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return { current: run, longest };
}

export function computeScores(taps: Tap[], employees: Employee[]): ScoreResult {
  const empById = new Map(employees.map((e) => [e.id, e]));
  const stairTaps = taps.filter((t) => t.kind === "stair");
  const liftTaps = taps.filter((t) => t.kind === "lift");

  // --- sesi per pegawai per hari ---
  const allSessions: Session[] = [];
  const byEmp = groupBy(stairTaps, (t) => t.e);
  for (const [, ts] of byEmp) {
    const sorted = [...ts].sort((a, b) => (a.t < b.t ? -1 : 1));
    const byDay = groupBy(sorted, (t) => dateKey(t.t));
    for (const [, dts] of byDay) {
      const raw = detectSessions(dts);
      allSessions.push(...scoreDay(raw));
    }
  }

  // lift trips per emp per day
  const liftByEmpDay = new Map<string, number>();
  for (const t of liftTaps) {
    const k = `${t.e}|${dateKey(t.t)}`;
    liftByEmpDay.set(k, (liftByEmpDay.get(k) ?? 0) + 1);
  }

  // --- agregasi per pegawai ---
  const employeeStats: EmployeeStat[] = [];
  const sessByEmp = groupBy(allSessions, (s) => s.emp);
  for (const emp of employees) {
    const allEmpSess = sessByEmp.get(emp.id) ?? [];
    // Pegawai tanpa satu pun sesi tangga (mis. tap tunggal yg tak jadi perjalanan)
    // → JANGAN tampilkan baris kosong. Baris muncul begitu ada sesi nyata.
    if (allEmpSess.length === 0) continue;
    const sess = allEmpSess.filter((s) => s.counted);
    const byDay = groupBy(sess, (s) => s.date);
    const days: DayStat[] = [];
    for (const [date, ds] of byDay) {
      const up = ds.filter((s) => s.dir === "up").reduce((a, s) => a + s.floors, 0);
      const down = ds.filter((s) => s.dir === "down").reduce((a, s) => a + s.floors, 0);
      const points = ds.reduce((a, s) => a + s.points, 0);
      days.push({
        date,
        upFloors: up,
        downFloors: down,
        points,
        tier: tierFor(up),
        stairTrips: ds.length,
        liftTrips: liftByEmpDay.get(`${emp.id}|${date}`) ?? 0,
        checkedIn: true, // hari yang muncul di sini pasti sudah check-in
      });
    }
    days.sort((a, b) => (a.date < b.date ? -1 : 1));
    const totalPoints = days.reduce((a, d) => a + d.points, 0);
    const upFloors = days.reduce((a, d) => a + d.upFloors, 0);
    const downFloors = days.reduce((a, d) => a + d.downFloors, 0);
    const stairTrips = sess.length;
    // metrik "raw" = seluruh sesi termasuk yang tanpa check-in (0 poin) — untuk tampilan
    const upFloorsRaw = allEmpSess.filter((s) => s.dir === "up").reduce((a, s) => a + s.floors, 0);
    const downFloorsRaw = allEmpSess.filter((s) => s.dir === "down").reduce((a, s) => a + s.floors, 0);
    const stairTripsRaw = allEmpSess.length;
    const liftTrips = days.reduce((a, d) => a + d.liftTrips, 0);
    const activeDays = days.length;
    const { current, longest } = streaks(days.map((d) => d.date));
    const avgUp = activeDays ? upFloors / activeDays : 0;
    employeeStats.push({
      emp,
      totalPoints,
      upFloors,
      downFloors,
      upFloorsRaw,
      downFloorsRaw,
      stairTripsRaw,
      activeDays,
      avgPointsPerDay: activeDays ? Math.round(totalPoints / activeDays) : 0,
      avgUpFloorsPerDay: Math.round(avgUp * 10) / 10,
      bestDayPoints: days.reduce((a, d) => Math.max(a, d.points), 0),
      stairTrips,
      liftTrips,
      stairShare: stairTrips + liftTrips ? stairTrips / (stairTrips + liftTrips) : 0,
      currentStreak: current,
      longestStreak: longest,
      tier: levelFor(avgUp, activeDays),
      days,
      sessions: allEmpSess.slice().sort((a, b) => (a.time < b.time ? -1 : 1)),
    });
  }
  employeeStats.sort((a, b) => b.totalPoints - a.totalPoints);

  // --- tren harian (org-wide) ---
  const dateMap = new Map<string, DayStat>();
  for (const s of allSessions) {
    if (!s.counted) continue;
    const d = dateMap.get(s.date) ?? {
      date: s.date,
      upFloors: 0,
      downFloors: 0,
      points: 0,
      tier: tierFor(0),
      stairTrips: 0,
      liftTrips: 0,
      checkedIn: true,
    };
    if (s.dir === "up") d.upFloors += s.floors;
    else d.downFloors += s.floors;
    d.points += s.points;
    d.stairTrips += 1;
    dateMap.set(s.date, d);
  }
  for (const t of liftTaps) {
    const d = dateMap.get(dateKey(t.t));
    if (d) d.liftTrips += 1;
  }
  const byDate = Array.from(dateMap.values()).sort((a, b) => (a.date < b.date ? -1 : 1));

  // --- heatmap lantai (traversal tangga vs lift per level) ---
  const heat = new Map<string, { stair: number; lift: number }>();
  for (const t of taps) {
    const h = heat.get(t.lvl) ?? { stair: 0, lift: 0 };
    if (t.kind === "stair") h.stair += 1;
    else h.lift += 1;
    heat.set(t.lvl, h);
  }
  const floorHeat = Array.from(heat.entries()).map(([level, v]) => ({ level, ...v }));

  // --- distribusi jam: trip tangga NAIK vs TURUN per jam ---
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, up: 0, down: 0 }));
  for (const s of allSessions) {
    if (!s.counted) continue;
    if (s.dir === "up") hourly[s.hour].up += 1;
    else hourly[s.hour].down += 1;
  }

  // --- hari ini (tanggal terakhir) + tren per jam ---
  const today = byDate.length ? byDate[byDate.length - 1].date : "";
  const todayHourly: HourStat[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    points: 0,
    upFloors: 0,
    downFloors: 0,
    stairTrips: 0,
  }));
  for (const s of allSessions) {
    if (!s.counted || s.date !== today) continue;
    const b = todayHourly[s.hour];
    b.points += s.points;
    if (s.dir === "up") b.upFloors += s.floors;
    else b.downFloors += s.floors;
    b.stairTrips += 1;
  }

  // --- KPI + dampak (berbobot berat badan tiap pegawai) ---
  const bwOf = (id: string) => empById.get(id)?.weight ?? IMPACT.avgBodyWeightKg;
  const counted = allSessions.filter((s) => s.counted);
  const qualUp = counted.filter((s) => s.dir === "up");
  const upFloors = qualUp.reduce((a, s) => a + s.floors, 0);
  const downFloors = counted
    .filter((s) => s.dir === "down")
    .reduce((a, s) => a + s.floors, 0);

  let loadKgFloor = 0;
  let calUp = 0;
  let calDn = 0;
  for (const s of counted) {
    const bw = bwOf(s.emp);
    loadKgFloor += s.floors * bw; // beban fisik dipindah (ton·lantai) — info
    if (s.dir === "up") calUp += s.floors * bw * IMPACT.kcalPerKgFloorUp;
    else calDn += s.floors * bw * IMPACT.kcalPerKgFloorDown;
  }
  // Emisi (ISO 25745-2): tiap sesi tangga = 1 perjalanan lift dihindari
  const liftTripsAvoided = counted.length;
  const energyKwh = (liftTripsAvoided * IMPACT.liftWhPerTrip) / 1000;
  const co2Kg = energyKwh * IMPACT.gridEfKgPerKwh;

  const totalPoints = employeeStats.reduce((a, e) => a + e.totalPoints, 0);
  const stairTrips = counted.length;
  const liftTrips = liftTaps.length;
  const activeEmployees = employeeStats.filter((e) => e.activeDays > 0).length;

  return {
    sessions: allSessions,
    employeeStats,
    byDate,
    today,
    todayHourly,
    floorHeat,
    hourly,
    kpi: {
      activeEmployees,
      totalEmployees: employeeStats.length, // hanya pegawai dgn sesi nyata (tanpa baris kosong)
      participation: employeeStats.length ? activeEmployees / employeeStats.length : 0,
      upFloors,
      downFloors,
      totalPoints,
      stairTrips,
      liftTrips,
      stairShare: stairTrips + liftTrips ? stairTrips / (stairTrips + liftTrips) : 0,
      liftPersonTripsAvoided: liftTripsAvoided,
      liftRidesAvoided: liftTripsAvoided,
      liftLoadAvoidedKgFloor: Math.round(loadKgFloor),
      energyKwhAvoided: Math.round(energyKwh * 100) / 100,
      co2KgAvoided: Math.round(co2Kg * 100) / 100,
      caloriesUp: Math.round(calUp),
      caloriesDown: Math.round(calDn),
      calories: Math.round(calUp + calDn),
    },
  };
}

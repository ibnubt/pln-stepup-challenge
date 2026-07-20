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
  HOLIDAYS,
  personaForStreak,
  isPlnEmployee,
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

// —— hari libur: weekend (Sabtu/Minggu) atau libur nasional (HOLIDAYS) ——
const isHoliday = (d: string) => {
  const wd = new Date(d + "T00:00:00Z").getUTCDay(); // 0=Min .. 6=Sab
  return wd === 0 || wd === 6 || HOLIDAYS.has(d);
};
// tanggal hari-KERJA berikutnya setelah `d` (lompati semua hari libur)
const nextWorkday = (d: string) => {
  const dt = new Date(d + "T00:00:00Z");
  if (Number.isNaN(dt.getTime())) return d; // tanggal tak valid → jangan lempar
  do {
    dt.setUTCDate(dt.getUTCDate() + 1);
  } while (isHoliday(dt.toISOString().slice(0, 10)));
  return dt.toISOString().slice(0, 10);
};

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
      // check-in: HANYA sesi NAIK yang melewati SELURUH zona LT1→LT4 (tapping 1-2-3-4).
      // Turun (4→1) TIDAK dianggap check-in. Sekadar menyentuh tepi (mis. B1→LT1) tak cukup.
      const checkpoint = dir > 0 && lo <= CHECKPOINT_MIN_IDX && hi >= CHECKPOINT_MAX_IDX;
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
      // Titik balik: bila tap berikutnya = ±1 lantai, gap valid, TAPI arah berlawanan
      // (mis. naik ke LT4 lalu turun), puncak DIBAGI ke sesi berikutnya agar segmen turun
      // terhitung penuh (LT4→LT1, bukan LT3→LT1) walau puncak hanya di-tap sekali.
      let nextI = j;
      if (j < stairTaps.length) {
        const prev = stairTaps[j - 1];
        const now = stairTaps[j];
        const di = levelIndex(now.lvl) - levelIndex(prev.lvl);
        const gap = (ms(now.t) - ms(prev.t)) / 1000;
        if (Math.abs(di) === 1 && gap >= SEC_PER_FLOOR_MIN && gap <= SEC_PER_FLOOR_MAX && Math.sign(di) !== dir) {
          nextI = j - 1; // bagikan tap puncak
        }
      }
      i = nextI;
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
  isPln: boolean; // true = Pegawai PLN, false = Non-Pegawai (TAD/ICON/dll) — dari kolom unit
  totalPoints: number;
  upFloors: number;
  downFloors: number;
  upFloorsRaw: number; // termasuk sesi TANPA check-in (untuk tampilan "naik" abu-abu)
  downFloorsRaw: number;
  stairTripsRaw: number;
  activeDays: number;
  avgPointsPerDay: number;
  avgUpFloorsPerDay: number;
  avgDownFloorsPerDay: number;
  bestDayPoints: number;
  stairTrips: number;
  liftTrips: number;
  stairShare: number; // 0..1 (tangga / total trip vertikal)
  currentStreak: number;
  longestStreak: number;
  persona: string; // kebiasaan dari streak hari-kerja terpanjang (champion/regular/occasional/rare)
  tier: Tier; // berdasarkan rata2 lantai naik/hari
  live: { floors: number; koef: number; color: string; emoji: string } | null; // sesi berjalan (tap terakhir ≤ ~2 mnt) → badge kedip
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
  month: string; // bulan yang ditampilkan "YYYY-MM"
  availableMonths: string[]; // bulan yg ada datanya (untuk filter historis), terbaru dulu
  todayHourly: HourStat[];
  floorHeat: { level: string; stair: number; lift: number }[];
  hourly: { hour: number; up: number; down: number }[];
  floorByDate: { level: string; date: string; stair: number; lift: number }[]; // untuk filter tanggal heatmap
  hourlyByDate: { date: string; hour: number; up: number; down: number }[]; // untuk filter tanggal distribusi jam
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

// Streak = hari-KERJA aktif berturut-turut. Hari libur (weekend/nasional) TIDAK
// dihitung & tidak memutus streak (mis. aktif Jumat lalu Senin = tetap nyambung).
function streaks(dates: string[]): { current: number; longest: number } {
  const uniq = Array.from(new Set(dates))
    .filter((d) => !isHoliday(d)) // aktivitas di hari libur tak dihitung
    .sort();
  if (!uniq.length) return { current: 0, longest: 0 };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniq.length; i++) {
    run = nextWorkday(uniq[i - 1]) === uniq[i] ? run + 1 : 1; // hari-kerja berturut?
    longest = Math.max(longest, run);
  }
  return { current: run, longest };
}

export function computeScores(
  taps: Tap[],
  employees: Employee[],
  opts?: { month?: string } // "YYYY-MM" — bulan yang ditampilkan (default: bulan berjalan WIB)
): ScoreResult {
  // bulan berjalan (WIB) sbg default; bisa pilih bulan lain utk filter historis
  const nowWibM = new Date(Date.now() + 7 * 3600 * 1000);
  const curMonth = `${nowWibM.getUTCFullYear()}-${String(nowWibM.getUTCMonth() + 1).padStart(2, "0")}`;
  const targetMonth = opts?.month || curMonth;
  // "sekarang" dalam jam WIB (naive-as-UTC) untuk deteksi sesi berjalan
  const nowMsWib = Date.now() + 7 * 3600 * 1000;
  const LIVE_WINDOW_MS = 120 * 1000; // tap terakhir ≤ 2 menit → dianggap sesi sedang berjalan
  // daftar bulan yg ADA datanya (untuk dropdown historis), terbaru dulu
  const availableMonths = Array.from(new Set(taps.filter((t) => t.kind === "stair").map((t) => t.t.slice(0, 7)))).sort().reverse();
  // batasi seluruh perhitungan ke bulan terpilih
  const monthTaps = taps.filter((t) => t.t.slice(0, 7) === targetMonth);
  const stairTaps = monthTaps.filter((t) => t.kind === "stair");
  const liftTaps = monthTaps.filter((t) => t.kind === "lift");

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
    const avgDown = activeDays ? downFloors / activeDays : 0;
    // sesi berjalan: sesi terbaru dgn tap terakhir ≤ 2 menit dari sekarang → badge kedip
    let live: EmployeeStat["live"] = null;
    const lastSess = [...allEmpSess].sort((a, b) => (a.time < b.time ? -1 : 1)).pop();
    if (lastSess && lastSess.steps.length) {
      const lt = lastSess.steps[lastSess.steps.length - 1].t; // "HH:mm:ss"
      const lastMs = Date.parse(`${lastSess.date}T${lt}Z`);
      const age = nowMsWib - lastMs;
      if (age >= 0 && age <= LIVE_WINDOW_MS) {
        const tr = tierFor(lastSess.floors); // ambang: Bronze@6 · Silver@11 · Gold@16 · dst
        live = { floors: lastSess.floors, koef: tr.koef, color: tr.color, emoji: tr.emoji };
      }
    }
    employeeStats.push({
      emp,
      isPln: isPlnEmployee(emp.unit),
      live,
      totalPoints,
      upFloors,
      downFloors,
      upFloorsRaw,
      downFloorsRaw,
      stairTripsRaw,
      activeDays,
      avgPointsPerDay: activeDays ? Math.round(totalPoints / activeDays) : 0,
      avgUpFloorsPerDay: Math.round(avgUp * 10) / 10,
      avgDownFloorsPerDay: Math.round(avgDown * 10) / 10,
      bestDayPoints: days.reduce((a, d) => Math.max(a, d.points), 0),
      stairTrips,
      liftTrips,
      stairShare: stairTrips + liftTrips ? stairTrips / (stairTrips + liftTrips) : 0,
      currentStreak: current,
      longestStreak: longest,
      persona: personaForStreak(longest), // dari streak hari-kerja terpanjang
      tier: levelFor(avgUp, activeDays),
      days,
      sessions: allEmpSess.slice().sort((a, b) => (a.time < b.time ? -1 : 1)),
    });
  }
  employeeStats.sort((a, b) => b.totalPoints - a.totalPoints);

  // --- tren harian BULAN BERJALAN (org-wide) ---
  const nowWib = new Date(Date.now() + 7 * 3600 * 1000); // WIB = UTC+7
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
  // rangka penuh: tanggal 1 s/d akhir bulan TERPILIH; hari tanpa data → nilai 0
  const [tY, tM] = targetMonth.split("-").map(Number); // tM = 1-12
  const daysInMonth = new Date(Date.UTC(tY, tM, 0)).getUTCDate();
  const monthPrefix = `${targetMonth}-`;
  const byDate: DayStat[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = monthPrefix + String(d).padStart(2, "0");
    byDate.push(
      dateMap.get(date) ?? {
        date,
        upFloors: 0,
        downFloors: 0,
        points: 0,
        tier: tierFor(0),
        stairTrips: 0,
        liftTrips: 0,
        checkedIn: false,
      }
    );
  }

  // --- heatmap lantai (traversal tangga vs lift per level) ---
  const heat = new Map<string, { stair: number; lift: number }>();
  for (const t of taps) {
    const h = heat.get(t.lvl) ?? { stair: 0, lift: 0 };
    if (t.kind === "stair") h.stair += 1;
    else h.lift += 1;
    heat.set(t.lvl, h);
  }
  const floorHeat = Array.from(heat.entries()).map(([level, v]) => ({ level, ...v }));

  // heatmap per (lantai, tanggal) — untuk filter interval tanggal di komponen
  const fbdMap = new Map<string, { level: string; date: string; stair: number; lift: number }>();
  for (const t of monthTaps) {
    const date = dateKey(t.t);
    const key = `${t.lvl}|${date}`;
    const e = fbdMap.get(key) ?? { level: t.lvl, date, stair: 0, lift: 0 };
    if (t.kind === "stair") e.stair += 1;
    else e.lift += 1;
    fbdMap.set(key, e);
  }
  const floorByDate = Array.from(fbdMap.values());

  // distribusi jam per (tanggal, jam) — untuk filter interval tanggal
  const hbdMap = new Map<string, { date: string; hour: number; up: number; down: number }>();
  for (const s of allSessions) {
    if (!s.counted) continue;
    const key = `${s.date}|${s.hour}`;
    const e = hbdMap.get(key) ?? { date: s.date, hour: s.hour, up: 0, down: 0 };
    if (s.dir === "up") e.up += 1;
    else e.down += 1;
    hbdMap.set(key, e);
  }
  const hourlyByDate = Array.from(hbdMap.values());

  // --- distribusi jam: trip tangga NAIK vs TURUN per jam ---
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, up: 0, down: 0 }));
  for (const s of allSessions) {
    if (!s.counted) continue;
    if (s.dir === "up") hourly[s.hour].up += 1;
    else hourly[s.hour].down += 1;
  }

  // --- HARI INI: ikut tanggal KALENDER (WIB), bukan hari data terakhir ---
  // (kalau belum ada tap hari ini, chart "Hari Ini" tampil kosong dgn tanggal hari ini)
  const today = `${nowWib.getUTCFullYear()}-${String(nowWib.getUTCMonth() + 1).padStart(2, "0")}-${String(nowWib.getUTCDate()).padStart(2, "0")}`;
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
  const bwOf = (_id: string) => IMPACT.avgBodyWeightKg; // berat tetap 60 kg (tanpa bedakan gender)
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
    month: targetMonth,
    availableMonths,
    todayHourly,
    floorHeat,
    hourly,
    floorByDate,
    hourlyByDate,
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

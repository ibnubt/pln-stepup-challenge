// ============================================================================
// Generator data sintetis — Program "Naik Tangga" PLN Pusat
// Output: src/data/taps.json  (raw tap events, siap diproses scoring engine)
//         src/data/employees.json (roster pegawai)
// Reproducible (seeded PRNG). Jalankan: npm run gen
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "src", "data");

const LEVELS = [
  "B2", "B1", "LT1", "LT2", "LT3", "LT4", "LT5", "LT6",
  "LT7", "LT8", "LT9", "LT10", "LT11", "LT12", "LT13", "LT14", "LT15",
];
const idx = (l) => LEVELS.indexOf(l);
const GROUND = "LT1";

// ---- Seeded PRNG (mulberry32) ----
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260706);
const rnd = (a, b) => a + (b - a) * rand();
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const chance = (p) => rand() < p;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// distribusi normal (Box-Muller) untuk berat/tinggi realistis
const gauss = (mean, sd) => {
  const u = Math.max(1e-9, rand());
  const v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ---- Roster ----
const NAMES = [
  "Budi Santoso", "Sari Wulandari", "Andi Pratama", "Dewi Lestari", "Rizki Ramadhan",
  "Putri Anggraini", "Agus Setiawan", "Nur Halimah", "Fajar Nugroho", "Maya Sari",
  "Bayu Aji", "Rina Marlina", "Doni Kurniawan", "Siti Aminah", "Eko Prasetyo",
  "Wati Ningsih", "Hendra Gunawan", "Lia Amelia", "Yoga Pratomo", "Indah Permata",
  "Arif Rahman", "Tuti Handayani", "Galih Saputra", "Vina Oktaviani", "Reza Fauzi",
  "Mega Utami", "Danang Wibowo", "Ayu Safitri", "Ferry Hidayat",
];
const UNITS = [
  "DIVMUM", "SEKPER", "P2IS", "HKK", "MEP", "K3L", "AKUNTANSI", "PIKK",
  "SDT", "PMO", "CIRATA", "SAGULING", "TCO", "DKM", "PBH", "SAD", "YPK", "DIGFOR",
];
const PERSONAS = {
  champion: { stair: 0.92, attend: 0.96, maxActs: 6, label: "Champion" },
  regular: { stair: 0.6, attend: 0.93, maxActs: 5, label: "Regular" },
  occasional: { stair: 0.34, attend: 0.9, maxActs: 4, label: "Occasional" },
  rare: { stair: 0.12, attend: 0.89, maxActs: 3, label: "Rare" },
};
// distribusi: 5 champion, 9 regular, 9 occasional, 7 rare (+ FAISAL sbg regular) = 30
const PERSONA_PLAN = [
  ...Array(5).fill("champion"),
  ...Array(8).fill("regular"),
  ...Array(9).fill("occasional"),
  ...Array(7).fill("rare"),
]; // 29 -> FAISAL ditambah sbg regular

// office floor pool (dominan mid/atas, sedikit bawah)
const OFFICE_POOL = ["LT2", "LT3", "LT4", "LT5", "LT6", "LT7", "LT8", "LT9", "LT10", "LT11", "LT12", "LT13", "LT14", "LT15", "LT16"];

const employees = [];
for (let i = 0; i < NAMES.length; i++) {
  const persona = PERSONA_PLAN[i] ?? "occasional";
  const office = OFFICE_POOL[rndInt(0, OFFICE_POOL.length - 1)];
  // ~55% pegawai parkir di basement (B1/B2) → wajib naik tangga ke LT1 (lift tak layani basement)
  const basement = chance(0.55) ? (chance(0.5) ? "B1" : "B2") : null;
  // Berat & tinggi mengacu rujukan Kemenkes AKG 2019 (Permenkes 28/2019):
  //   Laki-laki dewasa 60 kg / 168 cm · Perempuan dewasa 55 kg / 159 cm
  const gender = chance(0.55) ? "L" : "P";
  const weight = clamp(Math.round(gauss(gender === "L" ? 60 : 55, 8)), 45, 95);
  const height = clamp(Math.round(gauss(gender === "L" ? 168 : 159, 6)), 148, 190);
  employees.push({
    id: `E${String(i + 1).padStart(3, "0")}`,
    name: NAMES[i].toUpperCase(),
    card: 13300 + i * 7 + 3,
    unit: UNITS[i % UNITS.length],
    persona,
    office,
    gender,
    weight,
    height,
    basement,
    real: false,
  });
}
// FAISAL — pegawai nyata (card asli 13328)
employees.push({
  id: "E030",
  name: "FAISAL — ICON MULMED",
  card: 13328,
  unit: "DIVMUM",
  persona: "regular",
  office: "LT2",
  gender: "L",
  weight: 66,
  height: 170,
  basement: "B1",
  real: true,
});

// ---- Waktu ----
const p2 = (n) => String(n).padStart(2, "0");
const fmtLocal = (d) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;

// BULAN BERJALAN: 1 Juli 2026 .. 9 Juli 2026 (hari ini)
const TODAY = new Date(2026, 6, 9);
const START = new Date(2026, 6, 1);
const END = new Date(TODAY);

const taps = [];
const SEC_PER_FLOOR = [8, 34]; // realistis jalan tangga per lantai

/** Emit satu sesi tangga dari a ke b (per lantai). Return waktu selesai (ms). */
function stairSession(emp, a, b, startMs) {
  const s = idx(a), e = idx(b);
  const step = e > s ? 1 : -1;
  let t = startMs;
  for (let i = s; ; i += step) {
    taps.push({
      t: fmtLocal(new Date(t)),
      e: emp.id,
      lvl: LEVELS[i],
      dev: `TANGGA-CP ${LEVELS[i]}`,
      kind: "stair",
    });
    if (i === e) break;
    t += rndInt(SEC_PER_FLOOR[0], SEC_PER_FLOOR[1]) * 1000;
  }
  return t;
}

/** Emit satu perjalanan lift (1 tap di lobby lift tujuan). */
function liftTrip(emp, dest, ms) {
  taps.push({
    t: fmtLocal(new Date(ms)),
    e: emp.id,
    lvl: dest,
    dev: `LOBBY LIFT ${dest}`,
    kind: "lift",
  });
}

/** Keputusan tangga vs lift untuk satu perpindahan vertikal. */
function useStairs(emp, a, b) {
  const floors = Math.abs(idx(b) - idx(a));
  if (floors === 0) return false;
  const goingDown = idx(b) < idx(a);
  const base = PERSONAS[emp.persona].stair;
  // makin tinggi makin enggan tangga; turun lebih gampang
  let height = clamp(1 - (floors - 3) * 0.07, 0.12, 1);
  if (goingDown) height = clamp(height + 0.25, 0.12, 1);
  return chance(base * height);
}

/** Satu perpindahan: pilih tangga atau lift, emit event. Return waktu selesai. */
function move(emp, a, b, startMs) {
  if (a === b) return startMs;
  if (useStairs(emp, a, b)) {
    return stairSession(emp, a, b, startMs);
  }
  const floors = Math.abs(idx(b) - idx(a));
  liftTrip(emp, b, startMs + rndInt(20, 60) * 1000);
  return startMs + (floors * 4 + rndInt(15, 40)) * 1000;
}

/** Pindah `from`→`to` dengan menghormati basement (lift TAK melayani basement). */
function goTo(emp, from, to, startMs) {
  if (from === to) return startMs;
  const gi = idx(GROUND);
  const fromBase = idx(from) < gi;
  const toBase = idx(to) < gi;
  if (fromBase === toBase) return move(emp, from, to, startMs); // sisi sama
  if (fromBase) {
    // basement → atas: kalau tangga penuh langsung; kalau tidak, tangga ke LT1 lalu lift
    if (useStairs(emp, from, to)) return stairSession(emp, from, to, startMs);
    const a = stairSession(emp, from, GROUND, startMs);
    return move(emp, GROUND, to, a + rndInt(20, 60) * 1000);
  }
  // atas → basement
  if (useStairs(emp, from, to)) return stairSession(emp, from, to, startMs);
  const a = move(emp, from, GROUND, startMs);
  return stairSession(emp, GROUND, to, a + rndInt(20, 60) * 1000);
}

/** Lantai kunjungan/rapat acak (LT2..LT15), selain lantai sekarang. */
function randomFloor(exclude) {
  let f;
  do {
    f = "LT" + rndInt(2, 15);
  } while (f === exclude);
  return f;
}

const H = (h, m = 0) => (h * 60 + m) * 60 * 1000; // helper jam→ms

// ---- Simulasi harian (acak & bervariasi) ----
for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 1)) {
  const dow = d.getDay(); // 0=Min,6=Sab
  const weekend = dow === 0 || dow === 6;
  for (const emp of employees) {
    const P = PERSONAS[emp.persona];
    if (!chance(weekend ? 0.08 : P.attend)) continue;

    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const office = emp.office;
    const home = emp.basement || GROUND;
    let cur = home;

    // 1) Datang pagi → kantor
    let t = day + H(rndInt(6, 8), rndInt(30, 59));
    t = goTo(emp, cur, office, t);
    cur = office;

    // 2) Aktivitas siang: rangkaian tujuan ACAK (0..maxActs)
    //    campuran — turun ke lantai dasar (makan/ATM/masjid), ke basement (mobil),
    //    atau rapat/kunjungan di lantai atas acak (mis. LT7→LT9 → di luar checkpoint).
    const nActs = rndInt(0, P.maxActs);
    let clock = day + H(10, rndInt(0, 40));
    for (let a = 0; a < nActs; a++) {
      clock += rndInt(25, 110) * 60 * 1000;
      if (clock > day + H(16, 30)) break; // jangan lewat jam pulang
      t = Math.max(t, clock);
      const r = rand();
      let dest;
      if (r < 0.35) dest = GROUND; // fasilitas lantai dasar → lewat checkpoint
      else if (r < 0.5 && emp.basement) dest = emp.basement; // ke mobil sebentar
      else dest = randomFloor(cur); // rapat lantai acak → sering di luar checkpoint
      t = goTo(emp, cur, dest, t);
      cur = dest;
      // sering balik ke kantor setelah aktivitas
      if (dest !== office && chance(0.6)) {
        t += rndInt(15, 60) * 60 * 1000;
        t = goTo(emp, cur, office, t);
        cur = office;
      }
    }

    // 3) Pulang sore: dari posisi terakhir → home
    const out = Math.max(t + rndInt(10, 40) * 60 * 1000, day + H(rndInt(16, 19), rndInt(0, 59)));
    goTo(emp, cur, home, out);
  }
}

// urutkan kronologis
taps.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(path.join(DATA_DIR, "taps.json"), JSON.stringify(taps));
fs.writeFileSync(
  path.join(DATA_DIR, "employees.json"),
  JSON.stringify(employees, null, 2)
);

// ---- ringkasan ----
const byKind = taps.reduce((m, t) => ((m[t.kind] = (m[t.kind] || 0) + 1), m), {});
console.log(`✓ ${employees.length} pegawai, ${taps.length} tap events`);
console.log(`  kind:`, byKind);
console.log(`  rentang: ${taps[0].t} .. ${taps[taps.length - 1].t}`);
console.log(`  → src/data/taps.json, src/data/employees.json`);

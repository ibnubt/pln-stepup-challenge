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
  champion: { stair: 0.92, attend: 0.96, extra: 0.65, label: "Champion" },
  regular: { stair: 0.6, attend: 0.93, extra: 0.42, label: "Regular" },
  occasional: { stair: 0.34, attend: 0.9, extra: 0.28, label: "Occasional" },
  rare: { stair: 0.12, attend: 0.89, extra: 0.15, label: "Rare" },
};
// distribusi: 5 champion, 9 regular, 9 occasional, 7 rare (+ FAISAL sbg regular) = 30
const PERSONA_PLAN = [
  ...Array(5).fill("champion"),
  ...Array(8).fill("regular"),
  ...Array(9).fill("occasional"),
  ...Array(7).fill("rare"),
]; // 29 -> FAISAL ditambah sbg regular

// office floor pool (dominan mid/atas, sedikit bawah)
const OFFICE_POOL = ["LT2", "LT3", "LT4", "LT5", "LT6", "LT7", "LT8", "LT10", "LT12", "LT13", "LT14", "LT15"];

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

// ---- Simulasi harian ----
for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 1)) {
  const dow = d.getDay(); // 0=Min,6=Sab
  const weekend = dow === 0 || dow === 6;
  for (const emp of employees) {
    const P = PERSONAS[emp.persona];
    const attendP = weekend ? 0.08 : P.attend;
    if (!chance(attendP)) continue;

    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const office = emp.office;

    // Datang pagi: (basement →) LT1 → office
    let ms = day.getTime() + (rndInt(6, 8) * 60 + rndInt(30, 59)) * 60 * 1000;
    if (emp.basement) {
      if (useStairs(emp, emp.basement, office)) {
        stairSession(emp, emp.basement, office, ms); // tangga sampai atas
      } else {
        const after = stairSession(emp, emp.basement, GROUND, ms); // wajib naik dari basement
        move(emp, GROUND, office, after + rndInt(20, 60) * 1000);
      }
    } else {
      move(emp, GROUND, office, ms);
    }

    // Jam makan siang: office -> LT1 -> office (p tergantung persona)
    if (chance(0.72)) {
      let lunch = day.getTime() + (11 * 60 + rndInt(30, 90)) * 60 * 1000;
      const after = move(emp, office, GROUND, lunch);
      const back = after + rndInt(35, 70) * 60 * 1000;
      move(emp, GROUND, office, back);
    }

    // Trip ekstra mid-day (rapat antar lantai)
    if (chance(P.extra)) {
      const other = OFFICE_POOL[rndInt(0, OFFICE_POOL.length - 1)];
      let t = day.getTime() + (rndInt(9, 15) * 60 + rndInt(0, 59)) * 60 * 1000;
      const a2 = move(emp, office, other, t);
      move(emp, other, office, a2 + rndInt(20, 50) * 60 * 1000);
    }

    // Pulang sore: office → LT1 (→ basement)
    let out = day.getTime() + (rndInt(16, 19) * 60 + rndInt(0, 59)) * 60 * 1000;
    if (emp.basement) {
      if (useStairs(emp, office, emp.basement)) {
        stairSession(emp, office, emp.basement, out);
      } else {
        const after = move(emp, office, GROUND, out);
        stairSession(emp, GROUND, emp.basement, after + rndInt(20, 60) * 1000);
      }
    } else {
      move(emp, office, GROUND, out);
    }
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

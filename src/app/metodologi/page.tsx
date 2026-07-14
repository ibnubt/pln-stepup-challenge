import Link from "next/link";
import { getScores } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, SectionLabel } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { fmt } from "@/lib/utils";
import {
  POINTS_UP_PER_FLOOR,
  POINTS_DOWN_PER_FLOOR,
  TIERS,
  SEC_PER_FLOOR_MIN,
  SEC_PER_FLOOR_MAX,
  CHECKPOINT_ZONE,
  IMPACT,
  ANTHRO_ID,
  LEVELS,
} from "@/lib/config";
import { ArrowLeft, BookOpen } from "lucide-react";

// —— helper tampilan ——
function Section({
  n,
  title,
  sub,
  children,
}: {
  n: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>
          <SectionLabel>Bagian {n}</SectionLabel>
          <h3 className="text-sm font-semibold">{title}</h3>
          {sub && <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">{sub}</p>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-[12px] leading-relaxed text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

function F({ children }: { children: React.ReactNode }) {
  return (
    <pre className="tabular overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px] text-foreground">
      {children}
    </pre>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium text-foreground">{v}</span>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function MetodologiPage() {
  const s = await getScores();
  const k = s.kpi;

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
              <img src="/logo-pln.svg" alt="PLN" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-semibold tracking-tight">Metodologi &amp; Rumus</h1>
                <span className="rounded bg-pln-yellow/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pln-gold">
                  Dokumentasi
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Keterangan perhitungan tiap metrik dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container space-y-4 py-6">
        {/* Intro / alur */}
        <Card className="animate-fade-in">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-primary" />
              Alur perhitungan (pipeline)
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Semua angka di dashboard berasal dari <b className="text-foreground">tap RFID mentah</b>, diproses lewat
              5 tahap berikut. Tidak ada angka yang &quot;dikarang&quot; kecuali yang ditandai eksplisit sebagai
              estimasi.
            </p>
            <div className="mt-3">
              <F>{`RAW TAP (taps.json)
   → [1] Deteksi sesi tangga (rangkai tap berurutan)
   → [2] Cek check-in harian (lewati LT1→LT4 penuh) → tentukan hari berpoin
   → [3] Skoring poin (koefisien progresif per-trip)
   → [4] Agregasi per pegawai / per hari / org
   → [5] KPI + Dampak (energi, emisi, kalori)`}</F>
            </div>
          </CardContent>
        </Card>

        {/* 1. Sumber data */}
        <Section n="1" title="Sumber Data">
          <Row k="Tap RFID (taps.json)" v="tiap tap = 1 checkpoint lantai · field: waktu, id pegawai, lantai, device, kind (stair/lift)" />
          <Row k="Pegawai (employees.json)" v="id, nama, unit, gender, berat, tinggi, kantor, parkir, persona" />
          <Row k="Peta lantai (doors-by-floor.json)" v="dari Door Config Report — 159 reader, mencakup B2 s/d LT15" />
          <Row k="Rentang data" v="bulan berjalan (mulai tgl 1)" />
          <p className="pt-1">
            Model gedung: <b className="text-foreground">18 level</b> (B2, B1, LT1–LT16). Lift melayani LT1–LT16;
            basement wajib tangga.
          </p>
        </Section>

        {/* 2. Deteksi sesi */}
        <Section
          n="2"
          title="Deteksi Sesi Tangga"
          sub="Dua tap berurutan digabung jadi satu sesi hanya bila SEMUA aturan terpenuhi."
        >
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 font-semibold">Aturan</th>
                <th className="py-1.5 font-semibold">Syarat</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <tr className="border-b border-border/50"><td className="py-1.5 pr-3">Lantai bersebelahan</td><td>|Δlantai| = 1</td></tr>
              <tr className="border-b border-border/50"><td className="py-1.5 pr-3">Jeda wajar</td><td className="tabular">{SEC_PER_FLOOR_MIN}–{SEC_PER_FLOOR_MAX} detik antar-tap</td></tr>
              <tr className="border-b border-border/50"><td className="py-1.5 pr-3">Arah konsisten</td><td>semua naik ATAU semua turun</td></tr>
              <tr><td className="py-1.5 pr-3">Minimal panjang</td><td>≥ 2 tap (≥ 1 lantai)</td></tr>
            </tbody>
          </table>
          <F>{`jumlah lantai (sesi) = jumlah tap − 1
Jeda > ${SEC_PER_FLOOR_MAX} detik  →  sesi PUTUS, mulai sesi baru`}</F>
          <p>
            <b className="text-foreground">Aturan check-in:</b> pegawai wajib{" "}
            <b className="text-pln-gold">melewati seluruh {CHECKPOINT_ZONE.join("→")}</b> dalam satu sesi (tap{" "}
            {CHECKPOINT_ZONE.join("-")} atau sebaliknya) minimal sekali (biasanya saat datang pagi). Sekadar menyentuh
            tepi zona (mis. B1→LT1) belum dianggap check-in. <b className="text-foreground">Setelah check-in, SEMUA sesi
            tangga hari itu dapat poin</b> — termasuk gerakan antar-lantai atas (mis. LT7→LT9), tanpa harus lewat LT1–LT4
            lagi. Hari <b className="text-foreground">tanpa check-in → tidak ada poin</b>.
          </p>
        </Section>

        {/* 3. Poin */}
        <Section n="3" title="Poin Reward" sub="Koefisien progresif per-trip.">
          <F>{`Per pegawai, per hari. Sesi diurut waktu.
C = akumulasi lantai NAIK hari itu (mulai 0)

NAIK  n lantai → koef = tier(C + n) ; poin = n × ${POINTS_UP_PER_FLOOR} × koef ; lalu C += n
TURUN m lantai → koef = tier(C)     ; poin = m × ${POINTS_DOWN_PER_FLOOR} × koef`}</F>
          <div className="pt-1">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tier koefisien (dari lantai naik kumulatif harian)
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-1 font-semibold">Tier</th>
                  <th className="py-1 text-right font-semibold">Lantai naik/hari</th>
                  <th className="py-1 text-right font-semibold">Koefisien</th>
                </tr>
              </thead>
              <tbody className="tabular text-foreground">
                {TIERS.map((t) => (
                  <tr key={t.key} className="border-b border-border/50 last:border-0">
                    <td className="py-1" style={{ color: t.color }}>{t.emoji} {t.name}</td>
                    <td className="py-1 text-right">{t.minDaily}–{t.maxDaily === 999 ? "∞" : t.maxDaily}</td>
                    <td className="py-1 text-right">×{t.koef.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pt-1 text-[11px]">
            <b className="text-foreground">Contoh:</b> naik LT1→LT12 saat C sudah 12 → koef tier(23)=×1,8 → 11 × {POINTS_UP_PER_FLOOR} × 1,8 ={" "}
            {fmt(11 * POINTS_UP_PER_FLOOR * 1.8)} poin.
          </p>
        </Section>

        {/* 4. Level pegawai */}
        <Section n="4" title="Level Pegawai (badge leaderboard)" sub="BEDA dari koefisien harian.">
          <F>{`Level = tier( rata-rata lantai naik / hari aktif )
        dengan GUARD konsistensi:
        1 hari aktif → maks Bronze · 2 → Silver · 3 → Gold
        4 → Platinum · 5+ → Champion`}</F>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1 font-semibold">Level</th>
                <th className="py-1 text-right font-semibold">Rata-rata lantai naik/hari</th>
              </tr>
            </thead>
            <tbody className="tabular text-foreground">
              {TIERS.map((t) => (
                <tr key={t.key} className="border-b border-border/50 last:border-0">
                  <td className="py-1" style={{ color: t.color }}>{t.emoji} {t.name}</td>
                  <td className="py-1 text-right">≥ {t.minAvg}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px]">
            Guard mencegah &quot;1 hari banyak naik → langsung Champion&quot;. Level butuh konsistensi hari aktif.
          </p>
        </Section>

        {/* 5. KPI cards */}
        <Section n="5" title="KPI (kartu ringkasan atas)" sub="Rumus tiap kartu + contoh dari data saat ini.">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 font-semibold">KPI</th>
                <th className="py-1.5 font-semibold">Rumus</th>
                <th className="py-1.5 text-right font-semibold">Nilai</th>
              </tr>
            </thead>
            <tbody className="align-top text-foreground">
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-2">Pegawai Aktif</td>
                <td className="py-1.5 pr-2 text-muted-foreground">pegawai dengan ≥ 1 hari sesi valid; partisipasi = aktif ÷ total</td>
                <td className="tabular py-1.5 text-right">{fmt(k.activeEmployees)} ({Math.round(k.participation * 100)}%)</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-2">Lantai Naik / Turun</td>
                <td className="py-1.5 pr-2 text-muted-foreground">Σ lantai sesi valid per arah</td>
                <td className="tabular py-1.5 text-right">{fmt(k.upFloors)} / {fmt(k.downFloors)}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-2">Total Poin</td>
                <td className="py-1.5 pr-2 text-muted-foreground">Σ poin seluruh pegawai (lihat Bagian 3)</td>
                <td className="tabular py-1.5 text-right">{fmt(k.totalPoints)}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-2">Share Tangga</td>
                <td className="py-1.5 pr-2 text-muted-foreground">trip tangga ÷ (trip tangga + trip lift)</td>
                <td className="tabular py-1.5 text-right">{Math.round(k.stairShare * 100)}%</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-2">Lift Dihindari</td>
                <td className="py-1.5 pr-2 text-muted-foreground">jumlah sesi tangga berpoin (hari check-in) <span className="text-[hsl(var(--warning))]">(per-sesi, batas atas)</span></td>
                <td className="tabular py-1.5 text-right">{fmt(k.liftRidesAvoided)}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-2">CO₂ Ditekan</td>
                <td className="py-1.5 pr-2 text-muted-foreground">sesi × {IMPACT.liftWhPerTrip} Wh × {IMPACT.gridEfKgPerKwh} (lihat Bagian 6)</td>
                <td className="tabular py-1.5 text-right">{fmt(k.co2KgAvoided, 2)} kg</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-2">Kalori Terbakar</td>
                <td className="py-1.5 pr-2 text-muted-foreground">Σ (lantai × berat × kkal/kg) (lihat Bagian 6)</td>
                <td className="tabular py-1.5 text-right">{fmt(k.calories)} kkal</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* 6. Dampak */}
        <Section n="6" title="Dampak Program — Lift · Emisi · Kalori" sub="Rincian rumus + sumber tiap angka.">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">A. Lift Dihindari</div>
          <F>{`Lift Dihindari = jumlah sesi tangga berpoin, naik+turun (hari check-in) = ${fmt(k.liftRidesAvoided)}`}</F>
          <p className="text-[11px]">
            ⚠️ Asumsi <b className="text-foreground">1 sesi = 1 perjalanan lift</b> (okupansi belum dikoreksi → batas
            atas). Koreksi lanjutan = bagi okupansi (orang per perjalanan lift).
          </p>

          <div className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">B. Emisi CO₂</div>
          <F>{`Energi  = jumlah perjalanan × ${IMPACT.liftWhPerTrip} Wh
Emisi   = Energi (kWh) × ${IMPACT.gridEfKgPerKwh} kg CO₂/kWh
        = ${fmt(k.liftRidesAvoided)} × ${IMPACT.liftWhPerTrip} Wh × ${IMPACT.gridEfKgPerKwh}
        = ${fmt(k.energyKwhAvoided, 2)} kWh → ${fmt(k.co2KgAvoided, 2)} kg CO₂`}</F>
          <Row k="20 Wh/perjalanan" v={<span>ACEEE (Sachs 2005): 1.900 kWh/th ÷ 100.000 trip ≈ 19 Wh</span>} />
          <Row k={`${IMPACT.gridEfKgPerKwh} kg CO₂/kWh`} v="proyeksi emisi grid nasional 2025 (773 g/kWh; turun s/d 2060)" />

          <div className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">C. Kalori</div>
          <F>{`Naik  : Σ (lantai × berat) × ${IMPACT.kcalPerKgFloorUp} kcal/kg/lantai = ${fmt(k.caloriesUp)} kcal
Turun : Σ (lantai × berat) × ${IMPACT.kcalPerKgFloorDown} kcal/kg/lantai = ${fmt(k.caloriesDown)} kcal
Total = ${fmt(k.calories)} kkal`}</F>
          <Row k="Berat badan" v={`Kemenkes AKG 2019 — L ${ANTHRO_ID.male.weight} kg, P ${ANTHRO_ID.female.weight} kg`} />
        </Section>

        {/* 7. Grafik */}
        <Section n="7" title="Grafik &amp; Visual">
          <Row k="Tren Bulan Berjalan" v="Poin, Lantai Naik, Lantai Turun per hari (toggle 'Hari Ini' = per jam hari terakhir)" />
          <Row k="Distribusi Jam" v="jumlah sesi tangga NAIK vs TURUN per jam" />
          <Row k="Peta Vertikal Gedung" v={`jumlah tap tangga per lantai (${LEVELS[0]}–${LEVELS[LEVELS.length - 1]}); zona ${CHECKPOINT_ZONE.join("–")} disorot`} />
          <Row k="Distribusi Level" v="jumlah pegawai aktif per level (lihat Bagian 4)" />
          <Row k="Leaderboard" v="urut poin; kolom Trip Tangga = jumlah sesi valid; Streak = hari aktif beruntun" />
        </Section>

        {/* 8. Referensi */}
        <Section n="8" title="Referensi &amp; Sumber Resmi">
          <Row k="Energi lift (20 Wh/perjalanan)" v="ACEEE — Sachs, H. (2005), Opportunities for Elevator Energy Efficiency Improvements" />
          <Row k="Faktor emisi (0,773 kg/kWh)" v="proyeksi emisi grid nasional 2025 — 773 g/kWh (−6% 2030 · −37% 2040 · −75% 2050 · −100% 2060)" />
          <Row k="Berat/tinggi badan" v="Kemenkes AKG 2019 (Permenkes No. 28/2019)" />
          <Row k="Peta lantai gedung" v="Door Config Report (159 reader, B2–LT15)" />
          <Row k="Metode energi lift" v="ISO 25745-2:2015 (kerangka running + standby)" />
        </Section>

        {/* 9. Catatan */}
        <Card className="animate-fade-in border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/[0.05]">
          <CardContent className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--warning))]">
              Catatan &amp; Keterbatasan
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12px] text-muted-foreground">
              <li>Data pegawai saat ini bersifat <b className="text-foreground">sintetis</b> untuk demo; pipeline siap menerima data tap RFID nyata.</li>
              <li>
                <b className="text-foreground">CO₂ per-sesi = batas atas</b> — mengasumsikan tiap orang naik lift
                sendiri. Angka akan turun bila dikoreksi okupansi (orang/perjalanan).
              </li>
              <li>
                <b className="text-foreground">20 Wh/perjalanan</b> = rata-rata studi ACEEE (lift low-rise). Untuk
                presisi, ganti dengan energi reference-cycle (E_rc) lift PLN Pusat yang diukur.
              </li>
              <li>Semua konstanta terpusat di <span className="tabular">src/lib/config.ts</span> (IMPACT) — mudah disetel.</li>
            </ul>
          </CardContent>
        </Card>

        <footer className="py-6 text-center text-[11px] text-muted-foreground">
          PLN Wellness · Metodologi &amp; Rumus Perhitungan — dokumentasi transparan tiap metrik dashboard.
        </footer>
      </main>
    </div>
  );
}

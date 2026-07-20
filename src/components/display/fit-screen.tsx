"use client";

// Skala kanvas ukuran TETAP (w×h) agar fit UTUH di viewport mana pun (uniform scale).
// Konten di dalam pakai ukuran normal (px/rem) → proporsi selalu konsisten di semua layar.
// Bila rasio layar ≠ kanvas, ada bilah kosong (letterbox) berwarna bg — tak ada distorsi.
import { useEffect, useState } from "react";

export function FitScreen({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calc = () => setScale(Math.min(window.innerWidth / w, window.innerHeight / h));
    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("orientationchange", calc);
    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("orientationchange", calc);
    };
  }, [w, h]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background">
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "center center" }}>
        {children}
      </div>
    </div>
  );
}

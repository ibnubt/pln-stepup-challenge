// Static login sederhana (demo) — kredensial hardcode + cookie flag.
// Untuk produksi, ganti dengan auth backend (mis. NextAuth / SSO PLN).

export const AUTH_COOKIE = "wellness_auth";

/** Kredensial statis (demo). */
export const CREDENTIALS = {
  username: "admin",
  password: "pln2026",
};

const MAX_AGE = 60 * 60 * 8; // 8 jam

export function setAuth() {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${MAX_AGE}; samesite=lax`;
  }
}

export function clearAuth() {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}

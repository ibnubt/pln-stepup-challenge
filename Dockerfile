# ============================================================================
# PLN Wellness — Next.js 14 (standalone) · image kecil, tanpa database
# Build : docker build -t pln-wellness .
# Run   : docker run -d -p 3000:3000 --name pln-wellness pln-wellness
# ============================================================================

# ---- 1. deps: install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
# Hanya package-lock.json yang menentukan cache layer ini. package.json dibuat ulang dari
# lock (tanpa field version), jadi menaikkan nomor versi app TIDAK memicu npm ci ulang
# (deploy jauh lebih cepat). Dependency tetap persis sesuai lock.
COPY package-lock.json ./
RUN node -e "const r=require('./package-lock.json').packages[''];require('fs').writeFileSync('package.json',JSON.stringify({name:r.name,private:true,dependencies:r.dependencies||{},devDependencies:r.devDependencies||{}}))" \
 && npm ci

# ---- 2. builder: build Next.js (output: standalone) ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 3. runner: image produksi minimal ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# user non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# aset statis + server standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ---- 4. worker: sync incremental rpt_trx → taps (dipakai service 'sync') ----
FROM node:20-alpine AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts ./scripts
CMD ["node", "scripts/sync-rpt-trx.mjs"]

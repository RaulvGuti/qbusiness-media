# 1. Dependencias
FROM node:25-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# 2. Builder
FROM node:25-alpine AS builder
WORKDIR /app
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Las variables NEXT_PUBLIC_* se incrustan en el bundle del navegador durante
# el build, no se leen en tiempo de ejecucion. Por eso tienen que estar
# disponibles aqui: definirlas solo en `compose.yml` (runtime) no cambia nada
# del bundle ya compilado.
#
# Son valores PUBLICOS (la URL del proyecto y la clave anon, que esta sujeta a
# RLS), asi que pasarlas como argumento de build no expone ningun secreto.
# Si no llegan, se usan valores de ejemplo: la imagen compila, pero el login
# no funcionara contra Supabase.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# La aplicacion Next.js vive en frontend/
WORKDIR /app/frontend
RUN if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then \
      echo "AVISO: NEXT_PUBLIC_SUPABASE_URL no llego al build." >&2; \
      echo "       La imagen usara un proyecto de ejemplo y el login no funcionara." >&2; \
    fi; \
    NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://dummy.supabase.co}" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-dummy-anon-key}" \
    npm run build

# 3. Runner de Producción
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/frontend/public ./public

# Aprovechar output standalone de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

# ============================================================
# Dockerfile multi-stage pour le frontend Angular SIRH
# Stage 1 : build  (Node 20 + Angular CLI 21)
# Stage 2 : runtime (Nginx 1.27 alpine, SPA fallback, gzip)
# ============================================================

# ---------- STAGE 1 : Build ----------
# Angular 21 exige Node >= 20.19 ou >= 22.12 → on prend la LTS 22
FROM node:22-alpine AS builder

# Métadonnées
LABEL stage=builder

WORKDIR /app

# Argument modifiable au build : --build-arg BUILD_CONFIGURATION=production
ARG BUILD_CONFIGURATION=production

# Copie des manifests AVANT le code source
# → Docker met en cache cette couche tant que package*.json ne change pas
COPY package.json package-lock.json ./

# Installation des dépendances.
# Note : on utilise `npm install` plutôt que `npm ci` car le lockfile est
# souvent généré sur Windows (poste dev) et ne contient pas les deps
# optionnelles Linux (@emnapi/*). En CI Jenkins (agent Linux), un
# `npm ci` serait possible si le lockfile était regenere sur Linux.
RUN npm install --no-audit --no-fund

# Copie du reste du projet (src/, angular.json, tsconfig*.json)
COPY . .

# Build Angular optimisé (output : /app/dist/sirh-frontend/)
RUN npm run build -- --configuration=${BUILD_CONFIGURATION}


# ---------- STAGE 2 : Runtime Nginx ----------
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="SIRH Team"
LABEL service="sirh-frontend"

# Suppression de la config Nginx par défaut + page de test
RUN rm /etc/nginx/conf.d/default.conf \
    && rm -rf /usr/share/nginx/html/*

# Copie de la config Nginx personnalisée (SPA fallback + gzip + cache headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie du build Angular depuis le stage "builder"
COPY --from=builder /app/dist/sirh-frontend/browser /usr/share/nginx/html

# Healthcheck (wget inclus dans alpine, IPv4 explicite car Nginx n'ecoute pas ::1)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1

EXPOSE 80

# Nginx tourne déjà en non-root grâce à l'image officielle (worker = user "nginx")
CMD ["nginx", "-g", "daemon off;"]

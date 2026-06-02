# CLAUDE.md — Contexte projet SIRH

> Ce fichier est lu automatiquement par Claude Code au démarrage de chaque conversation.
> Il contient le contexte du projet, l'état d'avancement de la phase DevOps, et les conventions à respecter.

---

## 🎯 Projet

**SIRH** — Plateforme RH (mémoire de fin d'études).

### Stack applicative

| Couche | Techno | Port |
|---|---|---|
| Frontend | Angular 21.2.7 + keycloak-js 24 | 4200 (dev) / 80 (Docker) |
| API Gateway | Spring Cloud Gateway 2023.0.1 (WebFlux) | 8888 |
| Employee Service | Spring Boot 3.2.5 + JPA + PDFBox + POI | 8081 |
| Recruitment Service | Spring Boot 3.2.5 + JPA + Biweekly + Gemini | 8082 |
| Auth | Keycloak 24.0.0 (realm `aziz`, client `angular-client`) | 8180 |
| DB | PostgreSQL 16 (`sirh_employees`, `sirh_recruitment`) | 5432 |
| Mail (dev) | MailHog | 1025 / 8025 |
| Admin DB | pgAdmin 4 | 5050 |

### Profils Spring disponibles

- `default` : config localhost (lancement en dev sans Docker)
- `dev` : H2 in-memory
- `docker` : **à créer Étape 8** (noms de services Docker)

---

## 🛠️ Phase DevOps — État d'avancement

### Plan global (10 étapes)

#### Phase 1.1 — Analyse & Préparation ✅ TERMINÉE
- [x] **Étape 1** — Étude architecture existante (cartographie 5 couches, URLs en dur identifiées, 5 problèmes bloquants)
- [x] **Étape 2** — Besoins déploiement (matrice 3 envs, ressources, 9 secrets, profils Spring)
- [x] **Étape 3** — Stratégie CI/CD **GitHub Actions** (GitFlow simplifié, 3 workflows réutilisables, matrix sur 3 backends, environments staging/prod avec approval)
- [x] **Étape 4** — Choix outils définitif (GitHub Actions + GHCR + Docker + SonarQube/SonarCloud + Trivy + OWASP DC + Dependabot)

#### Phase 1.2 — Conteneurisation 🟡 EN COURS
- [x] **Étape 5** — Dockerfile Angular ✅ (image **74.8 Mo**, healthy, SPA fallback OK)
- [ ] **Étape 6** — Dockerfile Spring Boot générique (multi-stage + layered JAR + JVM tuning)
- [ ] **Étape 7** — Dockerfile API Gateway
- [ ] **Étape 8** — Docker Compose complet + profils `docker` + `.env.example`
- [ ] **Étape 9** — Optimisation images (tableau avant/après)
- [ ] **Étape 10** — Tests locaux archi conteneurisée

### Modifications déjà appliquées au code

| Fichier | Changement | Pourquoi |
|---|---|---|
| `backend/*/pom.xml` (×3) | +`spring-boot-starter-actuator` +`micrometer-registry-prometheus` | Healthchecks Docker + métriques |
| `backend/*/application.yml` (×3) | +bloc `management.*` (expose health/info/prometheus) | Endpoints actuator activés |
| `backend/*/SecurityConfig.java` (×3) | +`/actuator/health/**`, `/info`, `/prometheus` en `permitAll` | Healthcheck sans 401 |
| `frontend/sirh-frontend/package-lock.json` | Régénéré (était désynchronisé) | `npm install` échouait |
| `frontend/sirh-frontend/angular.json` | Budget CSS 32 → 64 kB | 1 composant CSS overflowait |
| `frontend/sirh-frontend/Dockerfile` | **CRÉÉ** — multi-stage Node 22 → Nginx 1.27 | Étape 5 |
| `frontend/sirh-frontend/nginx.conf` | **CRÉÉ** — SPA fallback + gzip + cache + sécu | Étape 5 |
| `frontend/sirh-frontend/.dockerignore` | **CRÉÉ** | Exclut node_modules/dist du context |

### Choix techniques validés (rappel)

- **CI/CD** : **GitHub Actions** (workflows YAML dans `.github/workflows/`, runners `ubuntu-latest`)
- **Conteneurisation** : Docker + Docker Compose
- **Registry** : **GHCR** (`ghcr.io/<owner>/sirh-*`) — auth via `GITHUB_TOKEN`, pas de serveur à maintenir
- **Qualité** : SonarQube Community 10 (self-hosted) ou SonarCloud (action `SonarSource/sonarqube-scan-action@v3`)
- **Sécurité** : Trivy (`aquasecurity/trivy-action@0.24.0`) + OWASP Dependency-Check (`dependency-check/Dependency-Check_Action@main`) + Dependabot (`.github/dependabot.yml`)
- **Branches** : `main` (prod) + `develop` (staging) + `feature/*` + `hotfix/*`
- **Conventional Commits** : feat/fix/chore/docs/ci/test/refactor
- **Protection** : branch protection rules sur `main` + `develop` (required checks : CI vert + 1 review)

### Architecture pipeline GitHub Actions (Étape 3 refondue)

3 workflows dans `.github/workflows/` :

| Workflow | Déclencheur | Rôle |
|---|---|---|
| `ci.yml` | `pull_request` + `push` sur `develop`/`main` | Lint + tests + build (matrix backends), build Angular, Sonar, OWASP DC. Bloque le merge si rouge. |
| `build-images.yml` | `push` sur `develop`/`main` + tags `v*.*.*` | Build des 4 images Docker (matrix), scan Trivy, push GHCR avec tags `sha-<short>` + `<branch>` + semver. |
| `deploy.yml` | `workflow_dispatch` + `workflow_run` (après `build-images`) | Déploie sur env `staging` (auto) puis `production` (manuel avec approval). |

**Conventions workflows :**
- `actions/checkout@v4`, `actions/setup-java@v4` (Temurin 17), `actions/setup-node@v4` (Node 22)
- Cache Maven via `actions/cache@v4` sur `~/.m2/repository` (clé : `${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}`)
- Cache npm via `actions/setup-node` option `cache: 'npm'`
- Build Docker via `docker/build-push-action@v6` + `docker/metadata-action@v5` pour les tags
- Login GHCR via `docker/login-action@v3` avec `${{ secrets.GITHUB_TOKEN }}` (aucun secret à créer)
- Composite action ou **reusable workflow** (`workflow_call`) pour le job backend mutualisé entre les 3 services Spring
- Permissions explicites par job (principe du moindre privilège) : `contents: read`, `packages: write` uniquement sur le job push

**Secrets GitHub à provisionner** (Settings → Secrets and variables → Actions) :

| Nom | Usage | Scope |
|---|---|---|
| `SONAR_TOKEN` | scan SonarQube/SonarCloud | repo |
| `GEMINI_API_KEY` | runtime recruitment-service (passé au compose deploy) | env `staging`+`prod` |
| `KEYCLOAK_ADMIN_PASSWORD` | bootstrap Keycloak en deploy | env `staging`+`prod` |
| `POSTGRES_PASSWORD` | DB Postgres deploy | env `staging`+`prod` |
| `SSH_HOST` / `SSH_USER` / `SSH_KEY` | déploiement remote (si VM) | env `staging`+`prod` |
| `SMTP_*` | MailHog en dev ; SMTP réel en prod | env `prod` |

> `GITHUB_TOKEN` (auto-provisionné) suffit pour push GHCR — pas besoin de PAT.

**Environments GitHub** (Settings → Environments) :
- `staging` : auto-deploy après build vert sur `develop`
- `production` : required reviewer (= toi) avant deploy, déclenché sur tag `v*.*.*`

### Décisions importantes notées

1. **Node 22 dans le Dockerfile Angular** (pas Node 20) car Angular 21 exige >= 20.19 ou >= 22.12
2. **`npm install`** dans le Dockerfile Angular (pas `npm ci`) car lockfile généré sur Windows ne contient pas les optional deps Linux (`@emnapi/*`). Sur runner GHA `ubuntu-latest`, `npm ci` redevient possible → à valider Étape 6+.
3. **Healthcheck Nginx** utilise `127.0.0.1` explicite (pas `localhost`) car Nginx n'écoute pas IPv6 `::1`
4. **TokenRelay gateway** : client OAuth2 secret pas encore configuré côté gateway → à vérifier Étape 10
5. **Switch Jenkins → GitHub Actions** (2026-06-02) : pas de serveur CI à maintenir, runners gratuits, intégration native PR/checks/environments, GHCR inclus. Étapes 3 + 4 refaites. Tout le reste (Docker, profils Spring, Trivy, Sonar, OWASP DC) reste identique.

### Risques identifiés à traiter plus tard

- `ddl-auto: update` sur les 2 services → passage Flyway recommandé en prod (hors scope PFE)
- `./uploads` relatif dans employee-service → devra être volume Docker monté en `/app/uploads`
- Pas de `.gitignore` racine projet → à créer
- Tag `latest` à éviter en prod, préférer SHA ou semver

---

## 📁 Structure projet (top-level)

```
keycloak/
├── backend/
│   ├── api-gateway/        (Spring Cloud Gateway, port 8888)
│   ├── employee-service/   (Spring Boot, port 8081)
│   └── recruitment-service/(Spring Boot, port 8082)
├── frontend/
│   └── sirh-frontend/      (Angular 21, port 4200)
│       ├── Dockerfile      ✅ créé Étape 5
│       ├── nginx.conf      ✅ créé Étape 5
│       └── .dockerignore   ✅ créé Étape 5
├── keycloak-theme/         (thème custom SIRH)
├── pgadmin/                (servers.json, pgpass)
├── docker-compose.yml      (Postgres + Keycloak + MailHog + pgAdmin uniquement pour l'instant)
├── init-db.sql             (crée sirh_employees + sirh_recruitment)
├── .github/
│   ├── workflows/          (à créer phase CI/CD : ci.yml, build-images.yml, deploy.yml)
│   └── dependabot.yml      (à créer)
└── CLAUDE.md               (ce fichier)
```

---

## 🚀 Reprise de la session

**Prochaine étape : Étape 6 — Dockerfile générique Spring Boot**

Contenu prévu :
- Multi-stage build : `maven:3.9-eclipse-temurin-17` → `eclipse-temurin:17-jre-alpine`
- Spring Boot Layered JAR (4 couches : dependencies, spring-boot-loader, snapshot-deps, application)
- JVM tuning : `-XX:MaxRAMPercentage=75 -XX:+UseG1GC`
- User non-root (`useradd appuser`)
- HEALTHCHECK sur `/actuator/health` (déjà préparé Étape 4.5)
- `.dockerignore` (target/, *.iml)
- À créer : `backend/employee-service/Dockerfile` et `backend/recruitment-service/Dockerfile`

Étape 7 fera le cas spécifique gateway (pas de DB, dépend de tous les downstream).

### Pour reprendre rapidement

```bash
# Vérifier que les builds passent toujours
cd backend/api-gateway && mvn -q compile
cd backend/employee-service && mvn -q compile
cd backend/recruitment-service && mvn -q compile

# Vérifier que l'image Angular se rebuild
cd frontend/sirh-frontend && docker build -t sirh-frontend:test .
```

---

## ⚙️ Conventions

- **Langue** : français pour la doc et les commentaires de livrable
- **Commits** : Conventional Commits (`feat(devops): ...`, `chore(docker): ...`, etc.)
- **Pas de `latest`** sur les tags Docker en production
- **Secrets** : jamais en clair, toujours via GitHub Secrets (par environnement) + `.env` non-commitée en local
- **Healthchecks** : tous les services Docker doivent en avoir un (Spring → `/actuator/health`, Nginx → `127.0.0.1/health`)

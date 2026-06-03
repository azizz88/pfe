# CLAUDE.md — Contexte projet SIRH

> Ce fichier est lu automatiquement par Claude Code au démarrage de chaque conversation.
> Il contient le contexte du projet, l'état d'avancement de la phase DevOps, et les conventions à respecter.

---

## 📅 Dernière session — 2026-06-03

**Travail accompli aujourd'hui** :

| # | Action | Résultat |
|---|---|---|
| 12.f | Workflow permissions → Read and write | ✅ |
| 12.c | Environments staging (libre) + production (approval gate azizz88) | ✅ |
| 12.d | Branch rulesets `protect-main` + `protect-develop` via gh CLI | ✅ bypass actors azizz88 + dependabot configurés |
| 13 | Premier run CI réel — tous les jobs verts sur main + develop | ✅ |
| 14 | Build-images vert — 4 images pushées vers GHCR (privées) | ✅ Fix trivy-action 0.24.0→0.36.0 (PR #23) |
| 15 | Deploy mode démo — staging auto ✅ / production gate ✅ | ✅ Deploy #25 via workflow_dispatch |
| cleanup | Dockerfile.naive supprimé + mysql_data retiré + realm-export.json ajouté | ✅ PR #26 |
| Dependabot | 8 PRs safe mergés (actions GH + lombok + zone.js + poi-ooxml) | ✅ 15 PRs risqués laissés ouverts |
| monitoring | Prometheus v2.53.0 + Grafana v11.0.0 ajoutés à docker-compose.yml | ✅ PR #29 |
| dashboard | Dashboard SIRH 8 panels : JVM, HTTP, CPU, threads, latence p99, HikariCP, status codes | ✅ PR #31 |
| sync | develop synced avec main à chaque étape | ✅ PRs #25, #28, #30, #32 |

**État du pipeline (tous verts)** :
- CI : ✅ main + develop
- Build-images : ✅ main + develop (4 images GHCR)
- Deploy : ✅ staging auto après build develop / production via approval gate

**Stack locale au moment de la fermeture** :
- Arrêtée proprement avec `docker compose stop` (volumes préservés)
- Données Keycloak + Postgres + Grafana + Prometheus intactes dans les volumes

### 🔍 À reprendre en début de prochaine session

```bash
# Relancer la stack complète (10 conteneurs maintenant)
docker compose up -d
docker compose ps   # tous (healthy) attendu

# URLs
http://localhost:4200    # Angular
http://localhost:8888    # API Gateway
http://localhost:8180    # Keycloak admin
http://localhost:9090    # Prometheus (targets: 4 UP)
http://localhost:3000    # Grafana (admin/admin) → dashboard SIRH
http://localhost:8025    # MailHog
http://localhost:5050    # pgAdmin
```

### 📋 Ce qui reste (optionnel avant rendu)

| Tâche | Priorité | Effort |
|---|---|---|
| SonarCloud (12.e) — `SONAR_TOKEN` + `SONAR_ORG` | 🟡 Moyen | ~15 min |
| Status checks dans `protect-main` (4 job names) | 🟡 Moyen | ~5 min |
| Trier les 15 PRs Dependabot risqués (Spring Boot 4, TS 6, PDFBox 3...) | 🔵 Faible | après rendu |
| `docker compose down -v && up -d` sur poste vierge (test realm-export) | 🟡 Moyen | ~30 min |
| README.md + diagramme pipeline | 🔵 Faible | ~2h |

### ⚠️ PRs Dependabot dangereux — NE PAS MERGER avant rendu

| PR | Dépendance | Risque |
|---|---|---|
| #14, #11, #2 | Spring Boot 3.2.5 → 4.0.6 | Breaking major — réécriture partielle |
| #1 | Spring Cloud 2023 → 2025.1.1 | Incompatible avec SB 3.2.x |
| #19 | TypeScript 5 → 6 | Breaking Angular build |
| #5 | PDFBox 2 → 3 | API extraction CV cassée |
| #18 | keycloak-js 24 → 26 | Peut casser flow OIDC |
| #13 | keycloak-admin-client 24 → 26 | Major version |
| #16 | Angular group 11 updates | Trop large, risque |
| #12, #9, #6 | Java 17 → 25 (Dockerfiles runtime) | LTS change |
| #10, #7, #3 | Maven 3.9 → 3-eclipse-26 (build) | Build image change |

### 🛠️ gh CLI installé

```
gh version 2.93.0 — authentifié comme azizz88
Scopes : admin:repo_hook, gist, read:org, repo, workflow
```
Toujours disponible dans les prochaines sessions.

---

## 📅 Dernière session — 2026-06-02

**Travail accompli aujourd'hui** :

| # | Étape | Livrable | Vérifiable par |
|---|---|---|---|
| 0 | Switch Jenkins → GitHub Actions | CLAUDE.md + mémoire mis à jour | section « Architecture pipeline GitHub Actions » |
| 6 | Dockerfiles Spring Boot (employee + recruitment) | `backend/{employee,recruitment}-service/Dockerfile` + `.dockerignore` | `docker images sirh-employee-service:test` → 423 Mo |
| 7 | Dockerfile API Gateway | `backend/api-gateway/Dockerfile` + `.dockerignore` | `docker images sirh-api-gateway:test` → 337 Mo |
| 8 | Docker Compose complet + profil docker | `docker-compose.yml` + `.env.example` + profil `docker` ajouté aux 3 services | `docker compose ps` → 5 (healthy) en ~2 min |
| 9 | Optimisation images + Trivy | Comparatif naïf 1.16 Go vs optimisé 423 Mo (-63 %), CVE HIGH+CRIT -61 % | `Dockerfile.naive` + commandes Trivy reproductibles dans CLAUDE.md |
| 10 | Tests bout-en-bout (T1-T20) | JWT routing OK, CORS OK, cold start 54s, persistance OK | section « Étape 10 » détaillée dans CLAUDE.md |
| 11 | Workflows GitHub Actions + Dependabot | `.github/workflows/{ci,build-images,deploy}.yml` + `.github/dependabot.yml` + branche `develop` poussée | `git log --oneline -3` |

**Commits poussés** (sur main ET develop, fast-forward) :
```
e82892c ci: workflows GitHub Actions + Dependabot (étape 11)
3ed9944 feat(devops): conteneurisation complète (étapes 5-10)
```

### 🔍 À observer/tester en début de prochaine session

1. **Workflows GitHub Actions** (4 runs ont dû se déclencher au push) :
   - URL : https://github.com/azizz88/pfe/actions
   - Sur chaque run, vérifier le statut des jobs (backend matrix ×3, frontend, sonar, build-images matrix ×4)
   - Sonar va warn-skip (token absent), c'est attendu.
   - Build-images peut failer si « Workflow permissions » est en read-only (Settings → Actions → General).

2. **Packages GHCR** (créés au premier `build-images` vert) :
   - URL : https://github.com/azizz88?tab=packages
   - 4 packages attendus : `sirh-frontend`, `sirh-api-gateway`, `sirh-employee-service`, `sirh-recruitment-service`
   - Par défaut **privés** → les passer en public si tu veux les montrer en soutenance.

3. **Stack locale** (déjà UP avec la session d'hier, données persistées dans les volumes) :
   ```bash
   docker compose ps                                              # 5 (healthy) attendu
   curl http://localhost:8888/actuator/health/liveness            # gateway UP
   curl http://localhost:4200/                                    # Angular 200 OK
   curl http://localhost:8025/                                    # MailHog UI
   curl http://localhost:8180/realms/aziz                         # Keycloak realm
   ```

4. **Cleanup éventuel à faire avant le rendu final** :
   - Supprimer `backend/employee-service/Dockerfile.naive` une fois le chapitre Étape 9 rédigé
   - Décider du sort du volume `mysql_data` (commenté inutilisé dans `docker-compose.yml`)
   - Tester un cycle `docker compose down -v && docker compose up -d` (vérifier que tout se reconstruit sans volumes pré-existants — il faudra fournir un `realm-export.json` pour Keycloak)

### 📋 Prochaine étape concrète — **Étape 12** (setup repo GitHub côté UI)

Détaillée dans la section « Prochaine étape : Étape 12 » plus bas. Ordre suggéré :
- 12.f (Workflow permissions write) → débloquer `build-images`
- 12.c (Environments staging + production) → débloquer `deploy.yml`
- 12.d (Branch protection main + develop)
- 12.e + 12.a + 12.b (SonarCloud)
- 12.a (SSH secrets pour deploy réel, optionnel)

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

#### Phase 1.2 — Conteneurisation ✅ TERMINÉE
- [x] **Étape 5** — Dockerfile Angular ✅ (image **74.8 Mo**, healthy, SPA fallback OK)
- [x] **Étape 6** — Dockerfiles Spring Boot ✅ (employee **423 Mo**, recruitment **368 Mo**, healthy en ~60-90s)
- [x] **Étape 7** — Dockerfile API Gateway ✅ (image **337 Mo**, healthy ~60s, `/actuator/health/liveness` = UP)
- [x] **Étape 8** — Docker Compose complet ✅ (profil `docker` ajouté aux 3 services, JWT issuer/jwk split, `.env.example`, `.gitignore` étendu, 8 conteneurs `up`, 5 `(healthy)`, full stack démarre en ~2 min)
- [x] **Étape 9** — Optimisation images ✅ (naive 1.16 Go → optimisé 423 Mo = **-63 %**, HIGH+CRIT 75 → 29 = **-61 %**, Trivy scan sur 4 images)
- [x] **Étape 10** — Tests locaux archi conteneurisée ✅ (20 tests T1-T20 : JWT flow gateway→backend OK, CORS OK, cross-service OK, **cold start 54s**, persistance Keycloak+Postgres intacte après `down/up`, 0 WARN bloquant)

#### Phase 2 — CI/CD GitHub Actions 🟡 EN COURS
- [x] **Étape 11** — Workflows + Dependabot écrits ✅ (`.github/workflows/ci.yml`, `build-images.yml`, `deploy.yml`, `.github/dependabot.yml`, branche `develop` créée + poussée)
- [ ] **Étape 12** — Setup repo GitHub (secrets, GitHub Environments, branch protection rules, SonarCloud)
- [ ] **Étape 13** — Premier run CI réel + ajustements (push + monitoring)
- [ ] **Étape 14** — Premier build & push image vers GHCR + Trivy
- [ ] **Étape 15** — Test deploy en mode démo (gracieux sans serveur cible)

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
| `backend/employee-service/Dockerfile` | **CRÉÉ** — multi-stage Maven → JRE alpine + PDFBox fonts + uploads/ | Étape 6 |
| `backend/employee-service/.dockerignore` | **CRÉÉ** | Exclut target/, .idea/, uploads/ |
| `backend/recruitment-service/Dockerfile` | **CRÉÉ** — multi-stage Maven → JRE alpine (pas de native deps) | Étape 6 |
| `backend/recruitment-service/.dockerignore` | **CRÉÉ** | Exclut target/, .idea/ |
| `backend/api-gateway/Dockerfile` | **CRÉÉ** — multi-stage Maven → JRE alpine, port 8888, WebFlux/Netty | Étape 7 |
| `backend/api-gateway/.dockerignore` | **CRÉÉ** | Exclut target/, .idea/ |
| `backend/*/application.yml` (×3) | +bloc profil `docker` (Postgres/Keycloak/Mail en noms de services + JWT split iss/jwks) | Étape 8 |
| `backend/api-gateway/.../application.yml` | Routes URI refactorées en `${EMPLOYEE_SERVICE_URL:default}` + `${RECRUITMENT_SERVICE_URL:default}` | Étape 8 |
| `docker-compose.yml` | Étendu : +4 apps (gateway, employee, recruitment, frontend), réseau `sirh-net`, depends_on conditionnels, volume `employee_uploads` | Étape 8 |
| `.env.example` | **CRÉÉ** racine projet (POSTGRES_*, KEYCLOAK_ADMIN_*, JWT_*, EMPLOYEE_SERVICE_URL, RECRUITMENT_SERVICE_URL, GEMINI_API_KEY) | Étape 8 |
| `.gitignore` | +`.env`, `**/uploads/`, `backend/employee-service/uploads/` | Étape 8 |

### Choix techniques validés (rappel)

- **CI/CD** : **GitHub Actions** (workflows YAML dans `.github/workflows/`, runners `ubuntu-latest`)
- **Conteneurisation** : Docker + Docker Compose
- **Registry** : **GHCR** (`ghcr.io/<owner>/sirh-*`) — auth via `GITHUB_TOKEN`, pas de serveur à maintenir
- **Qualité** : SonarQube Community 10 (self-hosted) ou SonarCloud (action `SonarSource/sonarqube-scan-action@v3`)
- **Sécurité** : Trivy (`aquasecurity/trivy-action@0.24.0`) + OWASP Dependency-Check (`dependency-check/Dependency-Check_Action@main`) + Dependabot (`.github/dependabot.yml`)
- **Branches** : `main` (prod) + `develop` (staging) + `feature/*` + `hotfix/*`
- **Conventional Commits** : feat/fix/chore/docs/ci/test/refactor
- **Protection** : branch protection rules sur `main` + `develop` (required checks : CI vert + 1 review)

### Étape 9 — Optimisation & sécurité des images Docker

**Comparatif naïf vs optimisé** (mesuré sur `employee-service`, le service le plus chargé en dépendances) :

| Caractéristique | Image naïve | Image optimisée | Gain |
|---|---|---|---|
| Taille | **1.16 Go** | **423 Mo** | **-63 %** |
| CVE HIGH+CRITICAL | **75** | **29** | **-61 %** |
| Stages Docker | 1 (Maven runtime) | 3 (build → extract → runtime) | — |
| Base runtime | `maven:3.9-eclipse-temurin-17` (JDK + Maven + Debian) | `eclipse-temurin:17-jre-alpine` (JRE seul) | — |
| User | root | `app` (non-root, UID/GID dédiés) | — |
| Format JAR | fat-jar (`mvn package`) | layered JAR (`-Djarmode=layertools extract`) | cache friendly |
| HEALTHCHECK | absent | `/actuator/health/liveness` | observable |

> Le Dockerfile naïf est conservé en `backend/employee-service/Dockerfile.naive` à des fins de comparaison pour le livrable PFE. À supprimer une fois le chapitre rédigé.

**Récap des 4 images finales** (Trivy scan, base de données du 2026-06-02) :

| Image | Taille | HIGH+CRITICAL | Total CVE |
|---|---|---|---|
| `sirh-frontend:local` | **74.8 Mo** | 32 | 91 |
| `sirh-api-gateway:local` | **337 Mo** | 21 | 56 |
| `sirh-employee-service:local` | **423 Mo** | 29 | 67 |
| `sirh-recruitment-service:local` | **368 Mo** | 28 | 58 |

> Les CVE résiduels viennent essentiellement des images de base (`musl`, `openssl`, `libxml2`, `zlib`, `nghttp2` sur alpine ; `tomcat-embed-core` côté Spring Boot 3.2.5). La mitigation se fait en upgradant les bases (`alpine 3.20 → 3.21`, Spring Boot 3.2.5 → 3.3.x). À traiter en CI via Dependabot et un job Trivy avec exit code != 0 sur HIGH+CRIT.

**Techniques d'optimisation appliquées** :
1. **Multi-stage** : compile dans une image lourde (Maven + JDK), copie le résultat dans une image légère (JRE seul). Gain principal sur la taille.
2. **Layered JAR** : Spring Boot extrait le jar en 4 couches (deps, loader, snapshot-deps, application). Au rebuild, seule la couche `application` change → push registry beaucoup plus rapide.
3. **JRE alpine** : `eclipse-temurin:17-jre-alpine` (≈180 Mo) vs `:17-jdk-alpine` (≈340 Mo) vs `:17-jre-jammy` (Debian, ≈260 Mo). Alpine moins lourd mais musl libc → ajouter `fontconfig`/`ttf-dejavu` pour PDFBox (cf. décision 7).
4. **User non-root** : `addgroup -S app && adduser -S app` → conformité OWASP top 10 (A05:2021 – Security Misconfiguration).
5. **Tini PID 1** : reaper de signaux pour stopper proprement la JVM sur SIGTERM.
6. **Cache Maven persistant** : `RUN --mount=type=cache,target=/root/.m2` (BuildKit) → rebuild d'une feature = 15-20 s au lieu de 3-4 min.
7. **HEALTHCHECK liveness** : pointer sur `/actuator/health/liveness` (état JVM) et non `/actuator/health` (état JVM + dépendances) → indépendance container.
8. **`.dockerignore`** : exclut `target/`, `.idea/`, `uploads/`, `.git/` → réduit le context envoyé au daemon de plusieurs centaines de Mo.

**Commande de scan reproductible** :

```bash
docker pull aquasec/trivy:latest
MSYS_NO_PATHCONV=1 docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image \
  --severity HIGH,CRITICAL --format table \
  --scanners vuln \
  sirh-employee-service:local
```

### Étape 10 — Tests bout-en-bout de l'architecture conteneurisée

**Suite automatisée exécutée le 2026-06-02 — 20 tests** :

| # | Test | Méthode | Résultat |
|---|---|---|---|
| T1 | Token admin Keycloak (master / admin-cli) | direct grant | ✅ token 973 chars |
| T2-T3 | Realm `aziz` + client `angular-client` | admin API | ✅ publicClient + directAccessGrants + standardFlow + redirectUris `localhost:4200/*` |
| T4 | Users existants dans realm `aziz` | admin API | ✅ 10 users |
| T5 | Création user temporaire `e2e-test` | admin POST | ✅ HTTP 201 |
| T6 | Direct-grant token pour `e2e-test` via `angular-client` | OIDC token endpoint | ✅ JWT 1413 chars |
| T7 | `GET /api/skills` via gateway **sans** token | curl | ✅ HTTP 401 (gateway protège la route) |
| T8 | `GET /api/skills` via gateway **avec** JWT | curl | ✅ HTTP 403 ≠ 401 → **prouve que le JWT est validé et le bearer forwardé au backend, qui rejette par rôle** |
| T9 | Préflight CORS `Origin: http://localhost:4200` | OPTIONS | ✅ HTTP 200 + ACAO + ACAM corrects |
| T10 | API MailHog `/api/v2/messages` | curl | ✅ accessible, 0 messages |
| T11 | Décodage payload JWT (iss/aud/azp) | base64 | ✅ `iss=http://localhost:8180/realms/aziz` (matche le iss attendu côté backend) |
| T12 | Routage cross-service `/api/matching/*` via gateway | curl + JWT | ✅ HTTP 404 (endpoint inexistant) → routage atteint bien recruitment-service |
| T13 | `/actuator/health/readiness` depuis l'intérieur du réseau Docker | `docker compose exec` | ✅ employee + recruitment = UP |
| T14 | Logs WARN/ERROR récents (300 dernières lignes par service) | `docker compose logs` | ✅ 2 WARN bruit Hibernate/Spring (deprecation `hibernate.dialect`, `open-in-view`), 0 ERROR |
| T15 | Cleanup user `e2e-test` | admin DELETE | ✅ HTTP 204 |
| T16 | `docker compose down` (volumes préservés) | — | ✅ 5s |
| T17-T18 | Cold start `docker compose up -d` jusqu'à 5 services `(healthy)` | timer | ✅ **54 s** |
| T19 | Persistance Keycloak (realm + users après down/up) | admin API | ✅ realm `aziz` + 10 users intacts |
| T20 | Persistance Postgres (tables après down/up) | `psql` | ✅ 7 tables dans `sirh_employees` |

**Tests manuels à compléter par la suite** (non automatisables sans navigateur) :

- [ ] Login complet via Angular sur `http://localhost:4200` → redirection Keycloak → retour avec session → requête authentifiée routée à travers la gateway
- [ ] Création d'un employé via l'UI RH → vérifier que MailHog (`http://localhost:8025`) capture l'email d'activation
- [ ] Upload d'un CV PDF → vérifier que PDFBox extrait les skills (fontconfig + ttf-dejavu validés sur alpine)
- [ ] Génération de fichier `.ics` (convocation entretien) → vérifier l'attachement dans MailHog
- [ ] Stop puis re-démarrage de la stack après une session avec données utilisateurs → toutes les données métier doivent survivre (`uploads/`, employés créés, candidatures, etc.)

**À faire avant le rendu final** :
- Supprimer `backend/employee-service/Dockerfile.naive` (gardé pour la rédaction du chapitre Étape 9)
- Décider du sort du volume `mysql_data` dans `docker-compose.yml` (commenté "rollback éventuel", inutilisé)
- `docker compose down -v` puis `docker compose up -d` sur poste vierge → confirmer que tout se reconstruit sans données pré-existantes (i.e. fournir un `realm-export.json` ou documenter la création manuelle du realm)

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
6. **HEALTHCHECK Spring → `/actuator/health/liveness`** (pas `/actuator/health`) car en isolation le composant `mail` peut être DOWN et faire passer le container en `unhealthy` même si la JVM est saine. Liveness ne dépend que de la JVM.
7. **PDFBox sur alpine** : `apk add fontconfig ttf-dejavu` requis sinon `Fontconfig head is null` à la première manipulation PDF (extraction CV).
8. **Layered JAR** : Spring Boot 3.2.5 active le mode layered par défaut. Extraction via `java -Djarmode=layertools -jar app.jar extract` (jarmode `tools` introduit en 3.3+, on garde `layertools` pour 3.2.5). Lancement runtime via `org.springframework.boot.loader.launch.JarLauncher` (package `loader.launch` introduit en 3.2).
9. **JWT issuer/jwk-set split** (Étape 8) : en Docker, `issuer-uri` reste `http://localhost:8180/realms/aziz` (= ce que le navigateur voit, donc le `iss` du JWT), mais `jwk-set-uri` pointe explicitement sur `http://keycloak:8080/realms/aziz/protocol/openid-connect/certs` (= chemin interne réseau Docker). Spring valide l'`iss` par comparaison de string ET télécharge les clés de signature séparément → pas besoin de toucher au fichier hosts du poste pour aligner les noms.
10. **Pas de healthcheck Keycloak** : l'image `quay.io/keycloak/keycloak:24.0.0` est basée sur UBI Micro et n'embarque ni `curl`/`wget`/`bash` ni l'endpoint `/health` par défaut en `start-dev`. On utilise `depends_on: keycloak: service_started` (les backends lazy-fetchent la JWKS à la première requête JWT, donc pas de coupling startup-time).

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
│   ├── workflows/
│   │   ├── ci.yml              ✅ Étape 11 (lint + tests + build + Sonar)
│   │   ├── build-images.yml    ✅ Étape 11 (Docker + Trivy + push GHCR)
│   │   └── deploy.yml          ✅ Étape 11 (staging auto + prod manuel, mode démo)
│   └── dependabot.yml          ✅ Étape 11 (Maven ×3 + npm + actions + docker, hebdo)
└── CLAUDE.md               (ce fichier)
```

---

## 🚀 Reprise de la session

**Stack complète opérationnelle** — `docker compose up -d` démarre 8 conteneurs en ~2 min, 5 d'entre eux reportent `(healthy)` :

| Service | Image | Port | Healthcheck |
|---|---|---|---|
| `frontend` | `sirh-frontend:local` (74.8 Mo) | 4200 | `/health` (Nginx) |
| `api-gateway` | `sirh-api-gateway:local` (337 Mo) | 8888 | `/actuator/health/liveness` |
| `employee-service` | `sirh-employee-service:local` (423 Mo) | 8081 | `/actuator/health/liveness` |
| `recruitment-service` | `sirh-recruitment-service:local` (368 Mo) | 8082 | `/actuator/health/liveness` |
| `postgres` | `postgres:16-alpine` | 5432 | `pg_isready` |
| `keycloak` | `quay.io/keycloak/keycloak:24.0.0` | 8180 | (pas de HC — image minimale) |
| `mailhog` | `mailhog/mailhog:latest` | 1025 / 8025 | — |
| `pgadmin` | `dpage/pgadmin4:latest` | 5050 | — |

**Prochaine étape : Étape 12 — Setup repo GitHub**

Les fichiers sont là (Étape 11), il reste à provisionner GitHub côté UI/CLI :

### 12.a — Créer les **GitHub Secrets** (Settings → Secrets and variables → Actions)

| Niveau | Nom | Quand | Comment générer |
|---|---|---|---|
| Repo | `SONAR_TOKEN` | dès qu'on veut activer Sonar | SonarCloud → Account → Security → Generate Tokens |
| Env `staging` | `STAGING_SSH_HOST` | quand une VM staging existe | DNS ou IP publique |
| Env `staging` | `STAGING_SSH_USER` | idem | utilisateur Unix sur la VM |
| Env `staging` | `STAGING_SSH_KEY` | idem | `ssh-keygen -t ed25519`, coller la clé **privée** |
| Env `production` | `PROD_SSH_HOST` / `_USER` / `_KEY` | quand une VM prod existe | idem |

> Pour un PFE, on peut laisser les SSH_* vides : `deploy.yml` exit 0 avec un warning, suffisant pour démontrer la structure du pipeline.

### 12.b — Créer les **GitHub Variables** (idem menu, onglet « Variables »)

| Nom | Valeur | Usage |
|---|---|---|
| `SONAR_ORG` | ex. `azizz88` | utilisé par `ci.yml` job `sonar` pour construire la projectKey |

### 12.c — Créer les **Environments** (Settings → Environments)

1. `staging` — pas de protection
2. `production` — required reviewers : **toi** (azizz88) → garantit l'approval gate manuel

### 12.d — **Branch protection rules** (Settings → Branches)

Pour `main` :
- ✅ Require pull request before merging (1 review approval recommandé)
- ✅ Require status checks to pass : `backend (api-gateway)`, `backend (employee-service)`, `backend (recruitment-service)`, `frontend (Angular 21)`
- ✅ Require branches to be up to date

Idem pour `develop`, plus light (require PR mais pas de review obligatoire).

### 12.e — **SonarCloud** (sonarcloud.io)

1. Login GitHub → autoriser l'org `azizz88`
2. Import du repo `azizz88/pfe`
3. Choisir **GitHub Actions** comme méthode d'analyse
4. Récupérer le token → l'ajouter en `SONAR_TOKEN` (cf. 12.a)
5. La variable `SONAR_ORG` doit valoir l'organisation Sonar (souvent = username GitHub si solo)

### 12.f — Permettre à GHCR de pousser depuis le repo

1. Settings → Actions → General → Workflow permissions → cocher **Read and write permissions**  
   *(ou laisser Read-only et accorder explicitement `packages: write` au job — déjà fait dans `build-images.yml`)*
2. Au premier push, le package GHCR sera créé automatiquement comme **privé** ; le rendre public si tu veux le démontrer en soutenance : Profile → Packages → `sirh-*` → Package settings → Change visibility

### Pour reprendre rapidement

```bash
# Smoke complet
docker compose down              # arrêter
docker compose up -d --build     # rebuild + lancer
docker compose ps                # toutes les apps doivent être "(healthy)"

# Endpoints exposés
curl http://localhost:4200/                                    # Angular
curl http://localhost:8888/actuator/health/liveness            # Gateway
curl http://localhost:8081/actuator/health/liveness            # Employee
curl http://localhost:8082/actuator/health/liveness            # Recruitment
curl http://localhost:8180/realms/aziz                         # Keycloak realm
http://localhost:8025                                          # MailHog UI
http://localhost:5050                                          # pgAdmin
```

### Limitations connues (à valider Étape 10)

- **CORS gateway** : `SecurityConfig.java` autorise uniquement `http://localhost:4200`. En Docker le frontend est bien sur `localhost:4200` donc OK pour la démo locale ; en cloud il faudra paramétrer.
- **TokenRelay** : pas de config OAuth2 client (`registration.*`) dans `application.yml` du gateway. En Spring Cloud Gateway 2023.0.1, le filter `TokenRelay=` peut s'appuyer sur le `JwtAuthenticationToken` du Resource Server, mais le comportement réel sera à valider par un appel authentifié end-to-end Étape 10.
- **Keycloak realm `aziz`** : pas d'import automatique. Si on part d'un volume vide, il faudra recréer le realm via l'UI admin ou fournir un fichier `realm-export.json` monté en `/opt/keycloak/data/import/` + `start-dev --import-realm`. Tracker pour Étape 10.

---

## ⚙️ Conventions

- **Langue** : français pour la doc et les commentaires de livrable
- **Commits** : Conventional Commits (`feat(devops): ...`, `chore(docker): ...`, etc.)
- **Pas de `latest`** sur les tags Docker en production
- **Secrets** : jamais en clair, toujours via GitHub Secrets (par environnement) + `.env` non-commitée en local
- **Healthchecks** : tous les services Docker doivent en avoir un (Spring → `/actuator/health`, Nginx → `127.0.0.1/health`)

#!/usr/bin/env bash
# =============================================================================
# Script de configuration automatique Keycloak pour le projet SIRH
# -----------------------------------------------------------------------------
# Ce script effectue TOUTE la configuration Keycloak necessaire au flux
# "mot de passe oublie" :
#   1. Configure le serveur SMTP du realm pour pointer vers Mailhog
#   2. Active "resetPasswordAllowed" + applique le theme sirh-theme
#   3. Cree un client Keycloak "sirh-backend-admin" avec service account
#   4. Assigne les roles manage-users + view-users a ce service account
#   5. Recupere le client secret et l'affiche / l'injecte
#
# PREREQUIS avant de lancer ce script :
#   - Docker est lance :  docker-compose up -d
#   - Keycloak est accessible sur http://localhost:8180
#   - Le realm "aziz" existe deja dans Keycloak (cree manuellement ou importe)
#   - curl + node sont installes (bash sous Windows = Git Bash)
#
# USAGE :
#   bash scripts/keycloak-setup.sh
#
# Options par variables d'env (optionnelles) :
#   KC_URL       (defaut: http://localhost:8180)
#   KC_REALM     (defaut: aziz)
#   KC_ADMIN     (defaut: admin)
#   KC_ADMIN_PWD (defaut: admin)
# =============================================================================
set -e

KC_URL="${KC_URL:-http://localhost:8180}"
KC_REALM="${KC_REALM:-aziz}"
KC_ADMIN="${KC_ADMIN:-admin}"
KC_ADMIN_PWD="${KC_ADMIN_PWD:-admin}"
CLIENT_ID_TO_CREATE="sirh-backend-admin"

# --- Helper pour extraire des champs JSON via node (pas besoin de jq) ---
jsonget() {
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{process.stdout.write(String(eval('JSON.parse(d)$1')))})"
}

echo "================================================================"
echo " Keycloak setup — realm: $KC_REALM  |  server: $KC_URL"
echo "================================================================"

# --- Verifier que Keycloak est joignable ---
if ! curl -s -o /dev/null -w "%{http_code}" "$KC_URL" | grep -q "200\|302\|303"; then
  echo "ERREUR : Keycloak n'est pas joignable sur $KC_URL"
  echo "Lancez d'abord :  docker-compose up -d"
  exit 1
fi

# --- 1. Obtenir un token admin ---
echo ""
echo "[1/6] Obtention du token admin..."
TOKEN=$(curl -s -X POST "$KC_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=admin-cli&username=$KC_ADMIN&password=$KC_ADMIN_PWD" \
  | jsonget ".access_token")

if [ -z "$TOKEN" ] || [ "$TOKEN" = "undefined" ]; then
  echo "ERREUR : impossible d'obtenir un token admin. Verifiez KC_ADMIN / KC_ADMIN_PWD."
  exit 1
fi
AUTH="Authorization: Bearer $TOKEN"
echo "   OK"

# --- 2. Verifier que le realm existe ---
echo ""
echo "[2/6] Verification du realm '$KC_REALM'..."
REALM_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$KC_URL/admin/realms/$KC_REALM")
if [ "$REALM_CODE" != "200" ]; then
  echo "ERREUR : le realm '$KC_REALM' n'existe pas (HTTP $REALM_CODE)."
  echo "Creez-le d'abord dans la console admin, ou importez un realm-export.json."
  exit 1
fi
echo "   OK"

# --- 3. Configurer SMTP + resetPasswordAllowed + theme ---
echo ""
echo "[3/6] Configuration SMTP (Mailhog) + reset password + theme..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$KC_URL/admin/realms/$KC_REALM" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "resetPasswordAllowed": true,
    "loginTheme": "sirh-theme",
    "emailTheme": "sirh-theme",
    "internationalizationEnabled": true,
    "supportedLocales": ["fr", "en"],
    "defaultLocale": "fr",
    "smtpServer": {
      "host": "mailhog",
      "port": "1025",
      "from": "noreply@sirh.local",
      "fromDisplayName": "SIRH",
      "auth": "false",
      "ssl": "false",
      "starttls": "false",
      "replyTo": "noreply@sirh.local"
    }
  }')
if [ "$HTTP" = "204" ]; then echo "   OK (HTTP 204)"; else echo "   WARN HTTP $HTTP"; fi

# --- 4. Creer le client sirh-backend-admin (si absent) ---
echo ""
echo "[4/6] Client '$CLIENT_ID_TO_CREATE'..."
EXISTING=$(curl -s -H "$AUTH" "$KC_URL/admin/realms/$KC_REALM/clients?clientId=$CLIENT_ID_TO_CREATE" | jsonget ".length")
if [ "$EXISTING" = "0" ]; then
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$KC_URL/admin/realms/$KC_REALM/clients" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"$CLIENT_ID_TO_CREATE\",
      \"enabled\": true,
      \"protocol\": \"openid-connect\",
      \"publicClient\": false,
      \"serviceAccountsEnabled\": true,
      \"standardFlowEnabled\": false,
      \"directAccessGrantsEnabled\": false,
      \"clientAuthenticatorType\": \"client-secret\"
    }")
  echo "   Cree (HTTP $HTTP)"
else
  echo "   Deja present, on continue."
fi

# --- 5. Assigner les roles manage-users + view-users au service account ---
echo ""
echo "[5/6] Assignation des roles au service account..."
CLIENT_UUID=$(curl -s -H "$AUTH" "$KC_URL/admin/realms/$KC_REALM/clients?clientId=$CLIENT_ID_TO_CREATE" | jsonget "[0].id")
SA_USER_ID=$(curl -s -H "$AUTH" "$KC_URL/admin/realms/$KC_REALM/clients/$CLIENT_UUID/service-account-user" | jsonget ".id")
RM_CLIENT_UUID=$(curl -s -H "$AUTH" "$KC_URL/admin/realms/$KC_REALM/clients?clientId=realm-management" | jsonget "[0].id")
ROLES_JSON=$(curl -s -H "$AUTH" "$KC_URL/admin/realms/$KC_REALM/clients/$RM_CLIENT_UUID/roles")
TARGET_ROLES=$(echo "$ROLES_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const a=JSON.parse(d);const w=['manage-users','view-users'];process.stdout.write(JSON.stringify(a.filter(r=>w.includes(r.name))))})")
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$KC_URL/admin/realms/$KC_REALM/users/$SA_USER_ID/role-mappings/clients/$RM_CLIENT_UUID" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "$TARGET_ROLES")
echo "   OK (HTTP $HTTP)"

# --- 6. Recuperer le client secret ---
echo ""
echo "[6/6] Recuperation du client secret..."
SECRET=$(curl -s -H "$AUTH" "$KC_URL/admin/realms/$KC_REALM/clients/$CLIENT_UUID/client-secret" | jsonget ".value")

echo ""
echo "================================================================"
echo " SETUP TERMINE"
echo "================================================================"
echo ""
echo "Client secret (a copier dans employee-service/src/main/resources/application.yml,"
echo "champ keycloak.admin.client-secret) :"
echo ""
echo "   $SECRET"
echo ""
echo "Ou le passer en variable d'env au lancement :"
echo "   KEYCLOAK_ADMIN_CLIENT_SECRET=$SECRET  mvn spring-boot:run"
echo ""
echo "Verification :"
echo "   Mailhog UI    : http://localhost:8025"
echo "   Keycloak UI   : http://localhost:8180/admin  (admin/admin)"
echo ""

# Flux d'Activation par Email - Documentation

## Vue d'ensemble

Le système SIRH a été mis à jour pour implémenter un flux d'activation par email lors de la création d'employés. Au lieu de provisionner entièrement le compte avec un mot de passe temporaire, l'HR admin crée maintenant l'employé avec son email, et l'employé reçoit un email d'activation contenant un lien pour définir son propre mot de passe.

## Architecture

### 1. Flux utilisateur

```
HR Admin crée employé
      ↓
Backend crée utilisateur Keycloak SANS mot de passe
      ↓
Utilisateur Keycloak est créé avec emailVerified=false
      ↓
Backend envoie executeActionsEmail avec l'action UPDATE_PASSWORD
      ↓
Keycloak envoie email via Mailhog (développement) ou SMTP réel (production)
      ↓
Employé clique sur le lien dans l'email
      ↓
Employé est redirigé vers l'app Angular pour définir son mot de passe
      ↓
Une fois le mot de passe défini, l'employé peut se connecter
```

### 2. Composants modifiés

#### A. EmployeeCreateRequest (DTO)
**Fichier:** `backend/employee-service/src/main/java/com/aziz/employeeservice/dto/EmployeeCreateRequest.java`

Modifications:
- Suppression de `temporaryPassword` (qui était toujours défini)
- Ajout de `sendActivationEmail` (boolean, par défaut `true`)

```java
private boolean sendActivationEmail = true;
```

#### B. KeycloakUserService
**Fichier:** `backend/employee-service/src/main/java/com/aziz/employeeservice/services/KeycloakUserService.java`

Modifications:
1. **createKeycloakUser() - Signature changée**
   - Avant: `createKeycloakUser(firstName, lastName, email, role, password)`
   - Après: `createKeycloakUser(firstName, lastName, email, role)`
   - Le mot de passe n'est plus accepté (ni défini)
   - `emailVerified` est défini à `false` (sera `true` une fois l'email activé)

2. **Nouvelle méthode: sendActivationEmail()**
   ```java
   public void sendActivationEmail(String username)
   ```
   - Envoie un email d'activation via `executeActionsEmail()`
   - Utilise la configuration `keycloak.activation.client-id` et `keycloak.activation.redirect-uri`
   - Action Keycloak: `UPDATE_PASSWORD` (force l'utilisateur à définir un mot de passe)

3. **Méthode dépréciée: createKeycloakUserWithPassword()**
   - Conservée pour compatibilité descendante
   - Implémenter l'ancien flux avec mot de passe temporaire si nécessaire

#### C. PasswordResetService
**Fichier:** `backend/employee-service/src/main/java/com/aziz/employeeservice/auth/PasswordResetService.java`

Modifications:
- Ajout de la méthode `sendActivationEmail(keycloakUsername, email)`
- Réutilise la même logique que `requestReset()` mais via le service
- Peut être utilisée par d'autres services si nécessaire

#### D. EmployeeService
**Fichier:** `backend/employee-service/src/main/java/com/aziz/employeeservice/services/EmployeeService.java`

Modifications:
1. Injection du `KeycloakUserService` (déjà présent)
2. Dans `createEmployee()`:
   - Crée l'utilisateur Keycloak SANS mot de passe
   - Persiste l'employé en base
   - Envoie l'email d'activation si `request.isSendActivationEmail() == true`
   - Gère les exceptions silencieusement (l'employé est créé même si l'email échoue)

#### E. Configuration application.yml
**Fichier:** `backend/employee-service/src/main/resources/application.yml`

Additions:
```yaml
keycloak:
  activation:
    client-id: angular-client
    redirect-uri: http://localhost:4200
```

## Flux technique complet

### 1. Création d'employé (HR Admin)

**Endpoint:** `POST /api/employees`

**Payload:**
```json
{
  "matricule": "EMP-001",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@company.com",
  "phone": "+33123456789",
  "position": "Developer",
  "hireDate": "2026-05-10",
  "keycloakRole": "EMPLOYEE",
  "sendActivationEmail": true,
  "department": {...},
  "service": {...},
  "contract": {...}
}
```

### 2. Backend - EmployeeService.createEmployee()

1. Appelle `keycloakUserService.createKeycloakUser()`
   - Génère username: "jean.dupont"
   - Crée utilisateur Keycloak avec:
     - `enabled = true`
     - `emailVerified = false`
     - `credentials = []` (aucun mot de passe)
   - Assigne le rôle "EMPLOYEE"

2. Persiste l'Employee en base de données

3. Si `sendActivationEmail == true`:
   - Appelle `keycloakUserService.sendActivationEmail(username)`
   - Capture les exceptions (ne bloque pas la création)

### 3. Keycloak - Email d'activation

`keycloakUserService.sendActivationEmail()` appelle:
```java
userResource.executeActionsEmail(
    activationClientId,      // "angular-client"
    activationRedirectUri,   // "http://localhost:4200"
    List.of("UPDATE_PASSWORD")
)
```

Keycloak génère un lien comme:
```
http://localhost:8180/realms/aziz/login-actions/action-token?key=eyJ...&client_id=angular-client&...
```

### 4. Email envoyé à l'employé

**Template:** `keycloak-theme/sirh-theme/email/html/executeActions.ftl`

Contenu (français, avec branding SIRH):
- Titre: "Réinitialisation de votre mot de passe"
- Message: "Un compte a été créé pour vous..."
- CTA Button: "Réinitialiser mon mot de passe" (lien Keycloak)
- Délai d'expiration: ~12 heures (configurable dans Keycloak)

### 5. Employé clique sur le lien

Keycloak redirige vers:
```
http://localhost:4200/auth/update-password?code=...
```

L'appli Angular gère cette route et affiche un formulaire de mot de passe.

### 6. Employé définit son mot de passe

L'Angular frontend:
1. Récupère le `code` du query param
2. Envoie à Keycloak: `POST /realms/aziz/login-actions/action-token`
   - Inclut le code + le nouveau mot de passe
3. Keycloak valide le code, set le password, marque `emailVerified = true`
4. Redirige vers la page de connexion
5. Employé peut maintenant se connecter

## Configuration nécessaire

### 1. Keycloak - Realm setup

**Script:** `scripts/keycloak-setup.sh`

Le script configure automatiquement:
- SMTP (Mailhog en dev)
- Theme email à "sirh-theme"
- Client "sirh-backend-admin" avec permissions manage-users
- `resetPasswordAllowed = true`

Lancer:
```bash
bash scripts/keycloak-setup.sh
```

### 2. Backend - Variables d'environnement

```bash
export KEYCLOAK_ADMIN_CLIENT_SECRET="<secret_du_client_sirh-backend-admin>"
```

Ou dans `application.yml` (hardcoded pour dev):
```yaml
keycloak:
  admin:
    client-secret: ${KEYCLOAK_ADMIN_CLIENT_SECRET:defaultSecret}
  activation:
    client-id: angular-client
    redirect-uri: http://localhost:4200
```

### 3. Frontend - Route d'activation

**Fichier:** `frontend/sirh-frontend/src/app/app.routes.ts`

Route publique (pas d'authentification):
```typescript
{
  path: 'auth/update-password',
  component: UpdatePasswordComponent
}
```

Ou réutilise une route existante si elle existe déjà.

## Cas d'usage spéciaux

### 1. Renvoyer un email d'activation

Si l'employé n'a pas reçu l'email ou le lien a expiré, l'HR admin peut:
- Utiliser le endpoint `/api/auth/forgot-password` existant
- Ou créer un endpoint `POST /api/employees/{id}/resend-activation-email`

### 2. Créer un employé SANS email d'activation

Envoyer dans la requête:
```json
{
  "sendActivationEmail": false
}
```

Le backend ne tentera pas d'envoyer d'email. Utile pour:
- Tests
- Création manuelle de mots de passe par l'admin
- Migration depuis ancien système

### 3. Fallback: Ancien flux avec mot de passe

Utiliser la méthode dépréciée `createKeycloakUserWithPassword()` si nécessaire:
```java
String username = keycloakUserService.createKeycloakUserWithPassword(
    firstName, lastName, email, role, "TempPassword123!"
);
```

## Tests

### Test manuel - Développement

1. Lancer les services:
   ```bash
   docker-compose up -d
   bash scripts/keycloak-setup.sh
   mvn spring-boot:run -f backend/employee-service
   ```

2. Créer un employé via le frontend ou cURL:
   ```bash
   curl -X POST http://localhost:8888/api/employees \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "matricule": "TEST-001",
       "firstName": "Test",
       "lastName": "User",
       "email": "test@example.com",
       "keycloakRole": "EMPLOYEE",
       "sendActivationEmail": true
     }'
   ```

3. Vérifier l'email dans Mailhog:
   ```
   http://localhost:8025
   ```

4. Cliquer sur le lien dans l'email
5. Définir le mot de passe
6. Se connecter avec l'email et le nouveau mot de passe

### Test API

Endpoint pour résender l'activation (dans le contrôleur PasswordReset):
```bash
curl -X POST http://localhost:8888/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Dépannage

### L'email ne s'envoie pas

1. Vérifier que Mailhog est en route:
   ```bash
   docker ps | grep mailhog
   ```

2. Vérifier la config SMTP dans Keycloak:
   - Admin console: http://localhost:8180/admin
   - Realm settings > Email
   - Host: `mailhog`, Port: `1025`

3. Vérifier les logs du backend:
   ```
   ERROR KeycloakUserService: Failed to send activation email...
   ```

4. Relancer le setup:
   ```bash
   bash scripts/keycloak-setup.sh
   ```

### L'utilisateur Keycloak est créé mais pas de mail

Vérifier:
1. `sendActivationEmail` est `true` dans la requête
2. Pas d'exception dans `EmployeeService.createEmployee()`
3. Le username Keycloak existe et n'a pas de password

### Le lien d'activation expire

Par défaut: 12 heures (configurable dans Keycloak Realm > Tokens).

Pour changer:
- Admin console > Realm settings > Tokens > Action Token Expiration
- Ou configurer via script setup

## Migrations futures

### Support VERIFY_EMAIL

Pour ajouter vérification d'email avant accès:
```java
userResource.executeActionsEmail(clientId, redirectUri, 
    List.of("VERIFY_EMAIL", "UPDATE_PASSWORD"));
```

Keycloak affichera deux étapes: vérification email + définition password.

### Double authentification (2FA)

Pour exiger 2FA à la création:
```java
userResource.executeActionsEmail(clientId, redirectUri, 
    List.of("CONFIGURE_TOTP", "UPDATE_PASSWORD"));
```

## Références

- Keycloak Admin REST API: https://www.keycloak.org/docs/latest/admin-api/
- Required Actions: https://www.keycloak.org/docs/latest/server_admin/#required-actions
- Execute Actions Email: https://www.keycloak.org/docs/latest/admin-api/#_userresource

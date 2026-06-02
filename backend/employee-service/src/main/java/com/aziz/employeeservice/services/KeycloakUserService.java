package com.aziz.employeeservice.services;

import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.List;
import java.util.UUID;

/**
 * Service de gestion des utilisateurs Keycloak.
 * Permet de créer, supprimer des utilisateurs et d'assigner des rôles realm.
 */
@Service
public class KeycloakUserService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakUserService.class);

    private final Keycloak keycloakAdminClient;

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Value("${keycloak.activation.client-id:angular-client}")
    private String activationClientId;

    @Value("${keycloak.activation.redirect-uri:http://localhost:4200}")
    private String activationRedirectUri;

    public KeycloakUserService(Keycloak keycloakAdminClient) {
        this.keycloakAdminClient = keycloakAdminClient;
    }

    /**
     * Crée un utilisateur dans Keycloak pour un nouveau employé (sans mot de passe).
     * Le mot de passe sera défini par l'employé via l'email d'activation.
     *
     * @param firstName  Prénom de l'employé
     * @param lastName   Nom de l'employé
     * @param email      Email professionnel
     * @param role       Rôle realm Keycloak ("EMPLOYEE" ou "HR_ADMIN")
     * @return           Le username généré et créé dans Keycloak
     */
    public String createKeycloakUser(String firstName, String lastName, String email, String role) {
        String username = generateUsername(firstName, lastName);

        // Vérifier si le username existe déjà et le rendre unique
        username = ensureUniqueUsername(username);

        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(false);  // N'est pas verifié jusqu'à l'activation
        // Marqueur lu par le template d'email pour basculer en mode "activation"
        user.setAttributes(java.util.Map.of("activationFlow", List.of("true")));

        // Pas de mot de passe initial — sera défini via le lien d'activation
        user.setCredentials(List.of());

        // Création dans Keycloak
        Response response = keycloakAdminClient.realm(realm).users().create(user);
        if (response.getStatus() != 201) {
            throw new RuntimeException("Échec création utilisateur Keycloak (HTTP " + response.getStatus() + "): " + response.readEntity(String.class));
        }

        String userId = CreatedResponseUtil.getCreatedId(response);
        log.info("Utilisateur Keycloak créé : {} (id={})", username, userId);

        // Assignation du rôle realm — en cas d'échec, on supprime l'utilisateur pour éviter les orphelins
        try {
            assignRealmRole(userId, role);
        } catch (RuntimeException e) {
            try {
                keycloakAdminClient.realm(realm).users().delete(userId);
                log.info("Utilisateur Keycloak {} supprimé après échec d'assignation du rôle", username);
            } catch (Exception cleanup) {
                log.error("Échec nettoyage de l'utilisateur Keycloak {} après erreur de rôle: {}", username, cleanup.getMessage());
            }
            throw e;
        }

        return username;
    }

    /**
     * Génère un mot de passe temporaire sécurisé (12 caractères : majuscule + minuscule + chiffre + spécial).
     */
    public String generateTempPassword() {
        SecureRandom rnd = new SecureRandom();
        String upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digit = "23456789";
        String special = "@!#$%";
        String all = upper + lower + digit + special;
        StringBuilder sb = new StringBuilder();
        sb.append(upper.charAt(rnd.nextInt(upper.length())));
        sb.append(lower.charAt(rnd.nextInt(lower.length())));
        sb.append(digit.charAt(rnd.nextInt(digit.length())));
        sb.append(special.charAt(rnd.nextInt(special.length())));
        for (int i = 0; i < 8; i++) sb.append(all.charAt(rnd.nextInt(all.length())));
        char[] arr = sb.toString().toCharArray();
        for (int i = arr.length - 1; i > 0; i--) {
            int j = rnd.nextInt(i + 1);
            char tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return new String(arr);
    }

    /**
     * Crée un utilisateur Keycloak avec un mot de passe temporaire et l'action requise UPDATE_PASSWORD,
     * de sorte qu'à la première connexion Keycloak forcera le changement du mot de passe.
     *
     * @return le username généré (à inclure dans l'email de bienvenue avec le password)
     */
    public String createKeycloakUserWithTempPassword(String firstName, String lastName, String email,
                                                     String role, String tempPassword) {
        String username = generateUsername(firstName, lastName);
        username = ensureUniqueUsername(username);

        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(true);
        // Force le changement du mot de passe à la première connexion
        user.setRequiredActions(List.of("UPDATE_PASSWORD"));

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(tempPassword);
        credential.setTemporary(true);
        user.setCredentials(List.of(credential));

        Response response = keycloakAdminClient.realm(realm).users().create(user);
        if (response.getStatus() != 201) {
            throw new RuntimeException("Échec création utilisateur Keycloak (HTTP " + response.getStatus() + "): " + response.readEntity(String.class));
        }

        String userId = CreatedResponseUtil.getCreatedId(response);
        log.info("Utilisateur Keycloak créé avec mot de passe temporaire : {} (id={})", username, userId);

        try {
            assignRealmRole(userId, role);
        } catch (RuntimeException e) {
            try {
                keycloakAdminClient.realm(realm).users().delete(userId);
                log.info("Utilisateur Keycloak {} supprimé après échec d'assignation du rôle", username);
            } catch (Exception cleanup) {
                log.error("Échec nettoyage utilisateur Keycloak orphelin {}: {}", username, cleanup.getMessage());
            }
            throw e;
        }

        return username;
    }

    /**
     * Crée un utilisateur Keycloak avec mot de passe temporaire (ancienne méthode, conservée pour compatibilité).
     * Préférez createKeycloakUser() + sendActivationEmail() pour le nouveau flux.
     *
     * @deprecated Utilisez createKeycloakUser() + sendActivationEmail() à la place
     */
    @Deprecated
    public String createKeycloakUserWithPassword(String firstName, String lastName, String email,
                                                  String role, String password) {
        String username = generateUsername(firstName, lastName);

        // Vérifier si le username existe déjà et le rendre unique
        username = ensureUniqueUsername(username);

        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(true);

        // Mot de passe temporaire (l'utilisateur devra le changer à la première connexion)
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password != null && !password.isBlank() ? password : UUID.randomUUID().toString());
        credential.setTemporary(true);
        user.setCredentials(List.of(credential));

        // Création dans Keycloak
        Response response = keycloakAdminClient.realm(realm).users().create(user);
        if (response.getStatus() != 201) {
            throw new RuntimeException("Échec création utilisateur Keycloak (HTTP " + response.getStatus() + "): " + response.readEntity(String.class));
        }

        String userId = CreatedResponseUtil.getCreatedId(response);
        log.info("Utilisateur Keycloak créé : {} (id={})", username, userId);

        // Assignation du rôle realm
        assignRealmRole(userId, role);

        return username;
    }

    /**
     * Envoie un email d'activation à l'utilisateur Keycloak avec une action UPDATE_PASSWORD.
     * L'employé clique sur le lien dans l'email pour définir son mot de passe.
     */
    public void sendActivationEmail(String username) {
        List<UserRepresentation> users = keycloakAdminClient.realm(realm).users()
                .searchByUsername(username.trim(), true);
        if (users.isEmpty()) {
            throw new RuntimeException("Utilisateur Keycloak introuvable : " + username);
        }
        String userId = users.get(0).getId();
        keycloakAdminClient.realm(realm).users().get(userId)
                .executeActionsEmail(activationClientId, activationRedirectUri, List.of("UPDATE_PASSWORD"));
        log.info("Email d'activation envoyé pour l'utilisateur {}", username);
    }

    /**
     * Supprime un utilisateur Keycloak par son username.
     * Aucune erreur si l'utilisateur n'existe pas.
     */
    public void deleteKeycloakUser(String username) {
        if (username == null || username.isBlank()) return;
        try {
            List<UserRepresentation> users = keycloakAdminClient.realm(realm).users()
                    .searchByUsername(username.trim(), true);
            if (!users.isEmpty()) {
                keycloakAdminClient.realm(realm).users().delete(users.get(0).getId());
                log.info("Utilisateur Keycloak supprimé : {}", username);
            }
        } catch (Exception e) {
            log.error("Erreur lors de la suppression Keycloak de '{}': {}", username, e.getMessage());
        }
    }

    /**
     * Liste les utilisateurs ayant un rôle realm donné.
     * Utilisé notamment pour proposer la liste des managers lors de la planification d'un entretien.
     *
     * @param roleName Nom du rôle realm (ex: "MANAGER")
     * @return Liste légère { username, firstName, lastName, email } — vide si rôle absent ou aucun user.
     */
    public List<java.util.Map<String, String>> listUsersByRole(String roleName) {
        try {
            List<UserRepresentation> users = keycloakAdminClient.realm(realm)
                    .roles().get(roleName).getUserMembers(0, 1000);
            return users.stream()
                    .filter(u -> Boolean.TRUE.equals(u.isEnabled()))
                    .map(u -> {
                        java.util.Map<String, String> m = new java.util.HashMap<>();
                        m.put("username", u.getUsername());
                        m.put("firstName", u.getFirstName());
                        m.put("lastName", u.getLastName());
                        m.put("email", u.getEmail());
                        return m;
                    })
                    .toList();
        } catch (jakarta.ws.rs.NotFoundException nf) {
            log.warn("Rôle realm '{}' absent du realm '{}' — retour liste vide.", roleName, realm);
            return List.of();
        } catch (Exception e) {
            log.error("Erreur listage utilisateurs avec rôle '{}': {}", roleName, e.getMessage());
            return List.of();
        }
    }

    // ── Privé ──

    private void assignRealmRole(String userId, String roleName) {
        // 1. Récupérer la représentation du rôle (404 si le rôle n'existe pas dans le realm)
        RoleRepresentation role;
        try {
            role = keycloakAdminClient.realm(realm).roles().get(roleName).toRepresentation();
        } catch (jakarta.ws.rs.NotFoundException nf) {
            log.error("Rôle realm '{}' inexistant dans le realm '{}'", roleName, realm);
            throw new RuntimeException("Rôle Keycloak introuvable : " + roleName);
        } catch (Exception e) {
            log.error("Erreur lors de la lecture du rôle '{}' dans le realm '{}'", roleName, realm, e);
            throw new RuntimeException("Erreur lecture rôle Keycloak '" + roleName + "' : " + e.getMessage());
        }

        // 2. Assigner le rôle à l'utilisateur (peut échouer si le service account n'a pas les droits)
        try {
            keycloakAdminClient.realm(realm).users().get(userId).roles().realmLevel().add(List.of(role));
            log.info("Rôle '{}' assigné à l'utilisateur {}", roleName, userId);
        } catch (jakarta.ws.rs.ForbiddenException fe) {
            log.error("Permissions insuffisantes pour assigner le rôle '{}' (service account 'sirh-backend-admin' doit avoir realm-management/manage-users + manage-realm)", roleName, fe);
            throw new RuntimeException("Permissions insuffisantes pour assigner le rôle Keycloak '" + roleName + "' (le service account 'sirh-backend-admin' a-t-il les rôles realm-management 'manage-users' + 'view-realm' ?)");
        } catch (Exception e) {
            log.error("Échec assignation du rôle '{}' à l'utilisateur {}", roleName, userId, e);
            throw new RuntimeException("Échec assignation rôle '" + roleName + "' : " + e.getMessage());
        }
    }

    /**
     * Génère un username normalisé : prénom.nom (sans accents, minuscules).
     * Exemple : "Jean-Pierre Décaux" → "jean-pierre.decaux"
     */
    private String generateUsername(String firstName, String lastName) {
        String fn = normalize(firstName);
        String ln = normalize(lastName);
        return fn + "." + ln;
    }

    private String normalize(String input) {
        if (input == null) return "";
        return Normalizer.normalize(input.trim(), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9\\-.]", "");
    }

    /** Si "jean.dupont" existe déjà, tente "jean.dupont2", "jean.dupont3", etc. */
    private String ensureUniqueUsername(String base) {
        if (keycloakAdminClient.realm(realm).users().searchByUsername(base, true).isEmpty()) {
            return base;
        }
        int suffix = 2;
        while (true) {
            String candidate = base + suffix;
            if (keycloakAdminClient.realm(realm).users().searchByUsername(candidate, true).isEmpty()) {
                return candidate;
            }
            suffix++;
        }
    }
}

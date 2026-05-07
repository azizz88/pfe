package com.aziz.employeeservice.auth;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final Keycloak keycloakAdminClient;

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Value("${keycloak.reset-password.client-id}")
    private String resetClientId;

    @Value("${keycloak.reset-password.redirect-uri}")
    private String resetRedirectUri;

    @Value("${keycloak.activation.client-id:${keycloak.reset-password.client-id}}")
    private String activationClientId;

    @Value("${keycloak.activation.redirect-uri:${keycloak.reset-password.redirect-uri}}")
    private String activationRedirectUri;

    public PasswordResetService(Keycloak keycloakAdminClient) {
        this.keycloakAdminClient = keycloakAdminClient;
    }

    /**
     * Envoie un email de réinitialisation de mot de passe (flux "mot de passe oublié").
     * L'utilisateur reçoit un lien pour définir un nouveau mot de passe.
     *
     * @param email Email de l'utilisateur
     */
    public void requestReset(String email) {
        if (email == null || email.isBlank()) {
            log.warn("Password reset requested with empty email");
            return;
        }

        List<UserRepresentation> users = keycloakAdminClient.realm(realm)
            .users()
            .searchByEmail(email.trim(), true);

        if (users.isEmpty()) {
            log.warn("Password reset requested for unknown email: {}", email);
            return;
        }

        UserRepresentation user = users.get(0);
        try {
            UserResource userResource = keycloakAdminClient.realm(realm).users().get(user.getId());
            // Passer client-id + redirect-uri permet :
            //  1. d'eviter l'erreur "Cookie not found" (pas besoin d'auth session existante)
            //  2. de rediriger l'utilisateur vers l'app apres mise a jour du mot de passe
            userResource.executeActionsEmail(resetClientId, resetRedirectUri, List.of("UPDATE_PASSWORD"));
            log.info("Password reset email dispatched for user {} ({})", user.getUsername(), email);
        } catch (Exception e) {
            log.error("Failed to send password reset email for {}: {}", email, e.getMessage());
        }
    }

    /**
     * Envoie un email d'activation à un nouvel employé.
     * L'utilisateur reçoit un lien pour définir son mot de passe et activer son compte.
     *
     * @param keycloakUsername Username Keycloak de l'employé
     * @param email            Email de l'employé
     */
    public void sendActivationEmail(String keycloakUsername, String email) {
        if (keycloakUsername == null || keycloakUsername.isBlank()) {
            log.warn("Activation email requested with empty username");
            return;
        }

        List<UserRepresentation> users = keycloakAdminClient.realm(realm)
            .users()
            .searchByUsername(keycloakUsername.trim(), true);

        if (users.isEmpty()) {
            log.warn("Activation email requested for unknown username: {}", keycloakUsername);
            return;
        }

        UserRepresentation user = users.get(0);
        try {
            UserResource userResource = keycloakAdminClient.realm(realm).users().get(user.getId());
            userResource.executeActionsEmail(activationClientId, activationRedirectUri, 
                                           List.of("UPDATE_PASSWORD"));
            log.info("Activation email dispatched for user {} ({})", keycloakUsername, email);
        } catch (Exception e) {
            log.error("Failed to send activation email for {} ({}): {}", keycloakUsername, email, e.getMessage());
        }
    }
}

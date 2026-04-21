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

    public PasswordResetService(Keycloak keycloakAdminClient) {
        this.keycloakAdminClient = keycloakAdminClient;
    }

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
}

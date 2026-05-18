package com.aziz.employeeservice.services;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Envoie l'email de bienvenue à un nouvel employé contenant ses identifiants
 * (username + mot de passe temporaire) et le lien de connexion.
 * À la première connexion, Keycloak forcera le changement du mot de passe.
 */
@Service
public class WelcomeEmailService {

    private static final Logger log = LoggerFactory.getLogger(WelcomeEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@sirh.local}")
    private String fromAddress;

    @Value("${app.login-url:http://localhost:4200}")
    private String loginUrl;

    public WelcomeEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendWelcomeEmail(String to, String firstName, String username, String tempPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Bienvenue chez SIRH — Vos identifiants de connexion");
            helper.setText(buildHtml(firstName, username, tempPassword), true);
            mailSender.send(message);
            log.info("Email de bienvenue envoyé à {} (username={})", to, username);
        } catch (Exception e) {
            log.error("Échec envoi email de bienvenue à {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Impossible d'envoyer l'email de bienvenue : " + e.getMessage(), e);
        }
    }

    private String buildHtml(String firstName, String username, String tempPassword) {
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"></head>
                <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px;color:#1e293b;">
                  <div style="max-width:560px;margin:auto;background:white;border-radius:12px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <h2 style="margin:0 0 16px;color:#1e3a5f;">Bienvenue %s 👋</h2>
                    <p>Votre compte SIRH a été créé. Voici vos identifiants de connexion :</p>
                    <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:18px 0;font-family:monospace;">
                      <div><strong>Nom d'utilisateur :</strong> %s</div>
                      <div><strong>Mot de passe :</strong> %s</div>
                    </div>
                    <p>
                      <a href="%s" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
                        Se connecter
                      </a>
                    </p>
                    <p style="color:#64748b;font-size:0.9rem;margin-top:24px;">
                      ⚠️ Pour des raisons de sécurité, vous serez invité à <strong>changer votre mot de passe</strong>
                      dès votre première connexion.
                    </p>
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                    <p style="color:#94a3b8;font-size:0.8rem;">SIRH — Cet email a été généré automatiquement, ne pas répondre.</p>
                  </div>
                </body>
                </html>
                """.formatted(escape(firstName), escape(username), escape(tempPassword), escape(loginUrl));
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}

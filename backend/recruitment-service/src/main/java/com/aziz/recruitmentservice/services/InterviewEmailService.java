package com.aziz.recruitmentservice.services;

import biweekly.Biweekly;
import biweekly.ICalendar;
import biweekly.component.VEvent;
import biweekly.property.Method;
import com.aziz.recruitmentservice.entities.Interview;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.Locale;

/**
 * Envoie l'email de convocation à un entretien (avec pièce jointe .ics).
 * Utilise MailHog en dev (port 1025), SMTP réel en prod.
 */
@Service
public class InterviewEmailService {

    private static final Logger log = LoggerFactory.getLogger(InterviewEmailService.class);

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'à' HH'h'mm", Locale.FRENCH);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@sirh.local}")
    private String fromAddress;

    @Value("${app.login-url:http://localhost:4200}")
    private String loginUrl;

    @Value("${app.mail.rh-inbox:rh@sirh.local}")
    private String rhInboxAddress;

    public InterviewEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Envoie la convocation au candidat.
     *
     * @param interview      L'entretien planifié (date, manager, lieu...)
     * @param candidateEmail Email du destinataire
     * @param candidateName  Nom complet du candidat (pour personnaliser)
     * @param jobOfferTitle  Intitulé de l'offre (pour le sujet et le corps)
     */
    public void sendConvocation(Interview interview,
                                String candidateEmail,
                                String candidateName,
                                String jobOfferTitle) {
        if (candidateEmail == null || candidateEmail.isBlank()) {
            log.warn("Convocation non envoyée (email manquant) pour entretien #{}", interview.getId());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(candidateEmail);
            helper.setSubject("Convocation à un entretien — " + (jobOfferTitle != null ? jobOfferTitle : "Recrutement SIRH"));
            helper.setText(buildHtml(interview, candidateName, jobOfferTitle), true);

            // Pièce jointe .ics
            byte[] icsBytes = buildIcs(interview, candidateEmail, candidateName, jobOfferTitle)
                    .getBytes(java.nio.charset.StandardCharsets.UTF_8);
            helper.addAttachment("entretien.ics", new ByteArrayResource(icsBytes), "text/calendar");

            mailSender.send(message);
            log.info("Convocation envoyée à {} pour entretien #{} le {}",
                    candidateEmail, interview.getId(), interview.getScheduledDate());
        } catch (Exception e) {
            log.error("Échec envoi convocation à {}: {}", candidateEmail, e.getMessage(), e);
            // On ne propage pas : l'entretien reste créé, le RH peut renvoyer manuellement.
        }
    }

    private String buildHtml(Interview interview, String candidateName, String jobOfferTitle) {
        String dateLabel = interview.getScheduledDate() != null
                ? DATE_FMT.format(interview.getScheduledDate())
                : "(à confirmer)";
        String location = (interview.getLocation() != null && !interview.getLocation().isBlank())
                ? interview.getLocation()
                : "À confirmer";
        String manager = interview.getManagerName() != null ? interview.getManagerName() : interview.getInterviewer();
        String greeting = candidateName != null && !candidateName.isBlank()
                ? "Bonjour " + escape(candidateName)
                : "Bonjour";

        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"></head>
                <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px;color:#1e293b;">
                  <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <h2 style="margin:0 0 16px;color:#1e3a5f;">📅 Convocation à un entretien</h2>
                    <p>%s,</p>
                    <p>Suite à votre candidature%s, nous avons le plaisir de vous convier à un entretien.</p>

                    <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:8px;padding:18px;margin:20px 0;">
                      <div style="margin-bottom:10px;"><strong>🗓 Date :</strong> %s</div>
                      <div style="margin-bottom:10px;"><strong>📍 Lieu :</strong> %s</div>
                      <div style="margin-bottom:10px;"><strong>👤 Manager responsable :</strong> %s</div>
                      <div><strong>💼 Poste :</strong> %s</div>
                    </div>

                    <p style="font-size:0.92rem;color:#475569;">
                      Un fichier <code>.ics</code> est joint à cet email : ouvrez-le pour ajouter automatiquement
                      l'entretien à votre calendrier (Outlook, Google Calendar, Apple Calendar...).
                    </p>

                    <p>
                      <a href="%s" style="display:inline-block;padding:10px 22px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
                        Accéder à mon espace SIRH
                      </a>
                    </p>

                    <p style="color:#64748b;font-size:0.88rem;margin-top:24px;">
                      En cas d'empêchement, merci de nous prévenir au plus tôt afin que nous puissions reprogrammer.
                    </p>

                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                    <p style="color:#94a3b8;font-size:0.78rem;">
                      SIRH — Cet email a été généré automatiquement, merci de ne pas y répondre directement.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                greeting,
                jobOfferTitle != null ? " pour le poste <strong>" + escape(jobOfferTitle) + "</strong>" : "",
                escape(dateLabel),
                escape(location),
                escape(manager != null ? manager : "À communiquer"),
                escape(jobOfferTitle != null ? jobOfferTitle : "—"),
                escape(loginUrl)
        );
    }

    /**
     * Construit le contenu d'un fichier .ics standard (RFC 5545) que le client mail peut
     * importer pour ajouter l'événement au calendrier du candidat.
     */
    private String buildIcs(Interview interview,
                            String candidateEmail,
                            String candidateName,
                            String jobOfferTitle) {
        ICalendar ical = new ICalendar();
        ical.setMethod(Method.REQUEST);

        VEvent event = new VEvent();
        event.setSummary("Entretien — " + (jobOfferTitle != null ? jobOfferTitle : "Recrutement SIRH"));

        LocalDateTime start = interview.getScheduledDate() != null
                ? interview.getScheduledDate()
                : LocalDateTime.now().plusDays(1);
        Date startDate = Date.from(start.atZone(ZoneId.systemDefault()).toInstant());
        Date endDate = Date.from(start.plus(Duration.ofMinutes(60))
                .atZone(ZoneId.systemDefault()).toInstant());

        event.setDateStart(startDate);
        event.setDateEnd(endDate);

        if (interview.getLocation() != null && !interview.getLocation().isBlank()) {
            event.setLocation(interview.getLocation());
        }

        String description = String.format(
                "Entretien pour le poste : %s%nManager : %s%n%nUn email détaillé vous a été transmis.",
                jobOfferTitle != null ? jobOfferTitle : "—",
                interview.getManagerName() != null ? interview.getManagerName()
                        : (interview.getInterviewer() != null ? interview.getInterviewer() : "À communiquer")
        );
        event.setDescription(description);

        event.setOrganizer(fromAddress);
        if (candidateEmail != null && !candidateEmail.isBlank()) {
            event.addAttendee(candidateName != null ? candidateName : candidateEmail);
        }

        ical.addEvent(event);
        return Biweekly.write(ical).go();
    }

    // ═══════════════════════════════════════════════════════════
    //  Phase 1 — Email d'affectation au manager
    // ═══════════════════════════════════════════════════════════

    /**
     * Notifie le manager qu'un entretien lui a été affecté et qu'il doit le planifier.
     * Pas de pièce jointe .ics (la date n'est pas encore fixée).
     */
    public void sendAssignmentToManager(Interview interview) {
        String managerEmail = interview.getManagerEmail();
        if (managerEmail == null || managerEmail.isBlank()) {
            log.warn("Email d'affectation non envoyé (email manager manquant) pour entretien #{}", interview.getId());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(managerEmail);
            helper.setSubject("📨 Nouvel entretien à planifier — " +
                    (interview.getJobOfferTitle() != null ? interview.getJobOfferTitle() : "Recrutement"));
            helper.setText(buildAssignmentHtml(interview), true);
            mailSender.send(message);
            log.info("Email d'affectation envoyé à {} (manager) pour entretien #{}", managerEmail, interview.getId());
        } catch (Exception e) {
            log.error("Échec envoi email d'affectation à {}: {}", managerEmail, e.getMessage(), e);
        }
    }

    private String buildAssignmentHtml(Interview interview) {
        String managerGreeting = interview.getManagerName() != null && !interview.getManagerName().isBlank()
                ? "Bonjour " + escape(interview.getManagerName())
                : "Bonjour";
        String candidate = interview.getCandidateName() != null ? interview.getCandidateName() : "le candidat";
        String offer = interview.getJobOfferTitle() != null ? interview.getJobOfferTitle() : "—";
        String typeLabel = interview.getCandidateType() != null
                && interview.getCandidateType().name().equals("EXTERNAL") ? "🌐 Externe" : "🏢 Interne";
        String noteBlock = (interview.getRhNote() != null && !interview.getRhNote().isBlank())
                ? "<div style=\"margin-top:14px;padding:12px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;\">" +
                  "<strong>📝 Note du RH :</strong><br>" + escape(interview.getRhNote()).replace("\n", "<br>") +
                  "</div>"
                : "";

        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"></head>
                <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px;color:#1e293b;">
                  <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <h2 style="margin:0 0 16px;color:#854d0e;">👔 Nouvel entretien à planifier</h2>
                    <p>%s,</p>
                    <p>Le service RH vous a affecté un entretien à conduire. <strong>Merci de fixer la date et l'heure dans les 48 heures</strong>.</p>

                    <div style="background:#fefce8;border-left:4px solid #f59e0b;border-radius:8px;padding:18px;margin:20px 0;">
                      <div style="margin-bottom:10px;"><strong>👤 Candidat :</strong> %s</div>
                      <div style="margin-bottom:10px;"><strong>💼 Poste :</strong> %s</div>
                      <div><strong>🏷️ Type :</strong> %s</div>
                    </div>

                    %s

                    <p>
                      <a href="%s/manager/interviews" style="display:inline-block;padding:11px 24px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;text-decoration:none;border-radius:8px;font-weight:700;">
                        📅 Planifier l'entretien
                      </a>
                    </p>

                    <p style="color:#64748b;font-size:0.88rem;margin-top:24px;">
                      Si vous ne pouvez pas conduire cet entretien, vous pouvez le refuser (avec motif) depuis votre dashboard ; le RH sera notifié pour réaffecter.
                    </p>

                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                    <p style="color:#94a3b8;font-size:0.78rem;">
                      SIRH — Cet email a été généré automatiquement.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                managerGreeting,
                escape(candidate),
                escape(offer),
                typeLabel,
                noteBlock,
                escape(loginUrl)
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  Phase 1 — Email "pre-shortlist" rassurant au candidat
    // ═══════════════════════════════════════════════════════════

    /**
     * Informe le candidat que sa candidature est retenue pour un entretien.
     * Pas de date — celle-ci viendra dans la convocation officielle quand le manager planifiera.
     */
    public void sendPreShortlistToCandidate(Interview interview,
                                            String candidateEmail,
                                            String candidateName,
                                            String jobOfferTitle) {
        if (candidateEmail == null || candidateEmail.isBlank()) {
            log.warn("Pre-shortlist non envoyé (email candidat manquant) pour entretien #{}", interview.getId());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(candidateEmail);
            helper.setSubject("Votre candidature avance — " +
                    (jobOfferTitle != null ? jobOfferTitle : "Recrutement SIRH"));
            helper.setText(buildPreShortlistHtml(candidateName, jobOfferTitle, interview.getManagerName()), true);
            mailSender.send(message);
            log.info("Pre-shortlist envoyé à {} pour entretien #{}", candidateEmail, interview.getId());
        } catch (Exception e) {
            log.error("Échec envoi pre-shortlist à {}: {}", candidateEmail, e.getMessage(), e);
        }
    }

    private String buildPreShortlistHtml(String candidateName, String jobOfferTitle, String managerName) {
        String greeting = candidateName != null && !candidateName.isBlank()
                ? "Bonjour " + escape(candidateName)
                : "Bonjour";
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"></head>
                <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px;color:#1e293b;">
                  <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <h2 style="margin:0 0 16px;color:#15803d;">✨ Bonne nouvelle</h2>
                    <p>%s,</p>
                    <p>Nous avons le plaisir de vous informer que votre candidature%s a retenu notre attention.</p>
                    <p>Vous serez prochainement contacté(e) par <strong>%s</strong> pour fixer une date d'entretien. Une convocation officielle avec tous les détails (date, lieu, lien visio) vous sera envoyée dès la planification.</p>

                    <div style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px;padding:14px;margin:18px 0;">
                      Aucune action n'est requise de votre part pour le moment.
                    </div>

                    <p>
                      <a href="%s" style="display:inline-block;padding:10px 22px;background:#10b981;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
                        Accéder à mon espace SIRH
                      </a>
                    </p>

                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                    <p style="color:#94a3b8;font-size:0.78rem;">
                      SIRH — Cet email a été généré automatiquement, merci de ne pas y répondre directement.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                greeting,
                jobOfferTitle != null ? " pour le poste <strong>" + escape(jobOfferTitle) + "</strong>" : "",
                escape(managerName != null ? managerName : "le manager responsable"),
                escape(loginUrl)
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  Refus manager — Notification au RH
    // ═══════════════════════════════════════════════════════════

    /**
     * Notifie le RH qu'un manager a refusé une affectation, pour réaffecter.
     */
    public void sendRejectionToRh(Interview interview) {
        if (rhInboxAddress == null || rhInboxAddress.isBlank()) {
            log.warn("Notification refus non envoyée (rh-inbox non configurée) pour entretien #{}", interview.getId());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(rhInboxAddress);
            helper.setSubject("⚠️ Entretien refusé par le manager — Réaffectation requise");
            helper.setText(buildRejectionHtml(interview), true);
            mailSender.send(message);
            log.info("Notification refus envoyée à {} pour entretien #{}", rhInboxAddress, interview.getId());
        } catch (Exception e) {
            log.error("Échec envoi notification refus à {}: {}", rhInboxAddress, e.getMessage(), e);
        }
    }

    private String buildRejectionHtml(Interview interview) {
        String reason = interview.getRejectionReason() != null
                ? escape(interview.getRejectionReason()).replace("\n", "<br>")
                : "(aucun motif fourni)";
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"></head>
                <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px;color:#1e293b;">
                  <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <h2 style="margin:0 0 16px;color:#b91c1c;">⚠️ Affectation refusée — Action requise</h2>
                    <p>Le manager <strong>%s</strong> a refusé l'affectation suivante :</p>

                    <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;padding:16px;margin:18px 0;">
                      <div style="margin-bottom:8px;"><strong>👤 Candidat :</strong> %s</div>
                      <div style="margin-bottom:8px;"><strong>💼 Poste :</strong> %s</div>
                      <div style="margin-top:14px;padding-top:10px;border-top:1px solid #fecaca;">
                        <strong>Motif :</strong><br>%s
                      </div>
                    </div>

                    <p>Merci de réaffecter l'entretien à un autre manager via votre dashboard.</p>

                    <p>
                      <a href="%s/admin/recruitment" style="display:inline-block;padding:11px 24px;background:#dc2626;color:white;text-decoration:none;border-radius:8px;font-weight:700;">
                        Réaffecter l'entretien
                      </a>
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(
                escape(interview.getManagerName() != null ? interview.getManagerName() : interview.getManagerUsername()),
                escape(interview.getCandidateName() != null ? interview.getCandidateName() : "—"),
                escape(interview.getJobOfferTitle() != null ? interview.getJobOfferTitle() : "—"),
                reason,
                escape(loginUrl)
        );
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}

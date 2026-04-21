<#-- Template email pour les Required Actions (ex: UPDATE_PASSWORD) -->
<#-- Envoye par Keycloak via `executeActionsEmail` -->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>SIRH - Reinitialisation mot de passe</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
        <td align="center">

            <!-- Container principal -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.08);">

                <!-- Header avec logo -->
                <tr>
                    <td align="center" style="background:linear-gradient(135deg,#1e3a5f 0%,#0d1b2a 100%);padding:40px 32px;">
                        <div style="display:inline-block;padding:8px 20px;border:2px solid rgba(255,255,255,0.25);border-radius:8px;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:3px;">
                            SIRH
                        </div>
                        <p style="margin:16px 0 0 0;color:rgba(255,255,255,0.75);font-size:14px;">
                            Plateforme RH Securisee
                        </p>
                    </td>
                </tr>

                <!-- Corps du mail -->
                <tr>
                    <td style="padding:40px 32px;">

                        <h1 style="margin:0 0 20px 0;font-size:22px;color:#0f172a;font-weight:600;">
                            Reinitialisation de votre mot de passe
                        </h1>

                        <p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;">
                            Bonjour <strong>${user.firstName!user.username}</strong>,
                        </p>

                        <p style="margin:0 0 20px 0;font-size:15px;color:#334155;line-height:1.6;">
                            Nous avons recu une demande de reinitialisation du mot de passe associe
                            a votre compte <strong>${user.email}</strong>.
                        </p>

                        <p style="margin:0 0 24px 0;font-size:15px;color:#334155;line-height:1.6;">
                            Cliquez sur le bouton ci-dessous pour definir un nouveau mot de passe :
                        </p>

                        <!-- CTA Button -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px auto;">
                            <tr>
                                <td align="center" style="background-color:#1e3a5f;border-radius:8px;">
                                    <a href="${link}"
                                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                                        Reinitialiser mon mot de passe
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <!-- Info box -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="background-color:#f1f5f9;border-left:3px solid #1e3a5f;border-radius:6px;margin-bottom:24px;">
                            <tr>
                                <td style="padding:14px 16px;font-size:13px;color:#475569;line-height:1.6;">
                                    <strong style="color:#0f172a;">Important</strong><br/>
                                    Ce lien est valable <strong>${linkExpirationFormatter(linkExpiration)}</strong>.
                                    Passe ce delai, vous devrez refaire une demande.
                                </td>
                            </tr>
                        </table>

                        <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;line-height:1.6;">
                            Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
                        </p>
                        <p style="margin:0 0 24px 0;font-size:12px;color:#1e3a5f;word-break:break-all;">
                            <a href="${link}" style="color:#1e3a5f;text-decoration:underline;">${link}</a>
                        </p>

                        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />

                        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                            Vous n'avez pas demande de reinitialisation ? Vous pouvez ignorer ce message
                            en toute securite, votre mot de passe actuel reste inchange.
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td align="center" style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;">
                            &copy; 2026 SIRH &mdash; Plateforme RH Securisee<br/>
                            Email automatique, merci de ne pas repondre.
                        </p>
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>

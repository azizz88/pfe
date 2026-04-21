<#import "template.ftl" as layout>
<@layout.registrationLayout; section>

    <#if section = "form">
        <div id="kc-custom-login">
            <div class="login-brand">
                <div class="login-logo error-logo">⏰</div>
                <h1 class="login-title">Session expirée</h1>
                <p class="login-subtitle">Votre session ou le lien a expiré</p>
            </div>

            <div class="info-card">
                <div class="info-card-icon">🔄</div>
                <p class="info-card-text">
                    Pour des raisons de sécurité, votre session a expiré. Veuillez recommencer le processus.
                </p>
            </div>

            <div class="form-actions" style="margin-top: 24px;">
                <a id="loginRestartLink" href="${url.loginRestartFlowUrl}" class="login-button" style="text-decoration:none; text-align:center;">
                    Recommencer
                    <span class="btn-arrow">→</span>
                </a>
            </div>

            <div class="forgot-password">
                <a href="${url.loginUrl}">
                    ← Retour à la connexion
                </a>
            </div>

            <div class="login-footer">
                <p>© 2026 SIRH — Plateforme RH Sécurisée</p>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>

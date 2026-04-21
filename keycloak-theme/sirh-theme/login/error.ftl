<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>

    <#if section = "form">
        <div id="kc-custom-login">
            <div class="login-brand">
                <div class="login-logo error-logo">❌</div>
                <h1 class="login-title">Erreur</h1>
                <p class="login-subtitle">Une erreur est survenue</p>
            </div>

            <#if message?has_content>
                <div class="alert alert-error">
                    <span class="alert-icon">⚠️</span>
                    ${kcSanitize(message.summary)?no_esc}
                </div>
            </#if>

            <div class="form-actions" style="margin-top: 24px;">
                <#if client?? && client.baseUrl?has_content>
                    <a href="${client.baseUrl}" class="login-button" style="text-decoration:none; text-align:center;">
                        Retour à l'application
                        <span class="btn-arrow">→</span>
                    </a>
                </#if>
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

<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>

    <#if section = "form">
        <div id="kc-custom-login">
            <div class="login-brand">
                <div class="login-logo info-logo">📩</div>
                <h1 class="login-title">Vérification d'email</h1>
                <p class="login-subtitle">Un email de vérification a été envoyé à votre adresse</p>
            </div>

            <div class="info-card">
                <div class="info-card-icon">📧</div>
                <p class="info-card-text">
                    Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification pour continuer.
                </p>
            </div>

            <#if message?has_content && message.type != 'warning'>
                <#if message.type = 'error'>
                    <div class="alert alert-error">
                        <span class="alert-icon">⚠️</span>
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                <#else>
                    <div class="alert alert-info">
                        <span class="alert-icon">ℹ️</span>
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>
            </#if>

            <div class="form-actions" style="margin-top: 24px;">
                <a href="${url.loginAction}" class="login-button" style="text-decoration:none; text-align:center;">
                    J'ai vérifié mon email
                    <span class="btn-arrow">→</span>
                </a>
            </div>

            <div class="login-footer">
                <p>© 2026 SIRH — Plateforme RH Sécurisée</p>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>

<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username') displayInfo=false; section>

    <#if section = "form">
        <div id="kc-custom-login">
            <!-- Logo et titre -->
            <div class="login-brand">
                <div class="login-logo">🔑</div>
                <h1 class="login-title">Mot de passe oublié</h1>
                <p class="login-subtitle">Entrez votre identifiant ou email pour recevoir les instructions de réinitialisation</p>
            </div>

            <#if messagesPerField.existsError('username')>
                <div class="alert alert-error">
                    <span class="alert-icon">⚠️</span>
                    ${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}
                </div>
            </#if>

            <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <#if message.type = 'success'>
                    <div class="alert alert-success">
                        <span class="alert-icon">✅</span>
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                <#elseif message.type = 'info'>
                    <div class="alert alert-info">
                        <span class="alert-icon">ℹ️</span>
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>
            </#if>

            <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
                <div class="form-group">
                    <label for="username" class="form-label">
                        <span class="label-icon">👤</span>
                        Nom d'utilisateur ou email
                    </label>
                    <input type="text" id="username" name="username" class="form-input"
                           autofocus placeholder="Entrez votre identifiant ou email"
                           value="${(auth.attemptedUsername!'')}" />
                </div>

                <div class="form-actions">
                    <button class="login-button" type="submit">
                        Réinitialiser le mot de passe
                        <span class="btn-arrow">→</span>
                    </button>
                </div>

                <div class="forgot-password">
                    <a href="${url.loginUrl}">
                        ← Retour à la connexion
                    </a>
                </div>
            </form>

            <div class="login-footer">
                <p>© 2026 SIRH — Plateforme RH Sécurisée</p>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>

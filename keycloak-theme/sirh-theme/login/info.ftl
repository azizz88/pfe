<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>

    <#if section = "form">
        <div id="kc-custom-login">
            <div class="login-brand">
                <div class="login-logo info-logo">📧</div>
                <h1 class="login-title">Vérifiez votre boîte mail</h1>
            </div>

            <#if message?has_content>
                <div class="info-card">
                    <div class="info-card-icon">✅</div>
                    <p class="info-card-text">${kcSanitize(message.summary)?no_esc}</p>
                </div>
            </#if>

            <#if requiredActions??>
                <div class="info-card">
                    <div class="info-card-icon">📋</div>
                    <p class="info-card-text">
                        <#list requiredActions as reqActionItem>
                            ${msg("requiredAction.${reqActionItem}")}<#sep>, </#sep>
                        </#list>
                    </p>
                </div>
            </#if>

            <div class="form-actions" style="margin-top: 24px;">
                <#if pageRedirectUri?has_content>
                    <a href="${pageRedirectUri}" class="login-button" style="text-decoration:none; text-align:center;">
                        Continuer
                        <span class="btn-arrow">→</span>
                    </a>
                <#elseif actionUri?has_content>
                    <a href="${actionUri}" class="login-button" style="text-decoration:none; text-align:center;">
                        Continuer
                        <span class="btn-arrow">→</span>
                    </a>
                <#elseif (client.baseUrl)?has_content>
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

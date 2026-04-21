<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>

    <#if section = "form">
        <div id="kc-custom-login">
            <!-- Logo et titre -->
            <div class="login-brand">
                <div class="login-logo">🔑</div>
                <h1 class="login-title">Nouveau mot de passe</h1>
                <p class="login-subtitle">Créez votre nouveau mot de passe sécurisé</p>
            </div>

            <!-- Messages d'erreur -->
            <#if messagesPerField.existsError('password')>
                <div class="alert alert-error">
                    <span class="alert-icon">⚠️</span>
                    ${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}
                </div>
            </#if>

            <#if messagesPerField.existsError('password-confirm')>
                <div class="alert alert-error">
                    <span class="alert-icon">⚠️</span>
                    ${kcSanitize(messagesPerField.getFirstError('password-confirm'))?no_esc}
                </div>
            </#if>

            <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <#if message.type = 'success'>
                    <div class="alert alert-success">
                        <span class="alert-icon">✅</span>
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                <#elseif message.type = 'error'>
                    <div class="alert alert-error">
                        <span class="alert-icon">⚠️</span>
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                <#elseif message.type = 'info'>
                    <div class="alert alert-info">
                        <span class="alert-icon">ℹ️</span>
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>
            </#if>

            <!-- Formulaire nouveau mot de passe -->
            <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
                <div class="form-group">
                    <label for="password-new" class="form-label">
                        <span class="label-icon">🔒</span>
                        Nouveau mot de passe
                    </label>
                    <div class="password-wrapper">
                        <input type="password" id="password-new" name="password-new" class="form-input"
                               autofocus autocomplete="new-password"
                               placeholder="Entrez votre nouveau mot de passe"
                               aria-invalid="<#if messagesPerField.existsError('password')>true</#if>" />
                        <button type="button" class="toggle-password" onclick="togglePassword('password-new', 'eye-icon-new')" tabindex="5">
                            <span id="eye-icon-new">👁️</span>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label for="password-confirm" class="form-label">
                        <span class="label-icon">🔒</span>
                        Confirmer le mot de passe
                    </label>
                    <div class="password-wrapper">
                        <input type="password" id="password-confirm" name="password-confirm" class="form-input"
                               autocomplete="new-password"
                               placeholder="Confirmez votre nouveau mot de passe"
                               aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>" />
                        <button type="button" class="toggle-password" onclick="togglePassword('password-confirm', 'eye-icon-confirm')" tabindex="6">
                            <span id="eye-icon-confirm">👁️</span>
                        </button>
                    </div>
                </div>

                <!-- Indicateur de force du mot de passe -->
                <div class="password-strength" id="password-strength">
                    <div class="strength-bars">
                        <div class="strength-bar" id="bar1"></div>
                        <div class="strength-bar" id="bar2"></div>
                        <div class="strength-bar" id="bar3"></div>
                        <div class="strength-bar" id="bar4"></div>
                    </div>
                    <span class="strength-text" id="strength-text"></span>
                </div>

                <div class="form-actions">
                    <#if isAppInitiatedAction??>
                        <button class="login-button" type="submit" value="${msg("doSubmit")}">
                            Mettre à jour le mot de passe
                            <span class="btn-arrow">→</span>
                        </button>
                        <button class="login-button secondary-button" type="submit" name="cancel-aia" value="true">
                            ${msg("doCancel")}
                        </button>
                    <#else>
                        <button class="login-button" type="submit">
                            Mettre à jour le mot de passe
                            <span class="btn-arrow">→</span>
                        </button>
                    </#if>
                </div>
            </form>

            <div class="login-footer">
                <p>© 2026 SIRH — Plateforme RH Sécurisée</p>
            </div>
        </div>

        <script>
            function togglePassword(fieldId, iconId) {
                var pwd = document.getElementById(fieldId);
                var icon = document.getElementById(iconId);
                if (pwd.type === 'password') {
                    pwd.type = 'text';
                    icon.textContent = '🙈';
                } else {
                    pwd.type = 'password';
                    icon.textContent = '👁️';
                }
            }

            // Indicateur de force du mot de passe
            var passwordInput = document.getElementById('password-new');
            if (passwordInput) {
                passwordInput.addEventListener('input', function() {
                    var val = this.value;
                    var strength = 0;
                    if (val.length >= 8) strength++;
                    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) strength++;
                    if (/\d/.test(val)) strength++;
                    if (/[^a-zA-Z0-9]/.test(val)) strength++;

                    var bars = ['bar1', 'bar2', 'bar3', 'bar4'];
                    var colors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
                    var texts = ['Faible', 'Moyen', 'Bon', 'Excellent'];

                    for (var i = 0; i < 4; i++) {
                        var bar = document.getElementById(bars[i]);
                        if (i < strength) {
                            bar.style.background = colors[strength - 1];
                            bar.style.opacity = '1';
                        } else {
                            bar.style.background = '#e2e8f0';
                            bar.style.opacity = '1';
                        }
                    }

                    var textEl = document.getElementById('strength-text');
                    if (val.length === 0) {
                        textEl.textContent = '';
                    } else {
                        textEl.textContent = texts[strength - 1] || 'Très faible';
                        textEl.style.color = colors[strength - 1] || '#ef4444';
                    }
                });
            }
        </script>
    </#if>
</@layout.registrationLayout>

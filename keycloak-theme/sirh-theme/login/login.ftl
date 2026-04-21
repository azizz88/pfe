<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed; section>

    <#if section = "form">
        <div id="kc-custom-login">
            <!-- Logo et titre -->
            <div class="login-brand">
                <div class="login-logo">🏢</div>
                <h1 class="login-title">SIRH</h1>
                <p class="login-subtitle">Système d'Information des Ressources Humaines</p>
            </div>

            <!-- Messages d'erreur -->
            <#if messagesPerField.existsError('username','password')>
                <div class="alert alert-error">
                    <span class="alert-icon">⚠️</span>
                    ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
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

            <!-- Formulaire de connexion -->
            <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                <div class="form-group">
                    <label for="username" class="form-label">
                        <span class="label-icon">👤</span>
                        Nom d'utilisateur ou email
                    </label>
                    <input tabindex="1" id="username" class="form-input" name="username"
                           value="${(login.username!'')}"
                           type="text" autofocus autocomplete="off"
                           placeholder="Entrez votre identifiant"
                           aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" />
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">
                        <span class="label-icon">🔒</span>
                        Mot de passe
                    </label>
                    <div class="password-wrapper">
                        <input tabindex="2" id="password" class="form-input" name="password"
                               type="password" autocomplete="off"
                               placeholder="Entrez votre mot de passe"
                               aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" />
                        <button type="button" class="toggle-password" onclick="togglePassword()" tabindex="5">
                            <span id="eye-icon">👁️</span>
                        </button>
                    </div>
                </div>

                <#if realm.rememberMe && !usernameEditDisabled??>
                    <div class="form-options">
                        <label class="remember-me">
                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"
                                <#if login.rememberMe??>checked</#if>>
                            <span class="checkmark"></span>
                            Se souvenir de moi
                        </label>
                    </div>
                </#if>

                <div class="form-actions">
                    <input type="hidden" id="id-hidden-input" name="credentialId"
                           <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                    <button tabindex="4" class="login-button" name="login" id="kc-login" type="submit">
                        Se connecter
                        <span class="btn-arrow">→</span>
                    </button>
                </div>

                <#if realm.resetPasswordAllowed>
                    <div class="forgot-password">
                        <a tabindex="6" href="${url.loginResetCredentialsUrl}">
                            🔑 Mot de passe oublié ?
                        </a>
                    </div>
                </#if>
            </form>

            <!-- Footer -->
            <div class="login-footer">
                <p>© 2026 SIRH — Plateforme RH Sécurisée</p>
            </div>
        </div>

        <script>
            function togglePassword() {
                var pwd = document.getElementById('password');
                var icon = document.getElementById('eye-icon');
                if (pwd.type === 'password') {
                    pwd.type = 'text';
                    icon.textContent = '🙈';
                } else {
                    pwd.type = 'password';
                    icon.textContent = '👁️';
                }
            }
        </script>
    </#if>

</@layout.registrationLayout>

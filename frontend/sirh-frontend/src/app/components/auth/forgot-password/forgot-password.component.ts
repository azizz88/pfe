import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-shell">
      <aside class="brand-panel">
        <div class="brand-inner">
          <div class="brand-logo">SIRH</div>
          <h2>Plateforme RH Sécurisée</h2>
          <p>
            Gestion des employés, départements, contrats et recrutement
            au sein d'une seule interface unifiée.
          </p>
          <div class="brand-footer">© 2026 SIRH</div>
        </div>
      </aside>

      <section class="form-panel">
        <div class="card">
          <ng-container *ngIf="!submitted; else successTpl">
            <header class="card-header">
              <div class="icon-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h1>Réinitialiser votre mot de passe</h1>
              <p>
                Saisissez l'adresse email associée à votre compte SIRH.
                Nous vous enverrons un lien sécurisé pour définir un nouveau
                mot de passe.
              </p>
            </header>

            <form #form="ngForm" (ngSubmit)="submit(form)" novalidate>
              <div class="field">
                <label for="email">Adresse email professionnelle</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  [(ngModel)]="email"
                  required
                  email
                  #emailCtrl="ngModel"
                  placeholder="prenom.nom@entreprise.com"
                  autocomplete="email"
                  [disabled]="loading"
                />
                <div class="field-error"
                     *ngIf="emailCtrl.invalid && emailCtrl.touched">
                  Veuillez saisir une adresse email valide.
                </div>
              </div>

              <button type="submit" class="primary-btn"
                      [disabled]="form.invalid || loading">
                <span *ngIf="!loading">Envoyer le lien de réinitialisation</span>
                <span *ngIf="loading" class="btn-loading">
                  <span class="spinner"></span> Envoi en cours…
                </span>
              </button>

              <a class="back-link" href="/">← Retour à la connexion</a>
            </form>
          </ng-container>

          <ng-template #successTpl>
            <div class="success-state">
              <div class="success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h1>Email envoyé</h1>
              <p>{{ message }}</p>
              <div class="info-box">
                <strong>Prochaine étape :</strong> ouvrez votre boîte mail
                et cliquez sur le lien reçu. Il expirera dans quelques minutes.
              </div>
              <a class="back-link" href="/">← Retour à la connexion</a>
            </div>
          </ng-template>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .auth-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
    }

    .brand-panel {
      background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }
    .brand-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 20% 30%, rgba(59,130,246,0.12) 0, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(59,130,246,0.08) 0, transparent 40%);
      pointer-events: none;
    }
    .brand-inner { position: relative; max-width: 420px; }
    .brand-logo {
      font-size: 34px;
      font-weight: 700;
      letter-spacing: 4px;
      border: 2px solid rgba(255,255,255,0.25);
      display: inline-block;
      padding: 8px 18px;
      border-radius: 8px;
      margin-bottom: 36px;
    }
    .brand-inner h2 {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 14px;
      line-height: 1.2;
    }
    .brand-inner p {
      color: rgba(255,255,255,0.75);
      line-height: 1.6;
      font-size: 15px;
      margin: 0;
    }
    .brand-footer {
      position: absolute;
      bottom: -220px;
      left: 0;
      color: rgba(255,255,255,0.5);
      font-size: 12px;
    }

    .form-panel {
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 1px 3px rgba(15,23,42,0.04),
                  0 8px 24px rgba(15,23,42,0.04);
    }

    .card-header { margin-bottom: 28px; }
    .icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #eff6ff;
      color: #1e3a5f;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }
    .card-header h1 {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 10px;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .card-header p {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    .field { margin-bottom: 22px; }
    .field label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
    }
    .field input {
      width: 100%;
      padding: 11px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      background: #fff;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }
    .field input::placeholder { color: #94a3b8; }
    .field input:focus {
      outline: none;
      border-color: #1e3a5f;
      box-shadow: 0 0 0 3px rgba(30,58,95,0.1);
    }
    .field input:disabled { background: #f1f5f9; color: #64748b; }
    .field-error {
      color: #dc2626;
      font-size: 12.5px;
      margin-top: 6px;
    }

    .primary-btn {
      width: 100%;
      padding: 12px 16px;
      background: #1e3a5f;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.05s;
      font-family: inherit;
    }
    .primary-btn:hover:not(:disabled) { background: #17304f; }
    .primary-btn:active:not(:disabled) { transform: translateY(1px); }
    .primary-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .btn-loading {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .back-link {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: #1e3a5f;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }

    .success-state { text-align: center; }
    .success-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #dcfce7;
      color: #15803d;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }
    .success-state h1 {
      font-size: 22px;
      margin: 0 0 10px;
      color: #0f172a;
      font-weight: 600;
    }
    .success-state p {
      color: #64748b;
      line-height: 1.6;
      font-size: 14px;
      margin: 0 0 20px;
    }
    .info-box {
      background: #f1f5f9;
      border-left: 3px solid #1e3a5f;
      border-radius: 6px;
      padding: 14px 16px;
      text-align: left;
      font-size: 13px;
      line-height: 1.5;
      color: #334155;
      margin-bottom: 20px;
    }

    @media (max-width: 900px) {
      .auth-shell { grid-template-columns: 1fr; }
      .brand-panel {
        padding: 32px;
        min-height: 180px;
      }
      .brand-inner h2 { font-size: 22px; }
      .brand-footer { display: none; }
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  submitted = false;
  message = '';

  constructor(private authService: AuthService) {}

  submit(form: NgForm): void {
    if (form.invalid || this.loading) return;
    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.message = res.message;
        this.submitted = true;
        this.loading = false;
      },
      error: () => {
        this.message = 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.';
        this.submitted = true;
        this.loading = false;
      }
    });
  }
}

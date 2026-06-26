import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="auth-shell">
      <aside class="brand-panel">
        <div class="brand-inner">
          <div class="brand-logo">
            <span class="brand-mark">SIRH</span>
            <span class="brand-caption">Ressources Humaines</span>
          </div>
          <h2>Une plateforme RH unifiée et sécurisée</h2>
          <p>
            Employés, départements, contrats, recrutement et formation
            réunis dans une seule interface, pensée pour les équipes RH.
          </p>
          <ul class="brand-points">
            <li>Gestion centralisée des dossiers collaborateurs</li>
            <li>Suivi du recrutement et de la mobilité interne</li>
            <li>Accès contrôlé par rôle et authentification Keycloak</li>
          </ul>
          <div class="brand-footer">© 2026 SIRH — Arab Soft</div>
        </div>
      </aside>

      <section class="form-panel">
        <div class="auth-card">
          <ng-container *ngIf="!submitted; else successTpl">
            <header class="auth-card__head">
              <div class="auth-badge" aria-hidden="true">
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
                <label class="label" for="email">Adresse email professionnelle</label>
                <input
                  id="email"
                  class="input"
                  name="email"
                  type="email"
                  [(ngModel)]="email"
                  required
                  email
                  #emailCtrl="ngModel"
                  [class.input--invalid]="emailCtrl.invalid && emailCtrl.touched"
                  [attr.aria-invalid]="emailCtrl.invalid && emailCtrl.touched"
                  aria-describedby="email-error"
                  placeholder="prenom.nom@entreprise.com"
                  autocomplete="email"
                  [disabled]="loading"
                />
                <div id="email-error" class="field-error" role="alert"
                     *ngIf="emailCtrl.invalid && emailCtrl.touched">
                  <app-icon name="alert" [size]="14" />
                  Veuillez saisir une adresse email valide.
                </div>
              </div>

              <button type="submit" class="btn btn--primary btn--block btn--lg"
                      [disabled]="form.invalid || loading" [attr.aria-busy]="loading">
                <span *ngIf="!loading">Envoyer le lien de réinitialisation</span>
                <span *ngIf="loading" class="btn-loading">
                  <span class="spinner spinner--light"></span> Envoi en cours…
                </span>
              </button>

              <a class="back-link" href="/">
                <app-icon name="arrow-right" [size]="15" class="back-link__ic" />
                Retour à la connexion
              </a>
            </form>
          </ng-container>

          <ng-template #successTpl>
            <div class="success-state" role="status" aria-live="polite">
              <div class="success-icon" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h1>Email envoyé</h1>
              <p>{{ message }}</p>
              <div class="alert alert--info">
                <app-icon name="info" [size]="18" class="alert__icon" />
                <span><strong>Prochaine étape :</strong> ouvrez votre boîte mail
                et cliquez sur le lien reçu. Il expirera dans quelques minutes.</span>
              </div>
              <a class="back-link" href="/">
                <app-icon name="arrow-right" [size]="15" class="back-link__ic" />
                Retour à la connexion
              </a>
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
      grid-template-columns: 1.05fr 1fr;
      min-height: 100vh;
      color: var(--c-ink);
    }

    /* ---- Panneau de marque (navy plat, sans dégradé criard) ---- */
    .brand-panel {
      background: var(--c-nav-bg);
      color: #fff;
      display: flex;
      align-items: center;
      padding: 56px;
      position: relative;
      overflow: hidden;
    }
    .brand-panel::before {
      content: '';
      position: absolute; inset: 0;
      background-image: radial-gradient(circle at 85% 15%, rgba(255,255,255,.05) 0, transparent 45%);
      pointer-events: none;
    }
    .brand-inner { position: relative; max-width: 440px; }
    .brand-logo { margin-bottom: 40px; }
    .brand-mark {
      display: inline-block;
      font-size: 30px; font-weight: 700; letter-spacing: 3px;
      border: 1.5px solid rgba(255,255,255,.28);
      padding: 8px 18px; border-radius: var(--r-md);
    }
    .brand-caption {
      display: block; margin-top: 12px;
      font-size: 13px; letter-spacing: .14em; text-transform: uppercase;
      color: rgba(255,255,255,.5);
    }
    .brand-inner h2 { font-size: 26px; font-weight: 650; margin: 0 0 14px; line-height: 1.25; color: #fff; }
    .brand-inner > p { color: rgba(255,255,255,.72); line-height: 1.65; font-size: 15px; margin: 0 0 28px; }
    .brand-points { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .brand-points li {
      position: relative; padding-left: 26px;
      color: rgba(255,255,255,.82); font-size: 14px; line-height: 1.5;
    }
    .brand-points li::before {
      content: ''; position: absolute; left: 0; top: 6px;
      width: 14px; height: 8px; border-left: 2px solid var(--c-accent); border-bottom: 2px solid var(--c-accent);
      transform: rotate(-45deg);
    }
    .brand-footer { margin-top: 40px; color: rgba(255,255,255,.4); font-size: 12px; }

    /* ---- Panneau formulaire ---- */
    .form-panel {
      background: var(--c-bg);
      display: flex; align-items: center; justify-content: center;
      padding: 48px 32px;
    }
    .auth-card {
      background: var(--c-surface);
      border-radius: var(--r-lg);
      border: 1px solid var(--c-border);
      padding: 40px;
      width: 100%; max-width: 440px;
      box-shadow: var(--sh-md);
    }

    .auth-card__head { margin-bottom: 26px; }
    .auth-badge {
      width: 44px; height: 44px; border-radius: var(--r-md);
      background: var(--c-brand-soft); color: var(--c-brand);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
    }
    .auth-card__head h1 { font-size: 21px; font-weight: 650; margin: 0 0 10px; color: var(--c-ink); }
    .auth-card__head p { font-size: 14px; color: var(--c-muted); line-height: 1.6; margin: 0; }

    .field { margin-bottom: 22px; }

    .btn-loading { display: inline-flex; align-items: center; gap: 8px; }

    .back-link {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin-top: 20px; color: var(--c-brand); font-size: 13px; font-weight: 500; text-decoration: none;
    }
    .back-link:hover { color: var(--c-brand-strong); text-decoration: underline; }
    .back-link__ic { transform: rotate(180deg); }

    .success-state { text-align: center; }
    .success-icon {
      width: 54px; height: 54px; border-radius: var(--r-pill);
      background: var(--c-success-soft); color: var(--c-success-ink);
      display: inline-flex; align-items: center; justify-content: center; margin-bottom: 18px;
    }
    .success-state h1 { font-size: 21px; margin: 0 0 10px; color: var(--c-ink); font-weight: 650; }
    .success-state p { color: var(--c-muted); line-height: 1.6; font-size: 14px; margin: 0 0 20px; }
    .success-state .alert { text-align: left; margin-bottom: 20px; }

    @media (max-width: 900px) {
      .auth-shell { grid-template-columns: 1fr; }
      .brand-panel { padding: 36px 28px; }
      .brand-logo { margin-bottom: 24px; }
      .brand-inner h2 { font-size: 22px; }
      .brand-points, .brand-footer { display: none; }
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

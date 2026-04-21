import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Composant "Mon Profil".
 * L'employé peut voir ses informations (lecture seule) et modifier son mot de passe.
 */
@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page">
      <h1>👤 Mon Profil</h1>

      <div class="profile-layout">
        <!-- Carte profil -->
        <div class="profile-card">
          <div class="profile-avatar">
            <div class="avatar-circle">
              {{ getInitials() }}
            </div>
            <h2>{{ profile?.firstName }} {{ profile?.lastName }}</h2>
            <span class="role-badge">{{ keycloakService.isHrAdmin() ? 'RH Admin' : 'Employé' }}</span>
          </div>

          <div class="profile-details">
            <h3>📋 Informations personnelles</h3>

            <div class="detail-row">
              <label>Matricule</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.matricule || keycloakService.getUserName() }}
              </div>
            </div>

            <div class="detail-row">
              <label>Nom complet</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.firstName }} {{ profile?.lastName }}
              </div>
            </div>

            <div class="detail-row">
              <label>Email</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.email || keycloakService.getEmail() }}
              </div>
            </div>

            <div class="detail-row" *ngIf="profile?.poste">
              <label>Poste</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.poste }}
              </div>
            </div>

            <div class="detail-row" *ngIf="profile?.departmentName">
              <label>Département</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.departmentName }}
              </div>
            </div>

            <div class="detail-row" *ngIf="profile?.serviceName">
              <label>Service</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.serviceName }}
              </div>
            </div>

            <div class="detail-row" *ngIf="profile?.dateEmbauche">
              <label>Date d'embauche</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.dateEmbauche }}
              </div>
            </div>

            <div class="detail-row" *ngIf="profile?.telephone">
              <label>Téléphone</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.telephone }}
              </div>
            </div>

            <div class="readonly-notice">
              <span>ℹ️</span>
              Les informations ci-dessus sont gérées par le service RH et ne peuvent pas être modifiées. 
              Seul votre mot de passe peut être changé.
            </div>
          </div>
        </div>

        <!-- Carte mot de passe -->
        <div class="password-card">
          <h3>🔑 Sécurité du compte</h3>
          <p class="security-desc">
            Vous pouvez modifier votre mot de passe à tout moment pour sécuriser votre compte.
          </p>

          <button class="change-password-btn" (click)="changePassword()">
            🔒 Modifier mon mot de passe
            <span class="btn-arrow">→</span>
          </button>

          <div class="security-tips">
            <h4>💡 Conseils de sécurité</h4>
            <ul>
              <li>Utilisez au moins 8 caractères</li>
              <li>Incluez des majuscules et minuscules</li>
              <li>Ajoutez des chiffres et caractères spéciaux</li>
              <li>Ne réutilisez pas un ancien mot de passe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page h1 { color: #1e3a5f; margin: 0 0 24px 0; }

    .profile-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      align-items: start;
    }

    .profile-card, .password-card {
      background: white;
      border-radius: 16px;
      padding: 28px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    /* --- Avatar --- */
    .profile-avatar {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 24px;
    }

    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a5f, #3b82f6);
      color: white;
      font-size: 1.8rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }

    .profile-avatar h2 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-size: 1.3rem;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 14px;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #1d4ed8;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* --- Details --- */
    .profile-details h3 {
      color: #1e3a5f;
      margin: 0 0 16px 0;
      font-size: 1rem;
    }

    .detail-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f8fafc;
    }

    .detail-row:last-of-type {
      border-bottom: none;
    }

    .detail-row label {
      width: 140px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      flex-shrink: 0;
    }

    .detail-value {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      color: #1e293b;
      background: #f8fafc;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
      flex: 1;
    }

    .lock-icon {
      font-size: 0.7rem;
      opacity: 0.5;
    }

    .readonly-notice {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 20px;
      padding: 12px 16px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      font-size: 0.8rem;
      color: #0369a1;
      line-height: 1.5;
    }

    /* --- Password card --- */
    .password-card h3 {
      color: #1e3a5f;
      margin: 0 0 8px 0;
      font-size: 1rem;
    }

    .security-desc {
      color: #64748b;
      font-size: 0.85rem;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }

    .change-password-btn {
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(135deg, #1e3a5f, #2d5a87);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .change-password-btn:hover {
      background: linear-gradient(135deg, #2d5a87, #3b82f6);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(30, 58, 95, 0.3);
    }

    .btn-arrow {
      transition: transform 0.3s;
    }

    .change-password-btn:hover .btn-arrow {
      transform: translateX(4px);
    }

    .security-tips {
      margin-top: 24px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .security-tips h4 {
      margin: 0 0 10px 0;
      font-size: 0.85rem;
      color: #475569;
    }

    .security-tips ul {
      margin: 0;
      padding: 0 0 0 20px;
    }

    .security-tips li {
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 6px;
      line-height: 1.4;
    }

    /* --- Responsive --- */
    @media (max-width: 900px) {
      .profile-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MyProfileComponent implements OnInit {
  profile: any = null;

  constructor(
    public keycloakService: KeycloakService,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.employeeApi.getMyProfile().subscribe({
      next: (data) => this.profile = data,
      error: () => {
        // Si pas de profil en base, utiliser les données Keycloak
        this.profile = {
          firstName: this.keycloakService.keycloak.tokenParsed?.['given_name'] || '',
          lastName: this.keycloakService.keycloak.tokenParsed?.['family_name'] || '',
          email: this.keycloakService.getEmail(),
          matricule: this.keycloakService.getUserName()
        };
      }
    });
  }

  getInitials(): string {
    const first = this.profile?.firstName?.charAt(0) || '';
    const last = this.profile?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  /** Ouvre le formulaire Keycloak de changement de mot de passe, puis redirige vers l'app */
  changePassword(): void {
    this.keycloakService.keycloak.login({
      action: 'UPDATE_PASSWORD',
      redirectUri: window.location.origin + '/employee/profile'
    });
  }
}

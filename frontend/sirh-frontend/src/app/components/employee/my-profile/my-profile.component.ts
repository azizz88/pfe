import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Composant "Mon Profil".
 * - Informations administratives (lecture seule).
 * - Liste simple de l'historique des postes occupés (PositionHistory).
 * - Modification du mot de passe via Keycloak.
 */
@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Mon profil</h1>
          <p class="page-header__sub">Vos informations administratives et la sécurité de votre compte.</p>
        </div>
      </div>

      <div class="profile-layout">
        <!-- Carte profil -->
        <div class="card">
          <div class="card__body">
            <div class="profile-id">
              <span class="avatar avatar--lg avatar--round">{{ getInitials() }}</span>
              <div>
                <h2 class="profile-id__name">{{ profile?.firstName }} {{ profile?.lastName }}</h2>
                <span class="badge badge--accent">{{ keycloakService.isHrAdmin() ? 'RH Admin' : 'Employé' }}</span>
              </div>
            </div>

            <div class="section-title" style="margin-top: var(--sp-5)">Informations personnelles</div>

            <dl class="dl profile-dl">
              <dt>Matricule</dt>
              <dd><app-icon name="lock" [size]="13" class="lock" /> {{ profile?.matricule || keycloakService.getUserName() }}</dd>
              <dt>Nom complet</dt>
              <dd><app-icon name="lock" [size]="13" class="lock" /> {{ profile?.firstName }} {{ profile?.lastName }}</dd>
              <dt>Email</dt>
              <dd><app-icon name="lock" [size]="13" class="lock" /> {{ profile?.email || keycloakService.getEmail() }}</dd>
              <ng-container *ngIf="profile?.poste || profile?.position">
                <dt>Poste actuel</dt>
                <dd><app-icon name="lock" [size]="13" class="lock" /> {{ profile?.poste || profile?.position }}</dd>
              </ng-container>
              <ng-container *ngIf="profile?.departmentName">
                <dt>Département</dt>
                <dd><app-icon name="lock" [size]="13" class="lock" /> {{ profile?.departmentName }}</dd>
              </ng-container>
              <ng-container *ngIf="profile?.serviceName">
                <dt>Service</dt>
                <dd><app-icon name="lock" [size]="13" class="lock" /> {{ profile?.serviceName }}</dd>
              </ng-container>
              <ng-container *ngIf="profile?.dateEmbauche || profile?.hireDate">
                <dt>Date d'embauche</dt>
                <dd><app-icon name="lock" [size]="13" class="lock" /> {{ profile?.dateEmbauche || profile?.hireDate }}</dd>
              </ng-container>
              <ng-container *ngIf="profile?.telephone">
                <dt>Téléphone</dt>
                <dd><app-icon name="lock" [size]="13" class="lock" /> {{ profile?.telephone }}</dd>
              </ng-container>
            </dl>

            <div class="alert alert--info" style="margin-top: var(--sp-5)">
              <app-icon name="info" [size]="18" class="alert__icon" />
              <span>Ces informations sont gérées par le service RH et ne peuvent pas être modifiées. Seul votre mot de passe peut être changé.</span>
            </div>
          </div>
        </div>

        <!-- Carte sécurité -->
        <div class="card">
          <div class="card__header"><span class="card__title"><app-icon name="lock" [size]="17" /> Sécurité du compte</span></div>
          <div class="card__body">
            <p class="u-muted" style="margin-bottom: var(--sp-4); font-size: var(--fs-14)">
              Modifiez votre mot de passe à tout moment pour sécuriser votre compte.
            </p>

            <button class="btn btn--primary btn--block" (click)="changePassword()">
              <app-icon name="lock" [size]="17" /> Modifier mon mot de passe
            </button>

            <div class="tips">
              <p class="u-eyebrow" style="margin-bottom: var(--sp-2)">Conseils de sécurité</p>
              <ul>
                <li>Utilisez au moins 8 caractères</li>
                <li>Incluez des majuscules et des minuscules</li>
                <li>Ajoutez des chiffres et caractères spéciaux</li>
                <li>Ne réutilisez pas un ancien mot de passe</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Historique des postes -->
      <div class="card" style="margin-top: var(--sp-5)">
        <div class="card__header"><span class="card__title"><app-icon name="list" [size]="17" /> Historique des postes</span></div>
        <div class="card__body" *ngIf="history.length === 0; else histTable">
          <div class="empty-state">
            <span class="empty-state__icon"><app-icon name="list" [size]="24" /></span>
            <span class="empty-state__text">Aucun historique de poste pour le moment.</span>
          </div>
        </div>
        <ng-template #histTable>
          <div class="table-wrap" style="border: none; border-radius: 0">
            <table class="data-table">
              <thead>
                <tr><th>Poste</th><th>Département</th><th>Du</th><th>Au</th><th>Motif</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let entry of history" [class.current-row]="!entry.endDate">
                  <td class="cell-strong">{{ entry.position }}</td>
                  <td>
                    {{ entry.departmentName || '—' }}
                    <span *ngIf="entry.serviceName" class="u-faint"> · {{ entry.serviceName }}</span>
                  </td>
                  <td class="u-mono">{{ formatDate(entry.startDate) }}</td>
                  <td>
                    <span *ngIf="entry.endDate" class="u-mono">{{ formatDate(entry.endDate) }}</span>
                    <span *ngIf="!entry.endDate" class="badge badge--success">Poste actuel</span>
                  </td>
                  <td>{{ reasonLabel(entry.reason) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .profile-layout { display: grid; grid-template-columns: 2fr 1fr; gap: var(--sp-5); align-items: start; }

    .profile-id { display: flex; align-items: center; gap: var(--sp-4); }
    .profile-id .avatar { background: var(--c-accent); color: #fff; }
    .profile-id__name { margin: 0 0 6px; font-size: var(--fs-20); }

    .profile-dl { grid-template-columns: minmax(130px, max-content) 1fr; row-gap: var(--sp-3); }
    .profile-dl dt { align-self: center; }
    .profile-dl dd { display: flex; align-items: center; gap: 7px; }
    .lock { color: var(--c-faint); }

    .tips { margin-top: var(--sp-5); padding: var(--sp-4); background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--r-md); }
    .tips ul { margin: 0; padding-left: 18px; }
    .tips li { font-size: var(--fs-13); color: var(--c-muted); margin-bottom: 5px; line-height: 1.45; }

    .data-table tbody tr.current-row td { background: var(--c-success-soft); }
    .data-table tbody tr.current-row:hover td { background: var(--c-success-soft); }

    @media (max-width: 900px) {
      .profile-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class MyProfileComponent implements OnInit {
  profile: any = null;
  history: any[] = [];

  constructor(
    public keycloakService: KeycloakService,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadHistory();
  }

  loadProfile(): void {
    this.employeeApi.getMyProfile().subscribe({
      next: (data) => this.profile = data,
      error: () => {
        this.profile = {
          firstName: this.keycloakService.keycloak.tokenParsed?.['given_name'] || '',
          lastName: this.keycloakService.keycloak.tokenParsed?.['family_name'] || '',
          email: this.keycloakService.getEmail(),
          matricule: this.keycloakService.getUserName()
        };
      }
    });
  }

  loadHistory(): void {
    this.employeeApi.getMyPositionHistory().subscribe({
      next: (data) => this.history = data || [],
      error: () => this.history = []
    });
  }

  getInitials(): string {
    const first = this.profile?.firstName?.charAt(0) || '';
    const last = this.profile?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  reasonLabel(reason?: string): string {
    switch ((reason || '').toUpperCase()) {
      case 'HIRE': return 'Embauche';
      case 'PROMOTION': return 'Promotion';
      case 'MOBILITY': return 'Mobilité';
      case 'REASSIGNMENT': return 'Réaffectation';
      default: return reason || '—';
    }
  }

  /** Ouvre le formulaire Keycloak de changement de mot de passe, puis redirige vers l'app. */
  changePassword(): void {
    this.keycloakService.keycloak.login({
      action: 'UPDATE_PASSWORD',
      redirectUri: window.location.origin + '/employee/profile'
    });
  }
}

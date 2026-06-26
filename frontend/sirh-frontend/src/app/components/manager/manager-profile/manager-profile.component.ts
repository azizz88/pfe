import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { forkJoin } from 'rxjs';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Profil de l'espace Manager.
 * - Identité (lecture seule + changement mot de passe).
 * - Département(s) géré(s).
 * - Indicateurs personnels (entretiens, promotions validées, refus, etc.).
 * - Historique de mes décisions d'entretien (table simple).
 * - Mon parcours (PositionHistory de l'employé sous-jacent).
 */
@Component({
  selector: 'app-manager-profile',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="page profile-page">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Mon profil</h1>
          <span class="page-header__sub">Espace manager</span>
        </div>
      </div>

      <div class="profile-layout">
        <!-- Carte profil + informations -->
        <div class="card">
          <div class="card__body">
            <div class="profile-id">
              <div class="avatar avatar--lg avatar--round">{{ initials() }}</div>
              <div>
                <h2 class="profile-name">{{ profile?.firstName }} {{ profile?.lastName }}</h2>
                <span class="badge badge--accent">Manager</span>
              </div>
            </div>

            <div class="section-title">Informations personnelles</div>
            <dl class="dl">
              <dt>Matricule</dt>
              <dd class="locked"><app-icon name="lock" [size]="13" /> {{ profile?.matricule || keycloak.getUserName() }}</dd>

              <dt>Nom complet</dt>
              <dd class="locked"><app-icon name="lock" [size]="13" /> {{ profile?.firstName }} {{ profile?.lastName }}</dd>

              <dt>Email</dt>
              <dd class="locked"><app-icon name="lock" [size]="13" /> {{ profile?.email || keycloak.getEmail() }}</dd>

              <ng-container *ngIf="profile?.position">
                <dt>Poste actuel</dt>
                <dd class="locked"><app-icon name="lock" [size]="13" /> {{ profile?.position }}</dd>
              </ng-container>

              <ng-container *ngIf="profile?.hireDate">
                <dt>Date d'embauche</dt>
                <dd class="locked"><app-icon name="lock" [size]="13" /> {{ profile?.hireDate }}</dd>
              </ng-container>
            </dl>
          </div>
        </div>

        <!-- Colonne latérale : département + sécurité -->
        <div class="side-col">
          <div class="card">
            <div class="card__header"><div class="card__title">Département(s) géré(s)</div></div>
            <div class="card__body">
              <div *ngIf="!team?.departments?.length" class="empty-mini">
                Aucun département à votre charge.
              </div>
              <div *ngFor="let d of team?.departments || []" class="dept-item">
                <div class="dept-name"><app-icon name="department" [size]="15" /> {{ d.name }}</div>
                <div class="dept-meta"><app-icon name="team" [size]="14" /> {{ d.employeeCount }} employé(s)</div>
                <div class="dept-desc" *ngIf="d.description">{{ d.description }}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__header"><div class="card__title">Sécurité</div></div>
            <div class="card__body">
              <p class="help">Vous serez redirigé vers Keycloak pour modifier votre mot de passe en toute sécurité.</p>
              <button class="btn btn--primary btn--block" (click)="changePassword()">
                <app-icon name="lock" [size]="16" />
                Modifier mon mot de passe
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Indicateurs personnels -->
      <section class="block" *ngIf="stats">
        <div class="section-title">Mon activité</div>
        <div class="grid grid--kpi">
          <div class="stat">
            <div class="stat__icon"><app-icon name="interview" [size]="20" /></div>
            <div class="stat__body"><div class="stat__value">{{ stats.total || 0 }}</div><div class="stat__label">Entretiens totaux</div></div>
          </div>
          <div class="stat">
            <div class="stat__icon"><app-icon name="check" [size]="20" /></div>
            <div class="stat__body"><div class="stat__value">{{ stats.completed || 0 }}</div><div class="stat__label">Réalisés</div></div>
          </div>
          <div class="stat">
            <div class="stat__icon is-ok"><app-icon name="promoted" [size]="20" /></div>
            <div class="stat__body"><div class="stat__value">{{ stats.positive || 0 }}</div><div class="stat__label">Promotions validées</div></div>
          </div>
          <div class="stat">
            <div class="stat__icon is-danger"><app-icon name="reject" [size]="20" /></div>
            <div class="stat__body"><div class="stat__value">{{ stats.negative || 0 }}</div><div class="stat__label">Refus</div></div>
          </div>
          <div class="stat">
            <div class="stat__icon"><app-icon name="formation" [size]="20" /></div>
            <div class="stat__body"><div class="stat__value">{{ stats.trainingRecommended || 0 }}</div><div class="stat__label">Formations recommandées</div></div>
          </div>
          <div class="stat">
            <div class="stat__icon"><app-icon name="chart" [size]="20" /></div>
            <div class="stat__body"><div class="stat__value">{{ stats.acceptanceRate || 0 }}%</div><div class="stat__label">Taux d'acceptation</div></div>
          </div>
        </div>
      </section>

      <!-- Historique des décisions -->
      <section class="block">
        <div class="section-title">Mes décisions d'entretien</div>
        <div *ngIf="!decidedInterviews.length" class="empty-mini">
          Aucune décision d'entretien finalisée.
        </div>
        <div class="table-wrap" *ngIf="decidedInterviews.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Candidat</th>
                <th>Offre</th>
                <th>Type</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let it of decidedInterviews">
                <td>{{ formatDate(it.scheduledDate || it.assignedAt) }}</td>
                <td class="cell-strong">{{ it.candidateName || '—' }}</td>
                <td>{{ it.jobOfferTitle || '—' }}</td>
                <td>
                  <span class="type-pill" [class.ext]="it.candidateType === 'EXTERNAL'">
                    {{ it.candidateType === 'EXTERNAL' ? 'Externe' : 'Interne' }}
                  </span>
                </td>
                <td>
                  <span class="result-pill"
                        [class.pos]="it.result === 'POSITIF'"
                        [class.neg]="it.result === 'NEGATIF' || it.result === 'NÉGATIF'"
                        [class.mid]="it.result === 'EN_COURS'">
                    {{ resultLabel(it.result) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Historique des postes -->
      <section class="block">
        <div class="section-title">Mon parcours</div>
        <div *ngIf="!history.length" class="empty-mini">
          Aucun historique de poste pour le moment.
        </div>
        <div class="table-wrap" *ngIf="history.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Poste</th>
                <th>Département</th>
                <th>Du</th>
                <th>Au</th>
                <th>Motif</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of history" [class.current-row]="!entry.endDate">
                <td class="cell-strong">{{ entry.position }}</td>
                <td>
                  {{ entry.departmentName || '—' }}
                  <span *ngIf="entry.serviceName" class="service-small"> · {{ entry.serviceName }}</span>
                </td>
                <td>{{ formatDate(entry.startDate) }}</td>
                <td>
                  <span *ngIf="entry.endDate">{{ formatDate(entry.endDate) }}</span>
                  <span *ngIf="!entry.endDate" class="badge badge--success">Poste actuel</span>
                </td>
                <td>{{ reasonLabel(entry.reason) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .profile-page { color: var(--c-ink); }

    .profile-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--sp-4);
      align-items: start;
    }
    .side-col { display: flex; flex-direction: column; gap: var(--sp-4); }

    /* Identité */
    .profile-id {
      display: flex; align-items: center; gap: var(--sp-3);
      padding-bottom: var(--sp-4); margin-bottom: var(--sp-4);
      border-bottom: 1px solid var(--c-border);
    }
    .profile-name { font-size: var(--fs-18); margin: 0 0 6px 0; }

    .section-title { margin-bottom: var(--sp-3); }

    .dl dd.locked { display: flex; align-items: center; gap: 6px; }
    .dl dd.locked app-icon { color: var(--c-faint); }

    /* Département */
    .dept-item {
      padding: var(--sp-3);
      background: var(--c-surface-2);
      border: 1px solid var(--c-border);
      border-radius: var(--r-md);
    }
    .dept-item + .dept-item { margin-top: var(--sp-2); }
    .dept-name { display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--c-ink); }
    .dept-meta { display: flex; align-items: center; gap: 6px; font-size: var(--fs-12); color: var(--c-muted); margin-top: 4px; font-weight: 500; }
    .dept-desc { font-size: var(--fs-12); color: var(--c-muted); margin-top: 4px; }

    .help { margin-bottom: var(--sp-3); }

    /* KPI */
    .block { margin-top: var(--sp-6); }
    .stat__icon.is-ok     { background: var(--c-success-soft); color: var(--c-success-ink); }
    .stat__icon.is-danger { background: var(--c-danger-soft);  color: var(--c-danger-ink); }

    /* Tables */
    .data-table tbody tr.current-row td { background: var(--c-success-soft); }
    .service-small { color: var(--c-muted); font-size: var(--fs-12); }

    .type-pill {
      display: inline-flex; align-items: center;
      padding: 2px 9px; border-radius: var(--r-pill);
      font-size: var(--fs-12); font-weight: 600;
      background: var(--c-success-soft); color: var(--c-success-ink);
    }
    .type-pill.ext { background: var(--c-warning-soft); color: var(--c-warning-ink); }

    .result-pill {
      display: inline-flex; align-items: center;
      padding: 2px 9px; border-radius: var(--r-pill);
      font-size: var(--fs-12); font-weight: 700;
      background: var(--c-surface-3); color: var(--c-ink-soft);
    }
    .result-pill.pos { background: var(--c-success-soft); color: var(--c-success-ink); }
    .result-pill.neg { background: var(--c-danger-soft);  color: var(--c-danger-ink); }
    .result-pill.mid { background: var(--c-warning-soft); color: var(--c-warning-ink); }

    /* États vides compacts */
    .empty-mini {
      padding: var(--sp-4); text-align: center;
      color: var(--c-muted); font-size: var(--fs-13);
      background: var(--c-surface-2);
      border: 1px solid var(--c-border);
      border-radius: var(--r-md);
    }

    @media (max-width: 900px) {
      .profile-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ManagerProfileComponent implements OnInit {
  profile: any = null;
  team: any = null;
  stats: any = null;
  history: any[] = [];
  decidedInterviews: any[] = [];

  constructor(
    public keycloak: KeycloakService,
    private employeeApi: EmployeeApiService,
    private recruitmentApi: RecruitmentApiService
  ) {}

  ngOnInit(): void {
    forkJoin({
      profile: this.employeeApi.getMyProfile(),
      team: this.employeeApi.getMyTeam(),
      history: this.employeeApi.getMyPositionHistory(),
      stats: this.recruitmentApi.getManagerStats(),
      interviews: this.recruitmentApi.getMyInterviews()
    }).subscribe({
      next: (res: any) => {
        this.profile = res.profile;
        this.team = res.team;
        this.history = res.history || [];
        this.stats = res.stats;
        // Décisions = entretiens complétés (avec ou sans résultat formel).
        this.decidedInterviews = (res.interviews || [])
          .filter((i: any) => i.status === 'COMPLETED' && i.result)
          .sort((a: any, b: any) => {
            const da = new Date(a.scheduledDate || a.assignedAt || 0).getTime();
            const db = new Date(b.scheduledDate || b.assignedAt || 0).getTime();
            return db - da;
          });
      },
      error: () => {
        // Si /me échoue, on bascule sur les données Keycloak pour ne pas avoir une page vide.
        this.profile = {
          firstName: this.keycloak.keycloak.tokenParsed?.['given_name'] || '',
          lastName: this.keycloak.keycloak.tokenParsed?.['family_name'] || '',
          email: this.keycloak.getEmail(),
          matricule: this.keycloak.getUserName()
        };
      }
    });
  }

  initials(): string {
    const f = (this.profile?.firstName || '').charAt(0);
    const l = (this.profile?.lastName || '').charAt(0);
    return (f + l).toUpperCase() || '?';
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

  resultLabel(r?: string): string {
    switch ((r || '').toUpperCase()) {
      case 'POSITIF': return 'Positif';
      case 'NEGATIF':
      case 'NÉGATIF': return 'Négatif';
      case 'EN_COURS': return 'En cours';
      default: return r || '—';
    }
  }

  changePassword(): void {
    this.keycloak.keycloak.login({
      action: 'UPDATE_PASSWORD',
      redirectUri: window.location.origin + '/manager/profile'
    });
  }
}

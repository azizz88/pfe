import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { forkJoin } from 'rxjs';

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
  imports: [CommonModule],
  template: `
    <div class="profile-page">
      <h1>👤 Mon Profil — Manager</h1>

      <div class="profile-layout">
        <!-- Carte profil + département -->
        <div class="profile-card">
          <div class="profile-avatar">
            <div class="avatar-circle">{{ initials() }}</div>
            <h2>{{ profile?.firstName }} {{ profile?.lastName }}</h2>
            <span class="role-badge">Manager</span>
          </div>

          <div class="profile-details">
            <h3>📋 Informations personnelles</h3>
            <div class="detail-row">
              <label>Matricule</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.matricule || keycloak.getUserName() }}
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
                {{ profile?.email || keycloak.getEmail() }}
              </div>
            </div>
            <div class="detail-row" *ngIf="profile?.position">
              <label>Poste actuel</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.position }}
              </div>
            </div>
            <div class="detail-row" *ngIf="profile?.hireDate">
              <label>Date d'embauche</label>
              <div class="detail-value">
                <span class="lock-icon">🔒</span>
                {{ profile?.hireDate }}
              </div>
            </div>
          </div>
        </div>

        <!-- Carte sécurité + département -->
        <div class="side-col">
          <div class="dept-card">
            <h3>🏢 Département(s) géré(s)</h3>
            <div *ngIf="!team?.departments?.length" class="empty-small">
              Aucun département à votre charge.
            </div>
            <div *ngFor="let d of team?.departments || []" class="dept-item">
              <div class="dept-name">🏗️ {{ d.name }}</div>
              <div class="dept-meta">👥 {{ d.employeeCount }} employé(s)</div>
              <div class="dept-desc" *ngIf="d.description">{{ d.description }}</div>
            </div>
          </div>

          <div class="password-card">
            <h3>🔑 Sécurité</h3>
            <button class="change-pwd-btn" (click)="changePassword()">
              🔒 Modifier mon mot de passe
            </button>
          </div>
        </div>
      </div>

      <!-- Indicateurs personnels -->
      <div class="stats-section" *ngIf="stats">
        <h3>📊 Mon activité</h3>
        <div class="mini-kpi-grid">
          <div class="mini-kpi"><div class="mk-value">{{ stats.total || 0 }}</div><div class="mk-label">Entretiens totaux</div></div>
          <div class="mini-kpi"><div class="mk-value">{{ stats.completed || 0 }}</div><div class="mk-label">Réalisés</div></div>
          <div class="mini-kpi pos"><div class="mk-value">{{ stats.positive || 0 }}</div><div class="mk-label">Promotions validées</div></div>
          <div class="mini-kpi neg"><div class="mk-value">{{ stats.negative || 0 }}</div><div class="mk-label">Refus</div></div>
          <div class="mini-kpi"><div class="mk-value">{{ stats.trainingRecommended || 0 }}</div><div class="mk-label">Formations recommandées</div></div>
          <div class="mini-kpi"><div class="mk-value">{{ stats.acceptanceRate || 0 }}%</div><div class="mk-label">Taux d'acceptation</div></div>
        </div>
      </div>

      <!-- Historique des décisions -->
      <div class="decisions-section">
        <h3>📋 Mes décisions d'entretien</h3>
        <div *ngIf="!decidedInterviews.length" class="empty-small">
          Aucune décision d'entretien finalisée.
        </div>
        <table *ngIf="decidedInterviews.length > 0" class="dec-table">
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
              <td>{{ it.candidateName || '—' }}</td>
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

      <!-- Historique des postes -->
      <div class="history-section">
        <h3>📜 Mon parcours</h3>
        <div *ngIf="!history.length" class="empty-small">
          Aucun historique de poste pour le moment.
        </div>
        <table *ngIf="history.length > 0" class="history-table">
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
              <td><strong>{{ entry.position }}</strong></td>
              <td>
                {{ entry.departmentName || '—' }}
                <span *ngIf="entry.serviceName" class="service-small"> · {{ entry.serviceName }}</span>
              </td>
              <td>{{ formatDate(entry.startDate) }}</td>
              <td>
                <span *ngIf="entry.endDate">{{ formatDate(entry.endDate) }}</span>
                <span *ngIf="!entry.endDate" class="current-tag">Poste actuel</span>
              </td>
              <td>{{ reasonLabel(entry.reason) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .profile-page h1 { color: #1e3a5f; margin: 0 0 24px 0; }

    .profile-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      align-items: start;
      margin-bottom: 20px;
    }
    .profile-card, .dept-card, .password-card,
    .stats-section, .decisions-section, .history-section {
      background: white;
      border-radius: 14px;
      padding: 22px 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .side-col { display: flex; flex-direction: column; gap: 20px; }

    /* Avatar */
    .profile-avatar {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 20px;
    }
    .avatar-circle {
      width: 76px; height: 76px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a5f, #8b5cf6);
      color: white;
      font-size: 1.7rem;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 10px;
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
    }
    .profile-avatar h2 { margin: 0 0 8px 0; color: #1e293b; font-size: 1.2rem; }
    .role-badge {
      display: inline-block;
      padding: 4px 14px;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      color: #5b21b6;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Details */
    .profile-details h3,
    .dept-card h3,
    .password-card h3,
    .stats-section h3,
    .decisions-section h3,
    .history-section h3 {
      color: #1e3a5f;
      margin: 0 0 14px 0;
      font-size: 0.95rem;
    }
    .detail-row {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f8fafc;
    }
    .detail-row:last-of-type { border-bottom: none; }
    .detail-row label {
      width: 130px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
      flex-shrink: 0;
    }
    .detail-value {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.92rem;
      color: #1e293b;
      background: #f8fafc;
      padding: 7px 12px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
      flex: 1;
    }
    .lock-icon { font-size: 0.7rem; opacity: 0.5; }

    /* Département */
    .dept-item {
      padding: 12px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      margin-bottom: 10px;
    }
    .dept-item:last-child { margin-bottom: 0; }
    .dept-name { font-weight: 600; color: #1e3a5f; }
    .dept-meta { font-size: 0.78rem; color: #475569; margin-top: 4px; font-weight: 500; }
    .dept-desc { font-size: 0.78rem; color: #64748b; margin-top: 4px; }

    /* Mot de passe */
    .change-pwd-btn {
      width: 100%;
      padding: 12px 18px;
      background: linear-gradient(135deg, #1e3a5f, #2d5a87);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
    }
    .change-pwd-btn:hover { background: linear-gradient(135deg, #2d5a87, #3b82f6); }

    /* Stats */
    .mini-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }
    .mini-kpi {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }
    .mini-kpi.pos { background: #f0fdf4; border-color: #bbf7d0; }
    .mini-kpi.neg { background: #fef2f2; border-color: #fecaca; }
    .mk-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .mk-label { font-size: 0.72rem; color: #64748b; margin-top: 4px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }

    /* Tables */
    .dec-table, .history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .dec-table thead th,
    .history-table thead th {
      text-align: left;
      padding: 10px 12px;
      background: #f8fafc;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
    }
    .dec-table tbody td,
    .history-table tbody td {
      padding: 11px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .dec-table tbody tr:last-child td,
    .history-table tbody tr:last-child td { border-bottom: none; }
    .history-table tbody tr.current-row td { background: #f0fdf4; }
    .current-tag {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .service-small { color: #64748b; font-size: 0.8rem; }

    .type-pill {
      display: inline-block;
      padding: 2px 9px;
      background: #dcfce7;
      color: #166534;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .type-pill.ext { background: #fef3c7; color: #92400e; }
    .result-pill {
      display: inline-block;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
    }
    .result-pill.pos { background: #dcfce7; color: #166534; }
    .result-pill.neg { background: #fee2e2; color: #991b1b; }
    .result-pill.mid { background: #fef3c7; color: #92400e; }

    .stats-section, .decisions-section, .history-section { margin-top: 20px; }
    .empty-small {
      padding: 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.85rem;
      background: #f8fafc;
      border-radius: 8px;
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
      case 'POSITIF': return '✅ Positif';
      case 'NEGATIF':
      case 'NÉGATIF': return '❌ Négatif';
      case 'EN_COURS': return '⏳ En cours';
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

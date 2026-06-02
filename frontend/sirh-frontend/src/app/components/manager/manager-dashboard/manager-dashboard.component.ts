import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';

/**
 * Dashboard de l'espace Manager.
 * - KPIs d'activité (entretiens à planifier, planifiés, réalisés, taux d'acceptation).
 * - Prochains entretiens (raccourci vers /manager/interviews).
 * - Équipe rattachée au(x) département(s) managé(s).
 * - Activité mensuelle sur 6 mois (mini barres).
 */
@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mgr-dashboard">
      <div class="mgr-header">
        <div>
          <h1>🎙️ Dashboard Manager</h1>
          <p class="mgr-welcome">
            Bienvenue {{ keycloak.getFullName() }}.
            <span *ngIf="team?.manager?.matricule"> Matricule {{ team.manager.matricule }}.</span>
          </p>
        </div>
        <div class="mgr-quick-actions">
          <a routerLink="/manager/interviews" class="qa-btn primary">📅 Mes entretiens</a>
          <a routerLink="/manager/organigramme" class="qa-btn">🌳 Organigramme</a>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-pending">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats?.pendingScheduling || 0 }}</div>
            <div class="kpi-label">À planifier</div>
          </div>
        </div>
        <div class="kpi-card kpi-scheduled">
          <div class="kpi-icon">📅</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats?.scheduled || 0 }}</div>
            <div class="kpi-label">Planifiés</div>
          </div>
        </div>
        <div class="kpi-card kpi-completed">
          <div class="kpi-icon">✅</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats?.completed || 0 }}</div>
            <div class="kpi-label">Réalisés</div>
          </div>
        </div>
        <div class="kpi-card kpi-rate">
          <div class="kpi-icon">🎯</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats?.acceptanceRate || 0 }}%</div>
            <div class="kpi-label">Taux d'acceptation</div>
            <div class="kpi-sub" *ngIf="stats">
              {{ stats.positive }} positifs · {{ stats.negative }} négatifs
            </div>
          </div>
        </div>
      </div>

      <div class="dash-grid">
        <!-- Colonne 1 : Prochains entretiens + activité mensuelle -->
        <div class="dash-col">
          <div class="panel">
            <div class="panel-head">
              <h2>🗣️ Mes prochains entretiens</h2>
              <a routerLink="/manager/interviews" class="panel-more">Voir tout →</a>
            </div>
            <div *ngIf="!stats?.upcoming?.length" class="panel-empty">
              Aucun entretien planifié à venir.
            </div>
            <div *ngFor="let it of stats?.upcoming || []" class="upcoming-row">
              <div class="up-date">
                <div class="up-day">{{ formatDay(it.scheduledDate) }}</div>
                <div class="up-month">{{ formatMonth(it.scheduledDate) }}</div>
              </div>
              <div class="up-body">
                <div class="up-title">{{ it.candidateName || '—' }}</div>
                <div class="up-meta">
                  <span>💼 {{ it.jobOfferTitle || 'Offre inconnue' }}</span>
                  <span *ngIf="it.location"> · 📍 {{ it.location }}</span>
                </div>
                <div class="up-time">🕒 {{ formatTime(it.scheduledDate) }}</div>
              </div>
              <span class="up-type-badge" [class.ext]="it.candidateType === 'EXTERNAL'">
                {{ it.candidateType === 'EXTERNAL' ? 'Externe' : 'Interne' }}
              </span>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h2>📊 Activité (6 derniers jours)</h2>
            </div>
            <div class="monthly-bars">
              <div class="bar-col" *ngFor="let m of stats?.daily || []">
                <div class="bar-stack" [title]="m.total + ' entretien(s) le ' + formatShortDate(m.day)">
                  <div class="bar-segment bar-positive"
                       [style.height.%]="barHeight(m.positive, maxDaily)"></div>
                  <div class="bar-segment bar-negative"
                       [style.height.%]="barHeight(m.negative, maxDaily)"></div>
                  <div class="bar-segment bar-neutral"
                       [style.height.%]="barHeight(m.total - m.positive - m.negative, maxDaily)"></div>
                </div>
                <div class="bar-label">{{ shortDayLabel(m.day) }}</div>
                <div class="bar-value">{{ m.total }}</div>
              </div>
            </div>
            <div class="legend">
              <span class="lg lg-pos">✅ Positifs</span>
              <span class="lg lg-neg">❌ Négatifs</span>
              <span class="lg lg-neu">○ En cours / autres</span>
            </div>
          </div>
        </div>

        <!-- Colonne 2 : Équipe + département -->
        <div class="dash-col">
          <div class="panel">
            <div class="panel-head">
              <h2>🏢 Mon périmètre</h2>
            </div>
            <div *ngIf="!team?.departments?.length" class="panel-empty">
              Vous n'êtes pas encore désigné manager d'un département.
            </div>
            <div *ngFor="let d of team?.departments || []" class="dept-card">
              <div class="dept-name">🏗️ {{ d.name }}</div>
              <div class="dept-desc" *ngIf="d.description">{{ d.description }}</div>
              <div class="dept-meta">👥 {{ d.employeeCount }} employé(s)</div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h2>👥 Mon équipe</h2>
              <span class="panel-count" *ngIf="team?.teamSize">{{ team.teamSize }}</span>
            </div>
            <div *ngIf="!team?.team?.length" class="panel-empty">
              Aucun employé à afficher.
            </div>
            <div *ngFor="let e of team?.team || []" class="team-row">
              <div class="team-avatar">{{ initialsOf(e) }}</div>
              <div class="team-body">
                <div class="team-name">
                  {{ e.firstName }} {{ e.lastName }}
                  <span class="badge-promo" *ngIf="e.recentPromotion" title="Promotion récente">
                    🚀 Promu
                  </span>
                </div>
                <div class="team-meta">
                  <span>💼 {{ e.position || '—' }}</span>
                  <span *ngIf="e.serviceName"> · {{ e.serviceName }}</span>
                </div>
                <div class="team-sub" *ngIf="e.hireDate">
                  📅 Embauché·e le {{ formatShortDate(e.hireDate) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mgr-dashboard { padding: 0; }

    .mgr-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .mgr-header h1 { color: #1e3a5f; margin: 0 0 4px 0; }
    .mgr-welcome { color: #64748b; margin: 0; font-size: 0.95rem; }

    .mgr-quick-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .qa-btn {
      padding: 9px 16px;
      background: white;
      color: #1e3a5f;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .qa-btn:hover { background: #f8fafc; transform: translateY(-1px); }
    .qa-btn.primary {
      background: linear-gradient(135deg, #1e3a5f, #3b82f6);
      color: white;
      border-color: transparent;
    }
    .qa-btn.primary:hover { box-shadow: 0 6px 16px rgba(30, 58, 95, 0.3); }

    /* KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: white;
      border-radius: 14px;
      padding: 18px 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex;
      gap: 14px;
      align-items: center;
      transition: transform 0.2s;
    }
    .kpi-card:hover { transform: translateY(-2px); }
    .kpi-icon { font-size: 2rem; line-height: 1; }
    .kpi-value { font-size: 1.8rem; font-weight: 700; color: #0f172a; line-height: 1; }
    .kpi-label { font-size: 0.78rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .kpi-sub { font-size: 0.7rem; color: #94a3b8; margin-top: 2px; }
    .kpi-pending { border-left: 4px solid #f59e0b; }
    .kpi-scheduled { border-left: 4px solid #3b82f6; }
    .kpi-completed { border-left: 4px solid #10b981; }
    .kpi-rate { border-left: 4px solid #8b5cf6; }

    /* Layout 2 colonnes */
    .dash-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 20px;
    }
    .dash-col { display: flex; flex-direction: column; gap: 20px; }

    .panel {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px 22px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .panel-head h2 { margin: 0; color: #1e3a5f; font-size: 1rem; }
    .panel-more {
      color: #3b82f6;
      font-size: 0.8rem;
      text-decoration: none;
      font-weight: 600;
    }
    .panel-more:hover { text-decoration: underline; }
    .panel-count {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .panel-empty {
      padding: 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.85rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    /* Prochains entretiens */
    .upcoming-row {
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .upcoming-row:last-child { border-bottom: none; }
    .up-date {
      flex-shrink: 0;
      text-align: center;
      width: 50px;
      padding: 6px 0;
      background: #eff6ff;
      border-radius: 8px;
    }
    .up-day { font-size: 1.3rem; font-weight: 700; color: #1d4ed8; line-height: 1; }
    .up-month { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .up-body { flex: 1; }
    .up-title { font-weight: 600; color: #0f172a; font-size: 0.95rem; }
    .up-meta { font-size: 0.78rem; color: #64748b; margin-top: 2px; }
    .up-time { font-size: 0.78rem; color: #64748b; margin-top: 2px; }
    .up-type-badge {
      padding: 3px 10px;
      background: #dcfce7;
      color: #166534;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .up-type-badge.ext { background: #fef3c7; color: #92400e; }

    /* Activité mensuelle */
    .monthly-bars {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      height: 160px;
      padding: 8px 0;
    }
    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .bar-stack {
      width: 100%;
      height: 110px;
      background: #f1f5f9;
      border-radius: 6px 6px 0 0;
      position: relative;
      display: flex;
      flex-direction: column-reverse;
      overflow: hidden;
    }
    .bar-segment { width: 100%; transition: height 0.3s; }
    .bar-positive { background: #10b981; }
    .bar-negative { background: #ef4444; }
    .bar-neutral { background: #cbd5e1; }
    .bar-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .bar-value { font-size: 0.85rem; color: #0f172a; font-weight: 700; }
    .legend { display: flex; gap: 14px; justify-content: center; margin-top: 8px; flex-wrap: wrap; }
    .lg { font-size: 0.75rem; color: #64748b; }
    .lg-pos { color: #166534; }
    .lg-neg { color: #991b1b; }

    /* Département */
    .dept-card {
      padding: 12px 14px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      margin-bottom: 10px;
    }
    .dept-card:last-child { margin-bottom: 0; }
    .dept-name { font-weight: 600; color: #1e3a5f; }
    .dept-desc { font-size: 0.8rem; color: #64748b; margin-top: 4px; }
    .dept-meta { font-size: 0.8rem; color: #475569; margin-top: 6px; font-weight: 500; }

    /* Équipe */
    .team-row {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 10px 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    .team-row:last-child { border-bottom: none; }
    .team-avatar {
      width: 40px; height: 40px;
      flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .team-body { flex: 1; min-width: 0; }
    .team-name {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.92rem;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .badge-promo {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #78350f;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.65rem;
      font-weight: 700;
    }
    .team-meta { font-size: 0.78rem; color: #64748b; margin-top: 2px; }
    .team-sub { font-size: 0.72rem; color: #94a3b8; margin-top: 2px; }

    @media (max-width: 1100px) {
      .dash-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ManagerDashboardComponent implements OnInit {
  stats: any = null;
  team: any = null;
  maxDaily = 1;

  constructor(
    public keycloak: KeycloakService,
    private employeeApi: EmployeeApiService,
    private recruitmentApi: RecruitmentApiService
  ) {}

  ngOnInit(): void {
    this.recruitmentApi.getManagerStats().subscribe({
      next: (s) => {
        this.stats = s;
        // Pour la mise à l'échelle des barres : max sur les 6 derniers jours.
        const totals = (s?.daily || []).map((m: any) => m.total || 0);
        this.maxDaily = Math.max(1, ...totals);
      },
      error: () => this.stats = null
    });
    this.employeeApi.getMyTeam().subscribe({
      next: (t) => this.team = t,
      error: () => this.team = null
    });
  }

  barHeight(value: number, max: number): number {
    if (!value || value <= 0 || max <= 0) return 0;
    return Math.round((value / max) * 100);
  }

  /** "2026-05-22" → "Ven 22" (jour de semaine abrégé + numéro du jour) */
  shortDayLabel(ymd?: string): string {
    if (!ymd) return '';
    const d = new Date(ymd);
    if (isNaN(d.getTime())) return ymd;
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[d.getDay()] + ' ' + d.getDate().toString().padStart(2, '0');
  }

  formatDay(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.getDate().toString().padStart(2, '0');
  }

  formatMonth(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { month: 'short' });
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatShortDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  initialsOf(e: any): string {
    const f = (e?.firstName || '').charAt(0);
    const l = (e?.lastName || '').charAt(0);
    return (f + l).toUpperCase() || '?';
  }
}

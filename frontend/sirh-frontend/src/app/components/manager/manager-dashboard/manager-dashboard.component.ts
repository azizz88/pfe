import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

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
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Tableau de bord</h1>
          <p class="page-header__sub">
            Bienvenue {{ keycloak.getFullName() }}.
            <span *ngIf="team?.manager?.matricule">Matricule {{ team.manager.matricule }}.</span>
          </p>
        </div>
        <div class="page-header__actions">
          <a routerLink="/manager/interviews" class="btn btn--accent">
            <app-icon name="interview" [size]="17" /> Mes entretiens
          </a>
          <a routerLink="/manager/organigramme" class="btn btn--secondary">
            <app-icon name="org-chart" [size]="17" /> Organigramme
          </a>
        </div>
      </div>

      <!-- KPIs -->
      <div class="grid grid--kpi" style="margin-bottom: var(--sp-6)">
        <div class="stat">
          <span class="stat__icon" style="background: var(--c-warning-soft); color: var(--c-warning-ink)"><app-icon name="pending" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ stats?.pendingScheduling || 0 }}</span>
            <span class="stat__label">À planifier</span>
          </div>
        </div>
        <div class="stat">
          <span class="stat__icon" style="background: var(--c-info-soft); color: var(--c-info-ink)"><app-icon name="calendar" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ stats?.scheduled || 0 }}</span>
            <span class="stat__label">Planifiés</span>
          </div>
        </div>
        <div class="stat">
          <span class="stat__icon" style="background: var(--c-success-soft); color: var(--c-success-ink)"><app-icon name="approve" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ stats?.completed || 0 }}</span>
            <span class="stat__label">Réalisés</span>
          </div>
        </div>
        <div class="stat">
          <span class="stat__icon"><app-icon name="target" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ stats?.acceptanceRate || 0 }}%</span>
            <span class="stat__label">Taux d'acceptation</span>
            <span class="stat__label" *ngIf="stats">{{ stats.positive }} positifs · {{ stats.negative }} négatifs</span>
          </div>
        </div>
      </div>

      <div class="dash-grid">
        <!-- Colonne 1 : Prochains entretiens + activité -->
        <div class="dash-col">
          <div class="card">
            <div class="card__header">
              <span class="card__title"><app-icon name="interview" [size]="17" /> Mes prochains entretiens</span>
              <a routerLink="/manager/interviews" class="card-more">Voir tout <app-icon name="arrow-right" [size]="14" /></a>
            </div>
            <div class="card__body">
              <div *ngIf="!stats?.upcoming?.length" class="empty-state">
                <span class="empty-state__icon"><app-icon name="calendar" [size]="24" /></span>
                <span class="empty-state__text">Aucun entretien planifié à venir.</span>
              </div>
              <div *ngFor="let it of stats?.upcoming || []" class="upcoming-row">
                <div class="up-date">
                  <div class="up-day">{{ formatDay(it.scheduledDate) }}</div>
                  <div class="up-month">{{ formatMonth(it.scheduledDate) }}</div>
                </div>
                <div class="up-body">
                  <div class="up-title">{{ it.candidateName || '—' }}</div>
                  <div class="up-meta">
                    <span><app-icon name="job" [size]="13" /> {{ it.jobOfferTitle || 'Offre inconnue' }}</span>
                    <span *ngIf="it.location"> · <app-icon name="location" [size]="13" /> {{ it.location }}</span>
                  </div>
                  <div class="up-meta"><app-icon name="clock" [size]="13" /> {{ formatTime(it.scheduledDate) }}</div>
                </div>
                <span class="badge" [ngClass]="it.candidateType === 'EXTERNAL' ? 'badge--warning' : 'badge--success'">
                  {{ it.candidateType === 'EXTERNAL' ? 'Externe' : 'Interne' }}
                </span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <span class="card__title"><app-icon name="chart" [size]="17" /> Activité (6 derniers jours)</span>
            </div>
            <div class="card__body">
              <div class="bars">
                <div class="bar-col" *ngFor="let m of stats?.daily || []">
                  <div class="bar-stack" [title]="m.total + ' entretien(s) le ' + formatShortDate(m.day)">
                    <div class="bar-seg bar-pos" [style.height.%]="barHeight(m.positive, maxDaily)"></div>
                    <div class="bar-seg bar-neg" [style.height.%]="barHeight(m.negative, maxDaily)"></div>
                    <div class="bar-seg bar-neu" [style.height.%]="barHeight(m.total - m.positive - m.negative, maxDaily)"></div>
                  </div>
                  <div class="bar-label">{{ shortDayLabel(m.day) }}</div>
                  <div class="bar-value">{{ m.total }}</div>
                </div>
              </div>
              <div class="legend">
                <span class="legend__item"><i class="dot dot-pos"></i> Positifs</span>
                <span class="legend__item"><i class="dot dot-neg"></i> Négatifs</span>
                <span class="legend__item"><i class="dot dot-neu"></i> En cours / autres</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne 2 : Périmètre + équipe -->
        <div class="dash-col">
          <div class="card">
            <div class="card__header">
              <span class="card__title"><app-icon name="department" [size]="17" /> Mon périmètre</span>
            </div>
            <div class="card__body">
              <div *ngIf="!team?.departments?.length" class="empty-state">
                <span class="empty-state__icon"><app-icon name="department" [size]="24" /></span>
                <span class="empty-state__text">Vous n'êtes pas encore désigné manager d'un département.</span>
              </div>
              <div *ngFor="let d of team?.departments || []" class="dept-card">
                <div class="dept-name"><app-icon name="department" [size]="16" /> {{ d.name }}</div>
                <div class="dept-desc" *ngIf="d.description">{{ d.description }}</div>
                <div class="dept-meta"><app-icon name="employees" [size]="14" /> {{ d.employeeCount }} employé(s)</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <span class="card__title"><app-icon name="team" [size]="17" /> Mon équipe</span>
              <span class="badge badge--neutral" *ngIf="team?.teamSize">{{ team.teamSize }}</span>
            </div>
            <div class="card__body">
              <div *ngIf="!team?.team?.length" class="empty-state">
                <span class="empty-state__icon"><app-icon name="team" [size]="24" /></span>
                <span class="empty-state__text">Aucun employé à afficher.</span>
              </div>
              <div *ngFor="let e of team?.team || []" class="team-row">
                <span class="avatar avatar--round">{{ initialsOf(e) }}</span>
                <div class="team-body">
                  <div class="team-name">
                    {{ e.firstName }} {{ e.lastName }}
                    <span class="badge badge--success" *ngIf="e.recentPromotion" title="Promotion récente">
                      <app-icon name="promoted" [size]="12" /> Promu
                    </span>
                  </div>
                  <div class="team-meta">
                    <app-icon name="job" [size]="13" /> {{ e.position || '—' }}
                    <span *ngIf="e.serviceName"> · {{ e.serviceName }}</span>
                  </div>
                  <div class="team-sub" *ngIf="e.hireDate">
                    <app-icon name="calendar" [size]="12" /> Embauché·e le {{ formatShortDate(e.hireDate) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-more { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-13); font-weight: 600; color: var(--c-accent-ink); }
    .card-more:hover { text-decoration: underline; }

    /* Layout 2 colonnes */
    .dash-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: var(--sp-5); }
    .dash-col { display: flex; flex-direction: column; gap: var(--sp-5); }

    /* Prochains entretiens */
    .upcoming-row { display: flex; gap: var(--sp-3); align-items: center; padding: var(--sp-3) 0; border-bottom: 1px solid var(--c-border); }
    .upcoming-row:last-child { border-bottom: none; padding-bottom: 0; }
    .upcoming-row:first-child { padding-top: 0; }
    .up-date { flex: none; text-align: center; width: 50px; padding: 7px 0; background: var(--c-accent-soft); border-radius: var(--r-md); }
    .up-day { font-size: 1.3rem; font-weight: 700; color: var(--c-accent-ink); line-height: 1; }
    .up-month { font-size: var(--fs-11); color: var(--c-muted); text-transform: uppercase; font-weight: 600; }
    .up-body { flex: 1; min-width: 0; }
    .up-title { font-weight: 600; color: var(--c-ink); font-size: var(--fs-15); }
    .up-meta { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: var(--fs-13); color: var(--c-muted); margin-top: 2px; }
    .up-meta span { display: inline-flex; align-items: center; gap: 4px; }

    /* Activité (mini barres) */
    .bars { display: flex; align-items: flex-end; gap: var(--sp-3); height: 150px; padding: var(--sp-2) 0; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar-stack { width: 100%; height: 104px; background: var(--c-surface-3); border-radius: var(--r-sm) var(--r-sm) 0 0; display: flex; flex-direction: column-reverse; overflow: hidden; }
    .bar-seg { width: 100%; transition: height .3s ease; }
    .bar-pos { background: var(--c-success); }
    .bar-neg { background: var(--c-danger); }
    .bar-neu { background: var(--c-border-strong); }
    .bar-label { font-size: var(--fs-11); color: var(--c-muted); text-transform: uppercase; font-weight: 600; }
    .bar-value { font-size: var(--fs-13); color: var(--c-ink); font-weight: 700; }
    .legend { display: flex; gap: var(--sp-4); justify-content: center; margin-top: var(--sp-2); flex-wrap: wrap; }
    .legend__item { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-12); color: var(--c-muted); }
    .dot { width: 9px; height: 9px; border-radius: 3px; }
    .dot-pos { background: var(--c-success); }
    .dot-neg { background: var(--c-danger); }
    .dot-neu { background: var(--c-border-strong); }

    /* Périmètre */
    .dept-card { padding: var(--sp-3) var(--sp-4); background: var(--c-surface-2); border-radius: var(--r-md); border: 1px solid var(--c-border); }
    .dept-card + .dept-card { margin-top: var(--sp-2); }
    .dept-name { display: flex; align-items: center; gap: 7px; font-weight: 600; color: var(--c-ink); }
    .dept-desc { font-size: var(--fs-13); color: var(--c-muted); margin-top: 4px; }
    .dept-meta { display: flex; align-items: center; gap: 6px; font-size: var(--fs-13); color: var(--c-ink-soft); margin-top: 6px; font-weight: 500; }

    /* Équipe */
    .team-row { display: flex; gap: var(--sp-3); align-items: center; padding: var(--sp-3) 0; border-bottom: 1px solid var(--c-border); }
    .team-row:last-child { border-bottom: none; padding-bottom: 0; }
    .team-row:first-child { padding-top: 0; }
    .team-row .avatar { background: var(--c-accent-soft); color: var(--c-accent-ink); }
    .team-body { flex: 1; min-width: 0; }
    .team-name { font-weight: 600; color: var(--c-ink); font-size: var(--fs-14); display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
    .team-meta { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: var(--fs-13); color: var(--c-muted); margin-top: 2px; }
    .team-sub { display: flex; align-items: center; gap: 5px; font-size: var(--fs-12); color: var(--c-faint); margin-top: 2px; }

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

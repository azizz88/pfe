import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Dashboard statistiques pour le RH Admin.
 * Affiche les KPI : total employes, departements, candidatures,
 * masse salariale, anciennete moyenne, contrats expirant.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="page fade-in">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header__title">
          <h1>Tableau de bord RH</h1>
          <p class="page-header__sub">Vue d'ensemble de votre organisation</p>
        </div>
        <div class="date-chip">
          <app-icon name="calendar" [size]="16" />
          <span>{{ todayDate }}</span>
        </div>
      </div>

      <!-- KPI -->
      <div class="grid grid--kpi" style="margin-bottom: var(--sp-6)">
        <div class="stat">
          <span class="stat__icon"><app-icon name="employees" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ stats?.totalEmployees || 0 }}</span>
            <span class="stat__label">Total employés</span>
          </div>
        </div>
        <div class="stat">
          <span class="stat__icon" style="background: var(--c-info-soft); color: var(--c-info-ink)"><app-icon name="department" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ departmentCount }}</span>
            <span class="stat__label">Départements</span>
          </div>
        </div>
        <div class="stat">
          <span class="stat__icon" style="background: var(--c-warning-soft); color: var(--c-warning-ink)"><app-icon name="list" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ mobilityStats?.totalApplications || 0 }}</span>
            <span class="stat__label">Candidatures</span>
          </div>
        </div>
        <div class="stat">
          <span class="stat__icon" style="background: var(--c-success-soft); color: var(--c-success-ink)"><app-icon name="salary" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ formatSalary(totalSalaryMass) }}</span>
            <span class="stat__label">Masse salariale (DT)</span>
          </div>
        </div>
        <div class="stat">
          <span class="stat__icon"><app-icon name="clock" [size]="20" /></span>
          <div class="stat__body">
            <span class="stat__value">{{ formatTenure(averageTenureMonths) }}</span>
            <span class="stat__label">Ancienneté moyenne</span>
          </div>
        </div>
        <div class="stat" [class.stat--alert]="expiringCount > 0">
          <span class="stat__icon" [style.background]="expiringCount > 0 ? 'var(--c-danger-soft)' : 'var(--c-surface-3)'"
                [style.color]="expiringCount > 0 ? 'var(--c-danger-ink)' : 'var(--c-faint)'">
            <app-icon name="warning" [size]="20" />
          </span>
          <div class="stat__body">
            <span class="stat__value" [style.color]="expiringCount > 0 ? 'var(--c-danger-ink)' : null">{{ expiringCount }}</span>
            <span class="stat__label">Contrats expirant (30j)</span>
          </div>
        </div>
      </div>

      <!-- Accès rapide -->
      <div class="section-title">Administration RH</div>
      <div class="tiles" style="margin-bottom: var(--sp-6)">
        <a class="q-tile" routerLink="/admin/employees">
          <span class="q-tile__icon"><app-icon name="employees" [size]="20" /></span>
          <span class="q-tile__body"><span class="q-tile__title">Gestion employés</span><span class="q-tile__desc">Créer, modifier, gérer les employés</span></span>
          <app-icon name="arrow-right" [size]="18" class="q-tile__arrow" />
        </a>
        <a class="q-tile" routerLink="/admin/departments">
          <span class="q-tile__icon"><app-icon name="department" [size]="20" /></span>
          <span class="q-tile__body"><span class="q-tile__title">Départements</span><span class="q-tile__desc">Structure organisationnelle</span></span>
          <app-icon name="arrow-right" [size]="18" class="q-tile__arrow" />
        </a>
        <a class="q-tile" routerLink="/admin/contracts">
          <span class="q-tile__icon"><app-icon name="contract" [size]="20" /></span>
          <span class="q-tile__body"><span class="q-tile__title">Contrats</span><span class="q-tile__desc">CDI / CDD / Stage</span></span>
          <app-icon name="arrow-right" [size]="18" class="q-tile__arrow" />
        </a>
        <a class="q-tile" routerLink="/admin/organigramme">
          <span class="q-tile__icon"><app-icon name="org-chart" [size]="20" /></span>
          <span class="q-tile__body"><span class="q-tile__title">Organigramme</span><span class="q-tile__desc">Visualiser la hiérarchie</span></span>
          <app-icon name="arrow-right" [size]="18" class="q-tile__arrow" />
        </a>
      </div>

      <div class="section-title">Recrutement</div>
      <div class="tiles" style="margin-bottom: var(--sp-6)">
        <a class="q-tile" routerLink="/admin/recruitment">
          <span class="q-tile__icon"><app-icon name="recruitment" [size]="20" /></span>
          <span class="q-tile__body"><span class="q-tile__title">Offres & candidatures</span><span class="q-tile__desc">Gérer les offres et candidatures</span></span>
          <app-icon name="arrow-right" [size]="18" class="q-tile__arrow" />
        </a>
        <a class="q-tile" routerLink="/admin/skills">
          <span class="q-tile__icon"><app-icon name="skills" [size]="20" /></span>
          <span class="q-tile__body"><span class="q-tile__title">Compétences</span><span class="q-tile__desc">Catalogue des compétences</span></span>
          <app-icon name="arrow-right" [size]="18" class="q-tile__arrow" />
        </a>
      </div>

      <!-- Analyses détaillées -->
      <div class="section-title">Analyses détaillées</div>
      <div class="section-grid">
        <!-- Par département -->
        <div class="card">
          <div class="card__header"><span class="card__title"><app-icon name="department" [size]="17" /> Par département</span></div>
          <div class="card__body">
            <div class="bar-list">
              <div *ngFor="let item of departmentStats" class="bar-row">
                <span class="bar-name">{{ item.name }}</span>
                <div class="bar-track"><div class="bar-fill" [style.width.%]="getPercentage(item.count, stats?.totalEmployees)"></div></div>
                <span class="bar-val">{{ item.count }}</span>
              </div>
              <p *ngIf="departmentStats.length === 0" class="empty-text">Aucune donnée</p>
            </div>
          </div>
        </div>

        <!-- Par type de contrat -->
        <div class="card">
          <div class="card__header"><span class="card__title"><app-icon name="contract" [size]="17" /> Par type de contrat</span></div>
          <div class="card__body">
            <div class="bar-list">
              <div *ngFor="let item of contractStats" class="bar-row">
                <span class="badge ct-badge" [ngClass]="'ct-' + item.type">{{ item.type }}</span>
                <div class="bar-track"><div class="bar-fill" [style.width.%]="getPercentage(item.count, stats?.totalEmployees)"></div></div>
                <span class="bar-val">{{ item.count }}</span>
              </div>
              <p *ngIf="contractStats.length === 0" class="empty-text">Aucune donnée</p>
            </div>
          </div>
        </div>

        <!-- Mobilité interne -->
        <div class="card">
          <div class="card__header"><span class="card__title"><app-icon name="refresh" [size]="17" /> Mobilité interne</span></div>
          <div class="card__body">
            <div class="mobility-list">
              <div *ngFor="let item of statusStats" class="mobility-item">
                <span class="badge" [ngClass]="'st-' + item.status">{{ getStatusLabel(item.status) }}</span>
                <span class="mobility-count">{{ item.count }}</span>
              </div>
              <p *ngIf="statusStats.length === 0" class="empty-text">Aucune donnée</p>
            </div>
          </div>
        </div>

        <!-- Masse salariale par département -->
        <div class="card">
          <div class="card__header"><span class="card__title"><app-icon name="salary" [size]="17" /> Masse salariale / département</span></div>
          <div class="card__body">
            <div class="bar-list">
              <div *ngFor="let item of salaryByDeptStats" class="bar-row">
                <span class="bar-name">{{ item.name }}</span>
                <div class="bar-track"><div class="bar-fill" [style.width.%]="getPercentage(item.amount, totalSalaryMass)"></div></div>
                <span class="bar-val salary-val">{{ formatSalary(item.amount) }} DT</span>
              </div>
              <p *ngIf="salaryByDeptStats.length === 0" class="empty-text">Aucune donnée</p>
            </div>
          </div>
        </div>

        <!-- Contrats expirant -->
        <div class="card expiring-card" *ngIf="expiringContracts.length > 0">
          <div class="card__header">
            <span class="card__title"><app-icon name="notification" [size]="17" /> Contrats expirant bientôt</span>
            <span class="badge badge--danger">{{ expiringContracts.length }}</span>
          </div>
          <div class="card__body">
            <div class="expiring-row" *ngFor="let item of expiringContracts">
              <div class="expiring-info">
                <span class="emp-name">{{ item.employeeName }}</span>
                <span class="badge ct-badge" [ngClass]="'ct-' + item.type">{{ item.type }}</span>
              </div>
              <span class="end-date" [class.urgent]="isUrgent(item.endDate)">
                {{ formatEndDate(item.endDate) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .date-chip {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 14px; background: var(--c-surface); border: 1px solid var(--c-border);
      border-radius: var(--r-md); font-size: var(--fs-13); color: var(--c-ink-soft); font-weight: 500;
      white-space: nowrap; text-transform: capitalize;
    }
    .stat--alert { border-color: var(--c-danger-soft); }

    /* Tuiles d'accès rapide */
    .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--sp-3); }
    .q-tile {
      display: flex; align-items: center; gap: var(--sp-3);
      padding: var(--sp-4); background: var(--c-surface);
      border: 1px solid var(--c-border); border-radius: var(--r-lg);
      box-shadow: var(--sh-sm); text-decoration: none; color: inherit;
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    }
    .q-tile:hover { border-color: var(--c-accent); box-shadow: var(--sh-md); transform: translateY(-1px); }
    .q-tile__icon { width: 40px; height: 40px; flex: none; border-radius: var(--r-md); display: inline-flex; align-items: center; justify-content: center; background: var(--c-accent-soft); color: var(--c-accent-ink); }
    .q-tile__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .q-tile__title { font-weight: 650; color: var(--c-ink); font-size: var(--fs-14); }
    .q-tile__desc { color: var(--c-muted); font-size: var(--fs-12); }
    .q-tile__arrow { color: var(--c-faint); transition: transform var(--transition), color var(--transition); }
    .q-tile:hover .q-tile__arrow { transform: translateX(3px); color: var(--c-accent); }

    /* Grille d'analyses */
    .section-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: var(--sp-5); }

    /* Barres */
    .bar-list { display: flex; flex-direction: column; gap: var(--sp-4); }
    .bar-row { display: flex; align-items: center; gap: var(--sp-3); font-size: var(--fs-14); }
    .bar-name { min-width: 100px; max-width: 130px; color: var(--c-ink-soft); font-weight: 500; font-size: var(--fs-13); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { flex: 1; height: 8px; background: var(--c-surface-3); border-radius: var(--r-pill); overflow: hidden; }
    .bar-fill { height: 100%; border-radius: var(--r-pill); background: var(--c-accent); transition: width .5s ease; }
    .bar-val { font-weight: 700; color: var(--c-ink); font-size: var(--fs-13); min-width: 28px; text-align: right; font-variant-numeric: tabular-nums; }
    .salary-val { color: var(--c-success-ink); min-width: 92px; }
    .ct-badge { min-width: 54px; justify-content: center; }

    /* Badges contrat / statut */
    .ct-CDI { background: var(--c-success-soft); color: var(--c-success-ink); }
    .ct-CDD { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .ct-STAGE { background: var(--c-info-soft); color: var(--c-info-ink); }
    .st-EN_ATTENTE { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .st-ENTRETIEN { background: var(--c-info-soft); color: var(--c-info-ink); }
    .st-RETENU { background: var(--c-success-soft); color: var(--c-success-ink); }
    .st-REFUSE { background: var(--c-danger-soft); color: var(--c-danger-ink); }

    /* Mobilité */
    .mobility-list { display: flex; flex-direction: column; gap: var(--sp-2); }
    .mobility-item { display: flex; align-items: center; justify-content: space-between; padding: 11px var(--sp-4); background: var(--c-surface-2); border-radius: var(--r-md); border: 1px solid var(--c-border); }
    .mobility-count { font-size: var(--fs-20); font-weight: 700; color: var(--c-ink); font-variant-numeric: tabular-nums; }

    /* Contrats expirant */
    .expiring-card { border-color: var(--c-warning-soft); }
    .expiring-row { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); padding: 11px 0; border-bottom: 1px solid var(--c-border); }
    .expiring-row:last-child { border-bottom: none; padding-bottom: 0; }
    .expiring-row:first-child { padding-top: 0; }
    .expiring-info { display: flex; align-items: center; gap: var(--sp-3); }
    .emp-name { font-weight: 600; color: var(--c-ink); font-size: var(--fs-14); }
    .end-date { font-size: var(--fs-13); color: var(--c-warning-ink); font-weight: 600; padding: 3px 10px; background: var(--c-warning-soft); border-radius: var(--r-sm); }
    .end-date.urgent { color: var(--c-danger-ink); background: var(--c-danger-soft); }

    .empty-text { color: var(--c-faint); text-align: center; padding: var(--sp-4) 0; font-size: var(--fs-14); }

    @media (max-width: 768px) {
      .section-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  mobilityStats: any = null;
  departmentStats: {name: string, count: number}[] = [];
  contractStats: {type: string, count: number}[] = [];
  statusStats: {status: string, count: number}[] = [];
  departmentCount = 0;
  dataLoaded = false;

  // Nouvelles stats
  totalSalaryMass = 0;
  salaryByDeptStats: {name: string, amount: number}[] = [];
  averageTenureMonths = 0;
  expiringContracts: any[] = [];
  expiringCount = 0;

  todayDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  constructor(
    private employeeApi: EmployeeApiService,
    private recruitmentApi: RecruitmentApiService
  ) {}

  ngOnInit(): void {
    this.employeeApi.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        if (data.byDepartment) {
          this.departmentStats = Object.entries(data.byDepartment)
            .map(([name, count]) => ({ name, count: count as number }));
          this.departmentCount = this.departmentStats.length;
        }
        if (data.byContractType) {
          this.contractStats = Object.entries(data.byContractType)
            .map(([type, count]) => ({ type, count: count as number }));
        }

        // Masse salariale
        this.totalSalaryMass = data.totalSalaryMass || 0;
        if (data.salaryByDepartment) {
          this.salaryByDeptStats = Object.entries(data.salaryByDepartment)
            .map(([name, amount]) => ({ name, amount: amount as number }));
        }

        // Ancienneté
        this.averageTenureMonths = data.averageTenureMonths || 0;

        // Contrats expirant
        this.expiringContracts = data.expiringContracts || [];
        this.expiringCount = data.expiringCount || 0;

        this.dataLoaded = true;
      }
    });

    this.recruitmentApi.getMobilityReport().subscribe({
      next: (data) => {
        this.mobilityStats = data;
        if (data.byStatus) {
          this.statusStats = Object.entries(data.byStatus)
            .map(([status, count]) => ({ status, count: count as number }));
        }
      }
    });
  }

  getPercentage(count: number, total: number): number {
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }

  formatSalary(amount: number): string {
    if (!amount) return '0';
    return amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  }

  formatTenure(months: number): string {
    if (!months) return '0 mois';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} mois`;
    if (remainingMonths === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years}a ${remainingMonths}m`;
  }

  isUrgent(endDate: string): boolean {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // < 7 jours
  }

  formatEndDate(endDate: string): string {
    const date = new Date(endDate);
    const diff = date.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const formatted = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    if (days <= 0) return `${formatted} (expiré)`;
    if (days === 1) return `${formatted} (demain)`;
    return `${formatted} (${days}j)`;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'ENTRETIEN': 'Entretien',
      'RETENU': 'Retenu',
      'REFUSE': 'Refusé'
    };
    return labels[status] || status;
  }
}

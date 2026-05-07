import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';

/**
 * Dashboard statistiques pour le RH Admin.
 * Affiche les KPI : total employes, departements, candidatures,
 * masse salariale, anciennete moyenne, contrats expirant.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard" [class.loaded]="dataLoaded">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1>Dashboard RH</h1>
          <p class="header-subtitle">Vue d'ensemble de votre organisation</p>
        </div>
        <div class="header-date">
          <span class="date-icon">📅</span>
          <span>{{ todayDate }}</span>
        </div>
      </div>

      <!-- KPI Cards - Ligne 1 -->
      <div class="kpi-row">
        <div class="kpi-card" style="--accent: #3b82f6; --accent-light: #eff6ff; --delay: 0">
          <div class="kpi-icon-wrap" style="background: linear-gradient(135deg, #3b82f6, #6366f1)">
            <span class="kpi-icon">👥</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats?.totalEmployees || 0 }}</span>
            <span class="kpi-label">Total Employés</span>
          </div>
          <div class="kpi-decoration"></div>
        </div>

        <div class="kpi-card" style="--accent: #22c55e; --accent-light: #f0fdf4; --delay: 1">
          <div class="kpi-icon-wrap" style="background: linear-gradient(135deg, #22c55e, #10b981)">
            <span class="kpi-icon">🏢</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ departmentCount }}</span>
            <span class="kpi-label">Départements</span>
          </div>
          <div class="kpi-decoration"></div>
        </div>

        <div class="kpi-card" style="--accent: #f59e0b; --accent-light: #fffbeb; --delay: 2">
          <div class="kpi-icon-wrap" style="background: linear-gradient(135deg, #f59e0b, #f97316)">
            <span class="kpi-icon">📋</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ mobilityStats?.totalApplications || 0 }}</span>
            <span class="kpi-label">Candidatures</span>
          </div>
          <div class="kpi-decoration"></div>
        </div>
      </div>

      <!-- KPI Cards - Ligne 2 -->
      <div class="kpi-row">
        <div class="kpi-card" style="--accent: #8b5cf6; --accent-light: #f5f3ff; --delay: 3">
          <div class="kpi-icon-wrap" style="background: linear-gradient(135deg, #8b5cf6, #a855f7)">
            <span class="kpi-icon">💰</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatSalary(totalSalaryMass) }}</span>
            <span class="kpi-label">Masse Salariale (DT)</span>
          </div>
          <div class="kpi-decoration"></div>
        </div>

        <div class="kpi-card" style="--accent: #14b8a6; --accent-light: #f0fdfa; --delay: 4">
          <div class="kpi-icon-wrap" style="background: linear-gradient(135deg, #14b8a6, #06b6d4)">
            <span class="kpi-icon">⏱️</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatTenure(averageTenureMonths) }}</span>
            <span class="kpi-label">Ancienneté Moyenne</span>
          </div>
          <div class="kpi-decoration"></div>
        </div>

        <div class="kpi-card" [style]="expiringCount > 0 ? '--accent: #ef4444; --accent-light: #fef2f2; --delay: 5' : '--accent: #94a3b8; --accent-light: #f8fafc; --delay: 5'">
          <div class="kpi-icon-wrap" [style.background]="expiringCount > 0 ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #94a3b8, #64748b)'">
            <span class="kpi-icon">⚠️</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-value" [class.alert-value]="expiringCount > 0">{{ expiringCount }}</span>
            <span class="kpi-label">Contrats Expirant (30j)</span>
          </div>
          <div class="kpi-decoration"></div>
        </div>
      </div>

      <!-- Section grille -->
      <div class="section-grid">
        <!-- Par Département -->
        <div class="card" style="--card-delay: 6">
          <div class="card-header">
            <h3><span class="card-icon">🏢</span> Par Département</h3>
          </div>
          <div class="stat-list">
            <div *ngFor="let item of departmentStats; let i = index" class="stat-row">
              <span class="stat-name">{{ item.name }}</span>
              <div class="bar-container">
                <div class="bar blue-bar"
                     [style.width.%]="getPercentage(item.count, stats?.totalEmployees)"
                     [style.animationDelay.ms]="i * 100 + 600">
                </div>
              </div>
              <span class="stat-value">{{ item.count }}</span>
            </div>
            <p *ngIf="departmentStats.length === 0" class="empty">Aucune donnée</p>
          </div>
        </div>

        <!-- Par Type de Contrat -->
        <div class="card" style="--card-delay: 7">
          <div class="card-header">
            <h3><span class="card-icon">📄</span> Par Type de Contrat</h3>
          </div>
          <div class="stat-list">
            <div *ngFor="let item of contractStats; let i = index" class="stat-row">
              <span class="badge contract-badge" [class]="item.type">{{ item.type }}</span>
              <div class="bar-container">
                <div class="bar green-bar"
                     [style.width.%]="getPercentage(item.count, stats?.totalEmployees)"
                     [style.animationDelay.ms]="i * 100 + 600">
                </div>
              </div>
              <span class="stat-value">{{ item.count }}</span>
            </div>
            <p *ngIf="contractStats.length === 0" class="empty">Aucune donnée</p>
          </div>
        </div>

        <!-- Mobilité Interne -->
        <div class="card" style="--card-delay: 8">
          <div class="card-header">
            <h3><span class="card-icon">🔄</span> Mobilité Interne</h3>
          </div>
          <div class="stat-list mobility-list">
            <div *ngFor="let item of statusStats" class="mobility-item">
              <span class="badge status-badge" [class]="item.status">{{ getStatusLabel(item.status) }}</span>
              <span class="mobility-count">{{ item.count }}</span>
            </div>
            <p *ngIf="statusStats.length === 0" class="empty">Aucune donnée</p>
          </div>
        </div>

        <!-- Masse Salariale par Département -->
        <div class="card" style="--card-delay: 9">
          <div class="card-header">
            <h3><span class="card-icon">💰</span> Masse Salariale / Département</h3>
          </div>
          <div class="stat-list">
            <div *ngFor="let item of salaryByDeptStats; let i = index" class="stat-row">
              <span class="stat-name">{{ item.name }}</span>
              <div class="bar-container">
                <div class="bar purple-bar"
                     [style.width.%]="getPercentage(item.amount, totalSalaryMass)"
                     [style.animationDelay.ms]="i * 100 + 600">
                </div>
              </div>
              <span class="stat-value salary-val">{{ formatSalary(item.amount) }} DT</span>
            </div>
            <p *ngIf="salaryByDeptStats.length === 0" class="empty">Aucune donnée</p>
          </div>
        </div>

        <!-- Contrats Expirant Bientôt -->
        <div class="card expiring-card" *ngIf="expiringContracts.length > 0" style="--card-delay: 10">
          <div class="card-header alert-header">
            <h3><span class="card-icon">🔔</span> Contrats Expirant Bientôt</h3>
            <span class="alert-badge">{{ expiringContracts.length }}</span>
          </div>
          <div class="stat-list">
            <div *ngFor="let item of expiringContracts" class="expiring-row">
              <div class="expiring-info">
                <span class="emp-name">{{ item.employeeName }}</span>
                <span class="badge contract-badge" [class]="item.type">{{ item.type }}</span>
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
    /* ── Dashboard Container ── */
    .admin-dashboard {
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .admin-dashboard.loaded {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Header ── */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
    }
    .dashboard-header h1 {
      color: #0f172a;
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header-subtitle {
      color: #64748b;
      margin: 4px 0 0 0;
      font-size: 0.9rem;
    }
    .header-date {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: white;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-size: 0.85rem;
      color: #475569;
      font-weight: 500;
    }
    .date-icon { font-size: 1rem; }

    /* ── KPI Cards ── */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
      margin-bottom: 18px;
    }

    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 22px 24px;
      display: flex;
      align-items: center;
      gap: 18px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02);
      position: relative;
      overflow: hidden;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      animation: kpiSlideIn 0.5s ease forwards;
      animation-delay: calc(var(--delay) * 0.08s);
      opacity: 0;
    }
    .kpi-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04);
    }

    @keyframes kpiSlideIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .kpi-decoration {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: var(--accent-light);
      opacity: 0.5;
      pointer-events: none;
    }

    .kpi-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .kpi-icon { font-size: 1.4rem; filter: brightness(1.1); }

    .kpi-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      z-index: 1;
    }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .kpi-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
      letter-spacing: 0.01em;
    }
    .alert-value { color: #ef4444; }

    /* ── Section Grid ── */
    .section-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 18px;
      margin-top: 8px;
    }

    /* ── Cards ── */
    .card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02);
      animation: cardFadeIn 0.5s ease forwards;
      animation-delay: calc(var(--card-delay) * 0.08s);
      opacity: 0;
      transition: box-shadow 0.25s ease;
    }
    .card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.03);
    }

    @keyframes cardFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .card-header h3 {
      margin: 0;
      color: #0f172a;
      font-size: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-icon { font-size: 1.1rem; }

    /* ── Stat Rows ── */
    .stat-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .stat-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.9rem;
    }
    .stat-name {
      min-width: 100px;
      color: #334155;
      font-weight: 500;
      font-size: 0.85rem;
    }
    .stat-value {
      font-weight: 700;
      color: #0f172a;
      font-size: 0.9rem;
      min-width: 28px;
      text-align: right;
    }
    .salary-val { font-size: 0.8rem; min-width: 90px; }

    /* ── Bars ── */
    .bar-container {
      flex: 1;
      height: 10px;
      background: #f1f5f9;
      border-radius: 5px;
      overflow: hidden;
    }
    .bar {
      height: 100%;
      border-radius: 5px;
      animation: barGrow 0.8s ease forwards;
      transform-origin: left;
      transform: scaleX(0);
    }
    @keyframes barGrow {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }

    .blue-bar { background: linear-gradient(90deg, #3b82f6, #6366f1); }
    .green-bar { background: linear-gradient(90deg, #22c55e, #10b981); }
    .purple-bar { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }

    /* ── Badges ── */
    .badge {
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .contract-badge {
      min-width: 54px;
      text-align: center;
    }
    .CDI { background: #dcfce7; color: #166534; }
    .CDD { background: #fef9c3; color: #854d0e; }
    .STAGE { background: #dbeafe; color: #1e40af; }

    .status-badge {
      min-width: 85px;
      text-align: center;
    }
    .EN_ATTENTE { background: #fef9c3; color: #854d0e; }
    .ENTRETIEN { background: #dbeafe; color: #1e40af; }
    .RETENU { background: #dcfce7; color: #166534; }
    .REFUSE { background: #fee2e2; color: #991b1b; }

    /* ── Mobility ── */
    .mobility-list {
      gap: 10px;
    }
    .mobility-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #f1f5f9;
      transition: background 0.2s, border-color 0.2s;
    }
    .mobility-item:hover {
      background: #eff6ff;
      border-color: #dbeafe;
    }
    .mobility-count {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    /* ── Expiring Contracts ── */
    .expiring-card {
      border-color: #fed7aa;
    }
    .alert-header { }
    .alert-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #ef4444, #f97316);
      color: white;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .expiring-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #fffbeb;
      border-radius: 10px;
      border: 1px solid #fef3c7;
      transition: background 0.2s;
    }
    .expiring-row:hover {
      background: #fef9c3;
    }
    .expiring-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .emp-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9rem;
    }
    .end-date {
      font-size: 0.85rem;
      color: #f59e0b;
      font-weight: 600;
      padding: 4px 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #fde68a;
    }
    .end-date.urgent {
      color: #ef4444;
      border-color: #fecaca;
      background: #fef2f2;
      animation: urgentPulse 2s ease-in-out infinite;
    }
    @keyframes urgentPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    /* ── Empty ── */
    .empty {
      color: #94a3b8;
      font-style: italic;
      text-align: center;
      padding: 16px 0;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .kpi-row { grid-template-columns: 1fr; }
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
      'EN_ATTENTE': '⏳ En attente',
      'ENTRETIEN': '🗣️ Entretien',
      'RETENU': '✅ Retenu',
      'REFUSE': '❌ Refusé'
    };
    return labels[status] || status;
  }
}

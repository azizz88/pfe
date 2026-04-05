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
    <div class="admin-dashboard">
      <h1>Dashboard RH Admin</h1>

      <!-- KPI Cards - Ligne 1 -->
      <div class="kpi-row">
        <div class="kpi-card blue">
          <span class="kpi-value">{{ stats?.totalEmployees || 0 }}</span>
          <span class="kpi-label">Total Employ&eacute;s</span>
        </div>
        <div class="kpi-card green">
          <span class="kpi-value">{{ departmentCount }}</span>
          <span class="kpi-label">D&eacute;partements</span>
        </div>
        <div class="kpi-card orange">
          <span class="kpi-value">{{ mobilityStats?.totalApplications || 0 }}</span>
          <span class="kpi-label">Candidatures</span>
        </div>
      </div>

      <!-- KPI Cards - Ligne 2 -->
      <div class="kpi-row">
        <div class="kpi-card purple">
          <span class="kpi-value">{{ formatSalary(totalSalaryMass) }}</span>
          <span class="kpi-label">Masse Salariale (DT)</span>
        </div>
        <div class="kpi-card teal">
          <span class="kpi-value">{{ formatTenure(averageTenureMonths) }}</span>
          <span class="kpi-label">Anciennet&eacute; Moyenne</span>
        </div>
        <div class="kpi-card" [class]="expiringCount > 0 ? 'red' : 'gray'">
          <span class="kpi-value">{{ expiringCount }}</span>
          <span class="kpi-label">Contrats Expirant (30j)</span>
        </div>
      </div>

      <!-- Section grille -->
      <div class="section-grid">
        <!-- Par Département -->
        <div class="card">
          <h3>Par D&eacute;partement</h3>
          <div class="stat-list">
            <div *ngFor="let item of departmentStats" class="stat-row">
              <span>{{ item.name }}</span>
              <div class="bar-container">
                <div class="bar" [style.width.%]="getPercentage(item.count, stats?.totalEmployees)"></div>
              </div>
              <strong>{{ item.count }}</strong>
            </div>
            <p *ngIf="departmentStats.length === 0" class="empty">Aucune donn&eacute;e</p>
          </div>
        </div>

        <!-- Par Type de Contrat -->
        <div class="card">
          <h3>Par Type de Contrat</h3>
          <div class="stat-list">
            <div *ngFor="let item of contractStats" class="stat-row">
              <span class="badge" [class]="item.type">{{ item.type }}</span>
              <div class="bar-container">
                <div class="bar contract-bar" [style.width.%]="getPercentage(item.count, stats?.totalEmployees)"></div>
              </div>
              <strong>{{ item.count }}</strong>
            </div>
            <p *ngIf="contractStats.length === 0" class="empty">Aucune donn&eacute;e</p>
          </div>
        </div>

        <!-- Mobilité Interne -->
        <div class="card">
          <h3>Mobilit&eacute; Interne</h3>
          <div class="stat-list">
            <div *ngFor="let item of statusStats" class="stat-row">
              <span class="badge" [class]="item.status">{{ item.status }}</span>
              <strong>{{ item.count }}</strong>
            </div>
            <p *ngIf="statusStats.length === 0" class="empty">Aucune donn&eacute;e</p>
          </div>
        </div>

        <!-- Masse Salariale par Département -->
        <div class="card">
          <h3>Masse Salariale par D&eacute;partement</h3>
          <div class="stat-list">
            <div *ngFor="let item of salaryByDeptStats" class="stat-row">
              <span>{{ item.name }}</span>
              <div class="bar-container">
                <div class="bar salary-bar" [style.width.%]="getPercentage(item.amount, totalSalaryMass)"></div>
              </div>
              <strong>{{ formatSalary(item.amount) }} DT</strong>
            </div>
            <p *ngIf="salaryByDeptStats.length === 0" class="empty">Aucune donn&eacute;e</p>
          </div>
        </div>

        <!-- Contrats Expirant Bientôt -->
        <div class="card" *ngIf="expiringContracts.length > 0">
          <h3>Contrats Expirant Bient&ocirc;t</h3>
          <div class="stat-list">
            <div *ngFor="let item of expiringContracts" class="stat-row expiring-row">
              <span class="emp-name">{{ item.employeeName }}</span>
              <span class="badge" [class]="item.type">{{ item.type }}</span>
              <span class="end-date" [class.urgent]="isUrgent(item.endDate)">{{ item.endDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard h1 { color: #1e3a5f; margin: 0 0 24px 0; }
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .kpi-card {
      padding: 24px; border-radius: 12px; text-align: center; color: white;
      display: flex; flex-direction: column;
    }
    .kpi-card.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .kpi-card.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .kpi-card.orange { background: linear-gradient(135deg, #f97316, #ea580c); }
    .kpi-card.purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .kpi-card.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }
    .kpi-card.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .kpi-card.gray { background: linear-gradient(135deg, #94a3b8, #64748b); }
    .kpi-value { font-size: 2rem; font-weight: bold; }
    .kpi-label { font-size: 0.85rem; opacity: 0.9; margin-top: 4px; }
    .section-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-top: 8px; }
    .card {
      background: white; border-radius: 12px; padding: 20px;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .card h3 { margin: 0 0 16px 0; color: #334155; }
    .stat-row {
      display: flex; align-items: center; gap: 12px; padding: 8px 0;
      border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;
    }
    .stat-row span { min-width: 80px; color: #475569; }
    .bar-container { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .bar { background: linear-gradient(90deg, #3b82f6, #6366f1); }
    .contract-bar { background: linear-gradient(90deg, #22c55e, #16a34a); }
    .salary-bar { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .CDI { background: #dcfce7; color: #166534; }
    .CDD { background: #fef9c3; color: #854d0e; }
    .STAGE { background: #dbeafe; color: #1e40af; }
    .EN_ATTENTE { background: #fef9c3; color: #854d0e; }
    .ENTRETIEN { background: #dbeafe; color: #1e40af; }
    .RETENU { background: #dcfce7; color: #166534; }
    .REFUSE { background: #fee2e2; color: #991b1b; }
    .empty { color: #94a3b8; font-style: italic; text-align: center; }
    .expiring-row .emp-name { flex: 1; font-weight: 600; color: #1e293b; }
    .end-date { font-size: 0.85rem; color: #f97316; font-weight: 600; }
    .end-date.urgent { color: #ef4444; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  mobilityStats: any = null;
  departmentStats: {name: string, count: number}[] = [];
  contractStats: {type: string, count: number}[] = [];
  statusStats: {status: string, count: number}[] = [];
  departmentCount = 0;

  // Nouvelles stats
  totalSalaryMass = 0;
  salaryByDeptStats: {name: string, amount: number}[] = [];
  averageTenureMonths = 0;
  expiringContracts: any[] = [];
  expiringCount = 0;

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
}

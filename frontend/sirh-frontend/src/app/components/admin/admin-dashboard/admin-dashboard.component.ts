import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';

/**
 * Dashboard statistiques pour le RH Admin.
 * Affiche les KPI : total employés, répartition par département/contrat, mobilité.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard">
      <h1>📊 Dashboard RH Admin</h1>

      <!-- KPI Cards -->
      <div class="kpi-row">
        <div class="kpi-card blue">
          <span class="kpi-value">{{ stats?.totalEmployees || 0 }}</span>
          <span class="kpi-label">Total Employés</span>
        </div>
        <div class="kpi-card green">
          <span class="kpi-value">{{ departmentCount }}</span>
          <span class="kpi-label">Départements</span>
        </div>
        <div class="kpi-card orange">
          <span class="kpi-value">{{ mobilityStats?.totalApplications || 0 }}</span>
          <span class="kpi-label">Candidatures</span>
        </div>
      </div>

      <!-- Répartition par département -->
      <div class="section-grid">
        <div class="card">
          <h3>🏗️ Par Département</h3>
          <div class="stat-list">
            <div *ngFor="let item of departmentStats" class="stat-row">
              <span>{{ item.name }}</span>
              <div class="bar-container">
                <div class="bar" [style.width.%]="getPercentage(item.count, stats?.totalEmployees)"></div>
              </div>
              <strong>{{ item.count }}</strong>
            </div>
            <p *ngIf="departmentStats.length === 0" class="empty">Aucune donnée</p>
          </div>
        </div>

        <div class="card">
          <h3>📄 Par Type de Contrat</h3>
          <div class="stat-list">
            <div *ngFor="let item of contractStats" class="stat-row">
              <span class="badge" [class]="item.type">{{ item.type }}</span>
              <div class="bar-container">
                <div class="bar contract-bar" [style.width.%]="getPercentage(item.count, stats?.totalEmployees)"></div>
              </div>
              <strong>{{ item.count }}</strong>
            </div>
            <p *ngIf="contractStats.length === 0" class="empty">Aucune donnée</p>
          </div>
        </div>

        <div class="card">
          <h3>🎯 Mobilité Interne</h3>
          <div class="stat-list">
            <div *ngFor="let item of statusStats" class="stat-row">
              <span class="badge" [class]="item.status">{{ item.status }}</span>
              <strong>{{ item.count }}</strong>
            </div>
            <p *ngIf="statusStats.length === 0" class="empty">Aucune donnée</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard h1 { color: #1e3a5f; margin: 0 0 24px 0; }
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      padding: 24px; border-radius: 12px; text-align: center; color: white;
      display: flex; flex-direction: column;
    }
    .kpi-card.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .kpi-card.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .kpi-card.orange { background: linear-gradient(135deg, #f97316, #ea580c); }
    .kpi-value { font-size: 2.5rem; font-weight: bold; }
    .kpi-label { font-size: 0.85rem; opacity: 0.9; margin-top: 4px; }
    .section-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
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
    .bar { height: 100%; background: linear-gradient(90deg, #3b82f6, #6366f1); border-radius: 4px; transition: width 0.5s ease; }
    .contract-bar { background: linear-gradient(90deg, #22c55e, #16a34a); }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .CDI { background: #dcfce7; color: #166534; }
    .CDD { background: #fef9c3; color: #854d0e; }
    .STAGE { background: #dbeafe; color: #1e40af; }
    .EN_ATTENTE { background: #fef9c3; color: #854d0e; }
    .ENTRETIEN { background: #dbeafe; color: #1e40af; }
    .RETENU { background: #dcfce7; color: #166534; }
    .REFUSE { background: #fee2e2; color: #991b1b; }
    .empty { color: #94a3b8; font-style: italic; text-align: center; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  mobilityStats: any = null;
  departmentStats: {name: string, count: number}[] = [];
  contractStats: {type: string, count: number}[] = [];
  statusStats: {status: string, count: number}[] = [];
  departmentCount = 0;

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
}

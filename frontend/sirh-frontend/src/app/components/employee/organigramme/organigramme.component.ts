import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Organigramme de l'entreprise.
 * Affiche la structure organisationnelle : départements -> services avec nombre d'employés.
 */
@Component({
  selector: 'app-organigramme',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="organigramme">
      <div class="page-header">
        <div class="header-icon">🏛️</div>
        <h1>Organigramme de l'entreprise</h1>
        <p class="header-subtitle">Structure organisationnelle et répartition des effectifs</p>
      </div>

      <!-- Stats summary -->
      <div class="stats-bar" *ngIf="data.length > 0">
        <div class="stat-chip">
          <span class="stat-icon">🏗️</span>
          <span class="stat-value">{{ data.length }}</span>
          <span class="stat-label">Départements</span>
        </div>
        <div class="stat-chip">
          <span class="stat-icon">📂</span>
          <span class="stat-value">{{ getTotalServices() }}</span>
          <span class="stat-label">Services</span>
        </div>
        <div class="stat-chip">
          <span class="stat-icon">👥</span>
          <span class="stat-value">{{ getTotalEmployees() }}</span>
          <span class="stat-label">Employés</span>
        </div>
      </div>

      <!-- Tree -->
      <div class="tree" *ngIf="data.length > 0">
        <!-- Root node -->
        <div class="root-node">
          <div class="node company-node">
            <div class="node-icon-wrap company-icon-wrap">🏢</div>
            <div class="node-title">Entreprise</div>
            <div class="node-meta">{{ getTotalEmployees() }} employé(s) • {{ data.length }} département(s)</div>
          </div>
        </div>

        <div class="connector-v"></div>

        <!-- Departments grid -->
        <div class="departments-grid">
          <div class="dept-card" *ngFor="let node of data; let i = index"
               [class.expanded]="expandedDepts[i]"
               (click)="toggleDepartment(i)">

            <div class="dept-header">
              <div class="dept-icon-wrap">🏗️</div>
              <div class="dept-info">
                <div class="dept-name">{{ node.department.name }}</div>

                <!-- Manager responsable du département -->
                <div class="dept-manager" *ngIf="node.department.manager">
                  <span class="mgr-icon">👔</span>
                  <span class="mgr-label">Managé par</span>
                  <span class="mgr-name">{{ node.department.manager.firstName }} {{ node.department.manager.lastName }}</span>
                </div>
                <div class="dept-manager dept-manager-vacant" *ngIf="!node.department.manager">
                  <span class="mgr-icon">👔</span>
                  <span class="mgr-vacant">Aucun manager désigné</span>
                </div>

                <div class="dept-meta">
                  <span class="meta-tag services-tag">
                    📂 {{ node.services?.length || 0 }} service(s)
                  </span>
                  <span class="meta-tag employees-tag">
                    👥 {{ node.totalEmployeeCount }} employé(s)
                  </span>
                </div>
              </div>
              <div class="dept-expand">
                <span class="expand-arrow" [class.rotated]="expandedDepts[i]">▶</span>
              </div>
            </div>

            <!-- Services inside department -->
            <div class="services-container" *ngIf="expandedDepts[i]" (click)="$event.stopPropagation()">
              <div class="service-row" *ngFor="let svcNode of node.services">
                <div class="service-dot"></div>
                <div class="service-info">
                  <span class="service-name">{{ svcNode.service.name }}</span>
                </div>
                <div class="service-count-badge">
                  <span class="count-number">{{ svcNode.employeeCount }}</span>
                  <span class="count-label">employé(s)</span>
                </div>
              </div>

              <div class="no-services" *ngIf="!node.services || node.services.length === 0">
                Aucun service dans ce département
              </div>

              <div class="service-row unassigned-row" *ngIf="node.unassignedEmployees?.length > 0">
                <div class="service-dot unassigned-dot"></div>
                <div class="service-info">
                  <span class="service-name unassigned-name">Non affectés</span>
                </div>
                <div class="service-count-badge unassigned-badge">
                  <span class="count-number">{{ node.unassignedEmployees.length }}</span>
                  <span class="count-label">employé(s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="data.length === 0 && !loading">
        <div class="empty-icon">📭</div>
        <p>Aucun département trouvé.</p>
        <span>Veuillez créer des départements dans l'espace RH Admin.</span>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement de l'organigramme...</p>
      </div>
    </div>
  `,
  styles: [`
    .organigramme {
      max-width: 1200px; margin: 0 auto; padding-bottom: 60px;
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    /* Header */
    .page-header {
      text-align: center; margin-bottom: 32px;
    }
    .header-icon { font-size: 2.5rem; margin-bottom: 8px; }
    .page-header h1 {
      color: #1e293b; margin: 0 0 8px 0; font-size: 1.8rem; font-weight: 800;
      background: linear-gradient(135deg, #1e3a5f, #3b82f6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .header-subtitle { color: #64748b; font-size: 0.95rem; margin: 0; }

    /* Stats bar */
    .stats-bar {
      display: flex; justify-content: center; gap: 16px; margin-bottom: 36px; flex-wrap: wrap;
    }
    .stat-chip {
      display: flex; align-items: center; gap: 8px;
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 10px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .stat-icon { font-size: 1.2rem; }
    .stat-value { font-size: 1.3rem; font-weight: 800; color: #1e293b; }
    .stat-label { font-size: 0.8rem; color: #64748b; }

    /* Tree */
    .tree { display: flex; flex-direction: column; align-items: center; }

    /* Root node */
    .root-node { display: flex; justify-content: center; margin-bottom: 0; }
    .company-node {
      background: linear-gradient(135deg, #1e3a5f, #2563eb);
      border: none; border-radius: 16px; padding: 20px 36px; text-align: center;
      box-shadow: 0 8px 24px rgba(37,99,235,0.25);
    }
    .company-icon-wrap { font-size: 2rem; margin-bottom: 6px; }
    .node-title { font-weight: 800; color: white; font-size: 1.15rem; }
    .node-meta { color: rgba(255,255,255,0.8); font-size: 0.8rem; margin-top: 4px; }

    .connector-v { width: 3px; height: 28px; background: linear-gradient(180deg, #2563eb, #cbd5e1); border-radius: 2px; }

    /* Department grid */
    .departments-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 20px; width: 100%; margin-top: 4px;
    }

    .dept-card {
      background: white; border-radius: 16px; border: 2px solid #e2e8f0;
      overflow: hidden; cursor: pointer; transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .dept-card:hover { border-color: #93c5fd; box-shadow: 0 8px 24px rgba(59,130,246,0.12); transform: translateY(-2px); }
    .dept-card.expanded { border-color: #3b82f6; }

    .dept-header {
      display: flex; align-items: center; gap: 14px; padding: 18px 20px;
    }
    .dept-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; flex-shrink: 0;
    }
    .dept-info { flex: 1; min-width: 0; }
    .dept-name { font-weight: 700; color: #1e293b; font-size: 1.05rem; }

    /* Manager responsable du département */
    .dept-manager {
      display: flex; align-items: center; gap: 6px;
      margin-top: 6px; padding: 4px 10px;
      background: linear-gradient(135deg, #fefce8, #fef9c3);
      border: 1px solid #fde68a; border-radius: 8px;
      width: fit-content; max-width: 100%;
    }
    .mgr-icon { font-size: 0.95rem; flex-shrink: 0; }
    .mgr-label { font-size: 0.72rem; color: #854d0e; font-weight: 500; }
    .mgr-name {
      font-size: 0.82rem; color: #713f12; font-weight: 700;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .dept-manager-vacant {
      background: #f8fafc; border-color: #e2e8f0;
    }
    .mgr-vacant { font-size: 0.78rem; color: #94a3b8; font-style: italic; }

    .dept-meta { display: flex; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
    .meta-tag {
      font-size: 0.75rem; padding: 3px 10px; border-radius: 20px; font-weight: 500;
    }
    .services-tag { background: #f0fdf4; color: #166534; }
    .employees-tag { background: #eff6ff; color: #1d4ed8; }

    .dept-expand { flex-shrink: 0; }
    .expand-arrow {
      display: inline-block; font-size: 0.7rem; color: #94a3b8;
      transition: transform 0.3s ease;
    }
    .expand-arrow.rotated { transform: rotate(90deg); }

    /* Services container */
    .services-container {
      border-top: 1px solid #f1f5f9; padding: 12px 20px 16px;
      background: #f8fafc; animation: slideDown 0.25s ease;
    }
    @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }

    .service-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 10px; margin-bottom: 6px;
      background: white; border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .service-row:last-child { margin-bottom: 0; }
    .service-row:hover { border-color: #a7f3d0; background: #f0fdf4; }

    .service-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669); flex-shrink: 0;
    }
    .unassigned-dot { background: linear-gradient(135deg, #f59e0b, #d97706); }

    .service-info { flex: 1; }
    .service-name { font-weight: 600; color: #334155; font-size: 0.9rem; }
    .unassigned-name { color: #92400e; font-style: italic; }

    .service-count-badge {
      display: flex; align-items: center; gap: 5px;
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      padding: 5px 14px; border-radius: 20px;
    }
    .unassigned-badge { background: linear-gradient(135deg, #fef3c7, #fde68a); }
    .count-number { font-weight: 800; color: #047857; font-size: 1rem; }
    .unassigned-badge .count-number { color: #92400e; }
    .count-label { font-size: 0.7rem; color: #64748b; }

    .no-services {
      text-align: center; color: #94a3b8; font-style: italic;
      font-size: 0.85rem; padding: 16px 0;
    }

    /* Empty & loading states */
    .empty-state {
      text-align: center; padding: 60px 20px; color: #94a3b8;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-state p { font-size: 1.1rem; color: #64748b; margin: 0 0 4px 0; }
    .empty-state span { font-size: 0.85rem; }

    .loading-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #3b82f6;
      border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 480px) {
      .departments-grid { grid-template-columns: 1fr; }
      .stats-bar { flex-direction: column; align-items: center; }
    }
  `]
})
export class OrganigrammeComponent implements OnInit {
  data: any[] = [];
  expandedDepts: boolean[] = [];
  loading = true;

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.employeeApi.getOrganigramme().subscribe({
      next: (data) => {
        this.data = data;
        this.expandedDepts = data.map(() => true);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleDepartment(index: number): void {
    this.expandedDepts[index] = !this.expandedDepts[index];
  }

  getTotalEmployees(): number {
    return this.data.reduce((sum, node) => sum + node.totalEmployeeCount, 0);
  }

  getTotalServices(): number {
    return this.data.reduce((sum, node) => sum + (node.services?.length || 0), 0);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Organigramme de l'entreprise.
 * Affiche la structure organisationnelle : départements -> services -> employés.
 */
@Component({
  selector: 'app-organigramme',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="organigramme">
      <h1>Organigramme de l'entreprise</h1>

      <div class="tree" *ngIf="data.length > 0">
        <!-- Noeud racine -->
        <div class="root-node">
          <div class="node company-node">
            <div class="node-icon">🏢</div>
            <div class="node-title">Entreprise</div>
            <div class="node-subtitle">{{ getTotalEmployees() }} employé(s) &bull; {{ data.length }} département(s)</div>
          </div>
        </div>

        <div class="connector-vertical"></div>
        <div class="connector-horizontal" *ngIf="data.length > 1"></div>

        <!-- Départements -->
        <div class="departments-row">
          <div class="department-branch" *ngFor="let node of data; let i = index">
            <div class="branch-connector"></div>

            <!-- Noeud département -->
            <div class="node dept-node" (click)="toggleDepartment(i)">
              <div class="node-icon">🏗️</div>
              <div class="node-title">{{ node.department.name }}</div>
              <div class="node-subtitle">{{ node.totalEmployeeCount }} employé(s)</div>
              <div class="expand-icon">{{ expandedDepts[i] ? '▼' : '▶' }}</div>
            </div>

            <!-- Contenu du département (Services & Employés non assignés) -->
            <div class="dept-content" *ngIf="expandedDepts[i]">
              <div class="dept-connector"></div>

              <!-- Services -->
              <div class="services-list" *ngIf="node.services?.length > 0">
                <div class="service-item" *ngFor="let svcNode of node.services; let j = index">
                  <div class="node service-node" (click)="toggleService(i, j)">
                    <div class="node-icon">📂</div>
                    <div class="node-title">{{ svcNode.service.name }}</div>
                    <div class="node-subtitle">{{ svcNode.employeeCount }} employé(s)</div>
                    <div class="expand-icon">{{ isServiceExpanded(i, j) ? '▼' : '▶' }}</div>
                  </div>

                  <!-- Employés du service -->
                  <div class="employees-list" *ngIf="isServiceExpanded(i, j) && svcNode.employees?.length > 0">
                    <div class="employee-connector"></div>
                    <div class="employee-node" *ngFor="let emp of svcNode.employees">
                      <div class="emp-avatar">{{ getInitials(emp.firstName, emp.lastName) }}</div>
                      <div class="emp-info">
                        <div class="emp-name">{{ emp.firstName }} {{ emp.lastName }}</div>
                        <div class="emp-position">{{ emp.position || 'Non défini' }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Message aucun employé dans le service -->
                  <div class="no-employees" *ngIf="isServiceExpanded(i, j) && svcNode.employees?.length === 0">
                    Aucun employé dans ce service
                  </div>
                </div>
              </div>

              <!-- Employés sans service -->
              <div class="unassigned-group" *ngIf="node.unassignedEmployees?.length > 0">
                <div class="unassigned-label">Employés rattachés au département (hors service)</div>
                <div class="employees-list standalone-emps">
                  <div class="employee-connector standalone-conn"></div>
                  <div class="employee-node" *ngFor="let emp of node.unassignedEmployees">
                    <div class="emp-avatar">{{ getInitials(emp.firstName, emp.lastName) }}</div>
                    <div class="emp-info">
                      <div class="emp-name">{{ emp.firstName }} {{ emp.lastName }}</div>
                      <div class="emp-position">{{ emp.position || 'Non défini' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="no-data" *ngIf="node.services?.length === 0 && node.unassignedEmployees?.length === 0">
                Aucune donnée dans ce département
              </div>

            </div>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="data.length === 0 && !loading">
        Aucun département trouvé. Veuillez créer des départements dans l'espace RH Admin.
      </div>

      <div class="loading" *ngIf="loading">
        Chargement de l'organigramme...
      </div>
    </div>
  `,
  styles: [`
    .organigramme { max-width: 1400px; margin: 0 auto; padding-bottom: 50px; overflow-x: auto; }
    .organigramme h1 { color: #1e3a5f; margin: 0 0 32px 0; text-align: center; }

    .tree { display: flex; flex-direction: column; align-items: center; min-width: max-content; }

    .root-node { display: flex; justify-content: center; }

    .node {
      background: white;
      border-radius: 12px;
      padding: 16px 24px;
      text-align: center;
      border: 2px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: default;
      position: relative;
    }
    .node-icon { font-size: 1.6rem; margin-bottom: 4px; }
    .node-title { font-weight: 700; color: #1e293b; font-size: 1rem; }
    .node-subtitle { color: #64748b; font-size: 0.8rem; margin-top: 4px; }

    .company-node { border-color: #3b82f6; background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 20px 32px; }
    .company-node .node-title { color: #1d4ed8; font-size: 1.2rem; }

    .dept-node {
      cursor: pointer;
      transition: all 0.2s;
      border-color: #cbd5e1;
      min-width: 200px;
      background: #f8fafc;
    }
    .dept-node:hover { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59,130,246,0.15); background: white; }
    
    .expand-icon {
      position: absolute; top: 8px; right: 10px; font-size: 0.7rem; color: #94a3b8;
    }

    .connector-vertical { width: 2px; height: 24px; background: #cbd5e1; }
    .connector-horizontal { height: 2px; background: #cbd5e1; width: calc(100% - 200px); }

    .departments-row {
      display: flex; justify-content: center; gap: 32px; flex-wrap: nowrap; padding-top: 0;
    }
    .department-branch {
      display: flex; flex-direction: column; align-items: center; min-width: 280px;
    }
    .branch-connector { width: 2px; height: 20px; background: #cbd5e1; }

    /* Contenu du département */
    .dept-content {
      display: flex; flex-direction: column; align-items: center; width: 100%; position: relative;
    }
    .dept-connector { width: 2px; height: 16px; background: #cbd5e1; }

    /* Services */
    .services-list {
      display: flex; flex-direction: column; gap: 16px; width: 100%; align-items: center;
    }
    .service-item {
      display: flex; flex-direction: column; align-items: center; width: 100%;
    }
    
    .service-node {
      cursor: pointer; padding: 12px 20px; background: white; border-color: #10b981; 
      min-width: 200px; transition: all 0.2s; box-shadow: 0 1px 4px rgba(16,185,129,0.1);
    }
    .service-node:hover { box-shadow: 0 4px 12px rgba(16,185,129,0.2); }
    .service-node .node-title { color: #047857; }

    /* Employés */
    .employees-list {
      margin-top: 12px; display: flex; flex-direction: column; gap: 8px;
      position: relative; padding-left: 24px; min-width: 220px; align-items: flex-start;
    }
    .employee-connector {
      position: absolute; left: 10px; top: 0; bottom: 15px; width: 2px; background: #e2e8f0;
    }

    .standalone-emps { margin-top: 8px; padding-left: 0; align-items: center; }
    .standalone-conn { display: none; }

    .employee-node {
      display: flex; align-items: center; gap: 12px; background: white; padding: 10px 16px;
      border-radius: 10px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      position: relative; width: 100%; box-sizing: border-box; text-align: left;
    }
    .employees-list:not(.standalone-emps) .employee-node::before {
      content: ''; position: absolute; left: -14px; top: 50%; width: 14px; height: 2px; background: #e2e8f0;
    }

    .emp-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }
    .emp-name { font-weight: 600; color: #1e293b; font-size: 0.85rem; }
    .emp-position { color: #64748b; font-size: 0.75rem; }

    .unassigned-group {
      margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 16px; width: 100%; display: flex; flex-direction: column; align-items: center;
    }
    .unassigned-label { color: #64748b; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }

    .no-employees, .no-data {
      margin-top: 12px; color: #94a3b8; font-style: italic; font-size: 0.8rem;
    }
    .empty, .loading { text-align: center; color: #94a3b8; font-style: italic; margin-top: 60px; }
  `]
})
export class OrganigrammeComponent implements OnInit {
  data: any[] = [];
  expandedDepts: boolean[] = [];
  
  // Track expanded state for services: deptIndex -> serviceIndex -> boolean
  expandedServices: { [deptIdx: number]: { [svcIdx: number]: boolean } } = {};
  
  loading = true;

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.employeeApi.getOrganigramme().subscribe({
      next: (data) => {
        this.data = data;
        // Expand departments by default
        this.expandedDepts = data.map(() => true);
        
        // Initialize service expanded states (expand services by default too for visibility)
        data.forEach((dept: any, i: number) => {
          this.expandedServices[i] = {};
          if (dept.services && Array.isArray(dept.services)) {
            dept.services.forEach((_: any, j: number) => {
              this.expandedServices[i][j] = true;
            });
          }
        });
        
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleDepartment(index: number): void {
    this.expandedDepts[index] = !this.expandedDepts[index];
  }

  toggleService(deptIndex: number, svcIndex: number): void {
    if (!this.expandedServices[deptIndex]) {
      this.expandedServices[deptIndex] = {};
    }
    this.expandedServices[deptIndex][svcIndex] = !this.expandedServices[deptIndex][svcIndex];
  }

  isServiceExpanded(deptIndex: number, svcIndex: number): boolean {
    return this.expandedServices[deptIndex]?.[svcIndex] ?? false;
  }

  getTotalEmployees(): number {
    return this.data.reduce((sum, node) => sum + node.totalEmployeeCount, 0);
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
  }
}

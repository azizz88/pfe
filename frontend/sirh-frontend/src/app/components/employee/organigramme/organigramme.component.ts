import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Organigramme de l'entreprise.
 * Affiche la structure organisationnelle : départements et leurs employés.
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
            <div class="node-icon">&#127970;</div>
            <div class="node-title">Entreprise</div>
            <div class="node-subtitle">{{ getTotalEmployees() }} employ&eacute;s &bull; {{ data.length }} d&eacute;partements</div>
          </div>
        </div>

        <!-- Ligne de connexion vers les départements -->
        <div class="connector-vertical"></div>
        <div class="connector-horizontal" *ngIf="data.length > 1"></div>

        <!-- Départements -->
        <div class="departments-row">
          <div class="department-branch" *ngFor="let node of data; let i = index">
            <!-- Ligne verticale vers le département -->
            <div class="branch-connector"></div>

            <!-- Noeud département -->
            <div class="node dept-node" (click)="toggleDepartment(i)">
              <div class="node-icon">&#127959;&#65039;</div>
              <div class="node-title">{{ node.department.name }}</div>
              <div class="node-subtitle">{{ node.employeeCount }} employ&eacute;(s)</div>
              <div class="expand-icon">{{ expandedDepts[i] ? '&#9660;' : '&#9654;' }}</div>
            </div>

            <!-- Employés du département -->
            <div class="employees-list" *ngIf="expandedDepts[i] && node.employees.length > 0">
              <div class="employee-connector"></div>
              <div class="employee-node" *ngFor="let emp of node.employees">
                <div class="emp-avatar">{{ getInitials(emp.firstName, emp.lastName) }}</div>
                <div class="emp-info">
                  <div class="emp-name">{{ emp.firstName }} {{ emp.lastName }}</div>
                  <div class="emp-position">{{ emp.position || 'Non d&eacute;fini' }}</div>
                  <div class="emp-matricule">{{ emp.matricule }}</div>
                </div>
              </div>
            </div>

            <div class="no-employees" *ngIf="expandedDepts[i] && node.employees.length === 0">
              Aucun employ&eacute; dans ce d&eacute;partement
            </div>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="data.length === 0 && !loading">
        Aucun d&eacute;partement trouv&eacute;. Veuillez cr&eacute;er des d&eacute;partements dans l'espace RH Admin.
      </div>

      <div class="loading" *ngIf="loading">
        Chargement de l'organigramme...
      </div>
    </div>
  `,
  styles: [`
    .organigramme { max-width: 1200px; margin: 0 auto; }
    .organigramme h1 { color: #1e3a5f; margin: 0 0 32px 0; }

    .tree { display: flex; flex-direction: column; align-items: center; }

    .root-node { display: flex; justify-content: center; }

    .node {
      background: white;
      border-radius: 12px;
      padding: 20px 28px;
      text-align: center;
      border: 2px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      cursor: default;
      position: relative;
    }
    .node-icon { font-size: 1.8rem; margin-bottom: 6px; }
    .node-title { font-weight: 700; color: #1e293b; font-size: 1.1rem; }
    .node-subtitle { color: #64748b; font-size: 0.8rem; margin-top: 4px; }

    .company-node { border-color: #3b82f6; background: linear-gradient(135deg, #eff6ff, #dbeafe); }
    .company-node .node-title { color: #1d4ed8; font-size: 1.3rem; }

    .dept-node {
      cursor: pointer;
      transition: all 0.2s;
      border-color: #e2e8f0;
      min-width: 180px;
    }
    .dept-node:hover { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59,130,246,0.15); }
    .expand-icon {
      position: absolute;
      top: 8px;
      right: 10px;
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .connector-vertical {
      width: 2px;
      height: 24px;
      background: #cbd5e1;
    }
    .connector-horizontal {
      height: 2px;
      background: #cbd5e1;
      width: 60%;
      max-width: 800px;
    }

    .departments-row {
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
      width: 100%;
    }
    .department-branch {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .branch-connector {
      width: 2px;
      height: 20px;
      background: #cbd5e1;
    }

    .employees-list {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
      padding-left: 20px;
    }
    .employee-connector {
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
    }

    .employee-node {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      position: relative;
      min-width: 200px;
    }
    .employee-node::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 50%;
      width: 12px;
      height: 2px;
      background: #e2e8f0;
    }

    .emp-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .emp-info { text-align: left; }
    .emp-name { font-weight: 600; color: #1e293b; font-size: 0.85rem; }
    .emp-position { color: #64748b; font-size: 0.75rem; }
    .emp-matricule { color: #94a3b8; font-size: 0.7rem; }

    .no-employees {
      margin-top: 12px;
      color: #94a3b8;
      font-style: italic;
      font-size: 0.85rem;
    }

    .empty, .loading { text-align: center; color: #94a3b8; font-style: italic; margin-top: 60px; }
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
    return this.data.reduce((sum, node) => sum + node.employeeCount, 0);
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
  }
}

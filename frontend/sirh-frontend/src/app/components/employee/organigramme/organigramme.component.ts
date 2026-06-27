import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Organigramme de l'entreprise.
 * Affiche la structure organisationnelle : départements -> services avec nombre d'employés.
 */
@Component({
  selector: 'app-organigramme',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="page page--narrow org fade-in">
      <div class="page-header org-header">
        <div class="page-header__title">
          <h1>Organigramme de l'entreprise</h1>
          <p class="page-header__sub">Structure organisationnelle et répartition des effectifs</p>
        </div>
      </div>

      <!-- Stats summary -->
      <div class="org-stats" *ngIf="data.length > 0">
        <div class="stat">
          <div class="stat__icon"><app-icon name="department" [size]="20" /></div>
          <div class="stat__body">
            <span class="stat__value">{{ data.length }}</span>
            <span class="stat__label">Départements</span>
          </div>
        </div>
        <div class="stat">
          <div class="stat__icon"><app-icon name="layers" [size]="20" /></div>
          <div class="stat__body">
            <span class="stat__value">{{ getTotalServices() }}</span>
            <span class="stat__label">Services</span>
          </div>
        </div>
        <div class="stat">
          <div class="stat__icon"><app-icon name="employees" [size]="20" /></div>
          <div class="stat__body">
            <span class="stat__value">{{ getTotalEmployees() }}</span>
            <span class="stat__label">Employés</span>
          </div>
        </div>
      </div>

      <!-- Tree -->
      <div class="tree" *ngIf="data.length > 0">
        <!-- Root node -->
        <div class="root-node">
          <div class="node company-node">
            <div class="company-icon"><app-icon name="building" [size]="22" /></div>
            <div class="node-title">Entreprise</div>
            <div class="node-meta">{{ getTotalEmployees() }} employé(s) • {{ data.length }} département(s)</div>
          </div>
        </div>

        <div class="connector-v"></div>

        <!-- Departments grid -->
        <div class="departments-grid">
          <div class="card dept-card" *ngFor="let node of data; let i = index"
               [class.expanded]="expandedDepts[i]"
               (click)="toggleDepartment(i)">

            <div class="dept-header">
              <div class="dept-icon-wrap"><app-icon name="department" [size]="20" /></div>
              <div class="dept-info">
                <div class="dept-name">{{ node.department.name }}</div>

                <!-- Manager responsable du département -->
                <div class="dept-manager" *ngIf="node.department.manager">
                  <app-icon name="manager" [size]="13" />
                  <span class="mgr-label">Managé par</span>
                  <span class="mgr-name">{{ node.department.manager.firstName }} {{ node.department.manager.lastName }}</span>
                </div>
                <div class="dept-manager dept-manager-vacant" *ngIf="!node.department.manager">
                  <app-icon name="manager" [size]="13" />
                  <span class="mgr-vacant">Aucun manager désigné</span>
                </div>

                <div class="dept-meta">
                  <span class="badge badge--info">
                    <app-icon name="layers" [size]="12" /> {{ node.services?.length || 0 }} service(s)
                  </span>
                  <span class="badge badge--accent">
                    <app-icon name="employees" [size]="12" /> {{ node.totalEmployeeCount }} employé(s)
                  </span>
                </div>
              </div>
              <div class="dept-expand">
                <span class="expand-arrow" [class.rotated]="expandedDepts[i]"><app-icon name="next" [size]="16" /></span>
              </div>
            </div>

            <!-- Services inside department -->
            <div class="services-container" *ngIf="expandedDepts[i]" (click)="$event.stopPropagation()">
              <div class="service-row" *ngFor="let svcNode of node.services">
                <div class="service-dot"></div>
                <div class="service-info">
                  <span class="service-name">{{ svcNode.service.name }}</span>
                </div>
                <span class="badge badge--success service-count">{{ svcNode.employeeCount }} employé(s)</span>
              </div>

              <div class="no-services" *ngIf="!node.services || node.services.length === 0">
                Aucun service dans ce département
              </div>

              <div class="service-row unassigned-row" *ngIf="node.unassignedEmployees?.length > 0">
                <div class="service-dot unassigned-dot"></div>
                <div class="service-info">
                  <span class="service-name unassigned-name">Non affectés</span>
                </div>
                <span class="badge badge--warning service-count">{{ node.unassignedEmployees.length }} employé(s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="data.length === 0 && !loading">
        <div class="empty-state__icon"><app-icon name="inbox" [size]="26" /></div>
        <p class="empty-state__title">Aucun département trouvé</p>
        <p class="empty-state__text">Veuillez créer des départements dans l'espace RH Admin.</p>
      </div>

      <div class="loading-row" *ngIf="loading">
        <span class="spinner"></span> Chargement de l'organigramme…
      </div>
    </div>
  `,
  styles: [`
    .org { padding-bottom: var(--sp-9); }
    .org-header { justify-content: center; text-align: center; }
    .org-header .page-header__title { align-items: center; }

    /* Stats */
    .org-stats {
      display: flex; justify-content: center; flex-wrap: wrap;
      gap: var(--sp-3); margin-bottom: var(--sp-7);
    }
    .org-stats .stat { min-width: 200px; }

    /* Tree */
    .tree { display: flex; flex-direction: column; align-items: center; }

    /* Root node — accent rôle */
    .root-node { display: flex; justify-content: center; }
    .company-node {
      background: var(--c-accent); border-radius: var(--r-lg);
      padding: var(--sp-4) var(--sp-7); text-align: center;
      box-shadow: var(--sh-md);
    }
    .company-icon { color: #fff; display: inline-flex; margin-bottom: 4px; }
    .node-title { font-weight: 650; color: #fff; font-size: var(--fs-16); }
    .node-meta { color: rgba(255,255,255,.82); font-size: var(--fs-12); margin-top: 2px; }

    .connector-v { width: 2px; height: 26px; background: var(--c-border-strong); }

    /* Department grid */
    .departments-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: var(--sp-4); width: 100%;
    }
    .dept-card {
      overflow: hidden; cursor: pointer;
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
      animation: fade-in .3s ease both;
    }
    .dept-card:hover { border-color: var(--c-border-strong); box-shadow: var(--sh-md); transform: translateY(-2px); }
    .dept-card.expanded { border-color: var(--c-accent); }

    .dept-header { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-4) var(--sp-5); }
    .dept-icon-wrap {
      flex: none; width: 44px; height: 44px; border-radius: var(--r-md);
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--c-accent-soft); color: var(--c-accent-ink);
    }
    .dept-info { flex: 1; min-width: 0; }
    .dept-name { font-weight: 650; color: var(--c-ink); font-size: var(--fs-15); }

    /* Manager responsable */
    .dept-manager {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 6px; padding: 3px 9px;
      background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--r-sm);
      max-width: 100%; color: var(--c-ink-soft);
    }
    .mgr-label { font-size: var(--fs-12); color: var(--c-muted); }
    .mgr-name {
      font-size: var(--fs-13); color: var(--c-ink); font-weight: 600;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .dept-manager-vacant { background: var(--c-surface-3); border-color: var(--c-border); color: var(--c-faint); }
    .mgr-vacant { font-size: var(--fs-12); color: var(--c-muted); font-style: italic; }

    .dept-meta { display: flex; gap: var(--sp-2); margin-top: var(--sp-2); flex-wrap: wrap; }

    .dept-expand { flex: none; }
    .expand-arrow { display: inline-flex; color: var(--c-faint); transition: transform var(--transition); }
    .expand-arrow.rotated { transform: rotate(90deg); }

    /* Services container */
    .services-container {
      border-top: 1px solid var(--c-border); padding: var(--sp-3) var(--sp-5) var(--sp-4);
      background: var(--c-surface-2);
    }
    .service-row {
      display: flex; align-items: center; gap: var(--sp-3);
      padding: var(--sp-2) var(--sp-3); border-radius: var(--r-sm); margin-bottom: 6px;
      background: var(--c-surface); border: 1px solid var(--c-border);
      transition: border-color var(--transition);
    }
    .service-row:last-child { margin-bottom: 0; }
    .service-row:hover { border-color: var(--c-border-strong); }

    .service-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c-success); flex: none; }
    .unassigned-dot { background: var(--c-warning); }

    .service-info { flex: 1; min-width: 0; }
    .service-name { font-weight: 600; color: var(--c-ink-soft); font-size: var(--fs-14); }
    .unassigned-name { color: var(--c-warning-ink); font-style: italic; }
    .service-count { flex: none; }

    .no-services {
      text-align: center; color: var(--c-muted); font-style: italic;
      font-size: var(--fs-13); padding: var(--sp-4) 0;
    }

    @media (max-width: 560px) {
      .departments-grid { grid-template-columns: 1fr; }
      .org-stats { flex-direction: column; align-items: stretch; }
      .org-stats .stat { min-width: 0; }
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

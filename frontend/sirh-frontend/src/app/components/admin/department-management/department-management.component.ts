import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Gestion des départements et services pour le RH Admin.
 * Chaque département affiche ses services avec possibilité d'ajouter/modifier/supprimer.
 */
@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="management">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header__title">
          <h1>Gestion des Départements &amp; Services</h1>
          <span class="page-header__sub">Organisez la structure de votre entreprise</span>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" (click)="showDeptForm = true; resetDeptForm()">
            <app-icon name="add" [size]="18" />
            Nouveau département
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row" *ngIf="departments.length > 0">
        <div class="stat">
          <span class="stat__icon"><app-icon name="department" [size]="20" /></span>
          <span class="stat__body">
            <span class="stat__value">{{ departments.length }}</span>
            <span class="stat__label">Départements</span>
          </span>
        </div>
        <div class="stat">
          <span class="stat__icon"><app-icon name="layers" [size]="20" /></span>
          <span class="stat__body">
            <span class="stat__value">{{ allServices.length }}</span>
            <span class="stat__label">Services</span>
          </span>
        </div>
      </div>

      <!-- Tree -->
      <div class="tree" *ngIf="departments.length > 0">
        <!-- Root -->
        <div class="tree-root">
          <div class="root-card">
            <app-icon name="building" [size]="20" />
            <span class="root-label">Entreprise</span>
          </div>
        </div>

        <div class="trunk"></div>

        <!-- Departments -->
        <div class="dept-cards">
          <div class="dept-branch" *ngFor="let dept of departments; let idx = index"
               [style.animation-delay]="idx * 50 + 'ms'">
            <div class="branch-line"></div>

            <div class="dept-card" [class.expanded]="expandedDepts[dept.id]">
              <div class="dept-head" (click)="toggleDept(dept.id)">
                <div class="dept-left">
                  <div class="dept-icon-box"><app-icon name="department" [size]="20" /></div>
                  <div class="dept-details">
                    <h3>{{ dept.name }}</h3>

                    <!-- Manager actuel + actions -->
                    <div class="mgr-strip" *ngIf="dept.manager" (click)="$event.stopPropagation()">
                      <app-icon name="manager" [size]="15" />
                      <span class="mgr-strip-label">Managé par</span>
                      <span class="mgr-strip-name">{{ dept.manager.firstName }} {{ dept.manager.lastName }}</span>
                      <button class="icon-btn icon-btn--sm" (click)="openAssignManager(dept)" aria-label="Changer de manager" title="Changer">
                        <app-icon name="refresh" [size]="14" />
                      </button>
                      <button class="icon-btn icon-btn--sm icon-btn--danger" (click)="removeManager(dept)" aria-label="Retirer le manager" title="Retirer">
                        <app-icon name="close" [size]="14" />
                      </button>
                    </div>
                    <div class="mgr-strip mgr-strip-vacant" *ngIf="!dept.manager" (click)="$event.stopPropagation()">
                      <app-icon name="manager" [size]="15" />
                      <span class="mgr-strip-vacant-label">Aucun manager</span>
                      <button class="btn btn--secondary btn--sm" (click)="openAssignManager(dept)">
                        <app-icon name="add" [size]="14" /> Assigner
                      </button>
                    </div>

                    <div class="dept-badges">
                      <span class="badge badge--info"><app-icon name="layers" [size]="13" /> {{ getServicesForDept(dept.id).length }} service(s)</span>
                      <span class="badge badge--neutral desc-badge" *ngIf="dept.description">{{ dept.description }}</span>
                    </div>
                  </div>
                </div>
                <div class="dept-right">
                  <div class="dept-actions" (click)="$event.stopPropagation()">
                    <button class="icon-btn" (click)="editDepartment(dept)" aria-label="Modifier le département" title="Modifier">
                      <app-icon name="edit" [size]="16" />
                    </button>
                    <button class="icon-btn icon-btn--danger" (click)="deleteDepartment(dept.id)" aria-label="Supprimer le département" title="Supprimer">
                      <app-icon name="delete" [size]="16" />
                    </button>
                  </div>
                  <span class="chevron" [class.open]="expandedDepts[dept.id]"><app-icon name="next" [size]="18" /></span>
                </div>
              </div>

              <!-- Services tree inside dept -->
              <div class="svc-panel" *ngIf="expandedDepts[dept.id]">
                <div class="svc-header">
                  <span class="svc-title"><app-icon name="layers" [size]="16" /> Services</span>
                  <button class="btn btn--secondary btn--sm" (click)="openAddService(dept)">
                    <app-icon name="add" [size]="14" /> Ajouter
                  </button>
                </div>

                <div class="svc-tree" *ngIf="getServicesForDept(dept.id).length > 0">
                  <div class="svc-trunk"></div>
                  <div class="svc-node" *ngFor="let svc of getServicesForDept(dept.id); let last = last" [class.last]="last">
                    <div class="svc-branch-line"></div>
                    <div class="svc-card">
                      <span class="svc-dot"></span>
                      <div class="svc-info">
                        <span class="svc-name">{{ svc.name }}</span>
                        <span class="svc-desc">{{ svc.description || 'Aucune description' }}</span>
                      </div>
                      <div class="svc-actions">
                        <button class="icon-btn icon-btn--sm" (click)="editService(svc)" aria-label="Modifier le service" title="Modifier">
                          <app-icon name="edit" [size]="15" />
                        </button>
                        <button class="icon-btn icon-btn--sm icon-btn--danger" (click)="deleteService(svc.id)" aria-label="Supprimer le service" title="Supprimer">
                          <app-icon name="delete" [size]="15" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="svc-empty" *ngIf="getServicesForDept(dept.id).length === 0">
                  <app-icon name="inbox" [size]="16" /> Aucun service — cliquez sur « Ajouter » pour commencer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="departments.length === 0">
        <span class="empty-state__icon"><app-icon name="inbox" [size]="26" /></span>
        <p class="empty-state__title">Aucun département créé</p>
        <span class="empty-state__text">Commencez par ajouter votre premier département.</span>
      </div>

      <!-- Modal Département -->
      <div class="modal-overlay" *ngIf="showDeptForm" (click)="showDeptForm = false">
        <div class="modal modal--sm" role="dialog" aria-modal="true" aria-label="Formulaire département" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3 class="modal__title"><app-icon name="department" [size]="20" /> {{ isEditingDept ? 'Modifier' : 'Nouveau' }} département</h3>
            <button class="icon-btn" (click)="showDeptForm = false" aria-label="Fermer"><app-icon name="close" [size]="18" /></button>
          </div>
          <div class="modal__body">
            <div class="field">
              <label class="label" for="dept-name">Nom du département</label>
              <input id="dept-name" class="input" [(ngModel)]="deptForm.name" placeholder="Ex: Informatique, RH, Finance..." />
            </div>
            <div class="field">
              <label class="label" for="dept-desc">Description</label>
              <textarea id="dept-desc" class="textarea" [(ngModel)]="deptForm.description" placeholder="Description du département..." rows="3"></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" (click)="showDeptForm = false">Annuler</button>
            <button class="btn btn--primary" (click)="saveDepartment()">
              <app-icon [name]="isEditingDept ? 'save' : 'approve'" [size]="16" />
              {{ isEditingDept ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Assigner un manager au département -->
      <div class="modal-overlay" *ngIf="showManagerForm" (click)="showManagerForm = false">
        <div class="modal modal--sm" role="dialog" aria-modal="true" aria-label="Assigner un manager" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div>
              <h3 class="modal__title"><app-icon name="manager" [size]="20" /> Assigner un manager</h3>
              <p class="modal__sub">Département : <strong>{{ selectedDeptForManager?.name }}</strong></p>
            </div>
            <button class="icon-btn" (click)="showManagerForm = false" aria-label="Fermer"><app-icon name="close" [size]="18" /></button>
          </div>
          <div class="modal__body">
            <div class="alert alert--info">
              <app-icon class="alert__icon" name="info" [size]="16" />
              <span>Sélectionnez un employé existant. S'il manage déjà un autre département, l'ancien sera libéré automatiquement.</span>
            </div>
            <div class="field">
              <label class="label" for="mgr-emp">Employé</label>
              <select id="mgr-emp" class="select" [(ngModel)]="managerForm.employeeId">
                <option [ngValue]="null">-- Choisir un employé --</option>
                <option *ngFor="let emp of candidateManagers()" [ngValue]="emp.id">
                  {{ emp.firstName }} {{ emp.lastName }}
                  <ng-container *ngIf="emp.position"> — {{ emp.position }}</ng-container>
                  <ng-container *ngIf="getCurrentDeptOfEmployee(emp.id) as cd"> (manage actuellement : {{ cd }})</ng-container>
                </option>
              </select>
            </div>
            <div class="alert alert--warning" *ngIf="candidateManagers().length === 0">
              <app-icon class="alert__icon" name="warning" [size]="16" />
              <span>Aucun employé avec le rôle MANAGER. Attribuez d'abord le rôle MANAGER à un employé depuis Keycloak.</span>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" (click)="showManagerForm = false">Annuler</button>
            <button class="btn btn--primary" [disabled]="!managerForm.employeeId" (click)="saveManagerAssignment()">
              <app-icon name="approve" [size]="16" /> Assigner
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Service -->
      <div class="modal-overlay" *ngIf="showServiceForm" (click)="showServiceForm = false">
        <div class="modal modal--sm" role="dialog" aria-modal="true" aria-label="Formulaire service" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3 class="modal__title"><app-icon name="layers" [size]="20" /> {{ isEditingService ? 'Modifier' : 'Nouveau' }} service</h3>
            <button class="icon-btn" (click)="showServiceForm = false" aria-label="Fermer"><app-icon name="close" [size]="18" /></button>
          </div>
          <div class="modal__body">
            <div class="alert alert--info" *ngIf="!isEditingService">
              <app-icon class="alert__icon" name="department" [size]="16" />
              <span>Département : <strong>{{ selectedDeptForService?.name }}</strong></span>
            </div>
            <div class="field">
              <label class="label" for="svc-name">Nom du service</label>
              <input id="svc-name" class="input" [(ngModel)]="serviceForm.name" placeholder="Ex: Développement, Support, Comptabilité..." />
            </div>
            <div class="field">
              <label class="label" for="svc-desc">Description</label>
              <textarea id="svc-desc" class="textarea" [(ngModel)]="serviceForm.description" placeholder="Description du service..." rows="3"></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" (click)="showServiceForm = false">Annuler</button>
            <button class="btn btn--primary" (click)="saveService()">
              <app-icon [name]="isEditingService ? 'save' : 'approve'" [size]="16" />
              {{ isEditingService ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { animation: fade-in .22s ease both; }
    /* opacité seule : un transform sur ce conteneur racine détacherait les overlays fixes des modales */
    @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
    @keyframes card-in { from { opacity:0; } to { opacity:1; } }

    /* Stats */
    .stats-row { display:flex; gap: var(--sp-3); margin-bottom: var(--sp-6); flex-wrap:wrap; }
    .stats-row .stat { flex:1 1 200px; max-width:300px; }

    /* Tree */
    .tree { display:flex; flex-direction:column; align-items:center; }
    .root-card {
      display:inline-flex; align-items:center; gap: var(--sp-2);
      background: var(--c-accent-soft); color: var(--c-accent-ink);
      border:1px solid var(--c-border);
      padding: var(--sp-3) var(--sp-6); border-radius: var(--r-md);
    }
    .root-label { font-weight:650; font-size: var(--fs-15); }
    .trunk { width:2px; height: var(--sp-5); background: var(--c-border-strong); }

    /* Dept cards */
    .dept-cards { display:flex; flex-direction:column; gap: var(--sp-3); width:100%; max-width:820px; }
    .dept-branch { animation: card-in .3s ease both; }
    .branch-line { width:2px; height: var(--sp-3); background: var(--c-border-strong); margin:0 auto; }

    .dept-card {
      background: var(--c-surface); border:1px solid var(--c-border); border-radius: var(--r-lg);
      overflow:hidden; box-shadow: var(--sh-sm);
      transition: border-color var(--transition), box-shadow var(--transition);
    }
    .dept-card:hover { border-color: var(--c-border-strong); }
    .dept-card.expanded { border-color: var(--c-accent); box-shadow: var(--sh-md); }

    .dept-head { display:flex; justify-content:space-between; align-items:center; gap: var(--sp-3); padding: var(--sp-4) var(--sp-5); cursor:pointer; transition: background var(--transition); }
    .dept-head:hover { background: var(--c-surface-2); }
    .dept-left { display:flex; align-items:center; gap: var(--sp-3); flex:1; min-width:0; }
    .dept-icon-box {
      flex:none; width:42px; height:42px; border-radius: var(--r-md);
      background: var(--c-accent-soft); color: var(--c-accent-ink);
      display:inline-flex; align-items:center; justify-content:center;
    }
    .dept-details { min-width:0; }
    .dept-details h3 { font-size: var(--fs-16); font-weight:650; color: var(--c-ink); }
    .dept-badges { display:flex; gap: var(--sp-2); margin-top:6px; flex-wrap:wrap; }
    .desc-badge { max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block; }

    .dept-right { display:flex; align-items:center; gap: var(--sp-2); }
    .dept-actions { display:flex; gap:2px; }
    .chevron { color: var(--c-faint); transition: transform var(--transition); display:inline-flex; }
    .chevron.open { transform: rotate(90deg); }

    /* Manager strip */
    .mgr-strip {
      display:inline-flex; align-items:center; gap: var(--sp-2);
      margin-top:6px; padding:4px 8px;
      background: var(--c-brand-soft); color: var(--c-brand-ink);
      border:1px solid var(--c-brand-soft-2); border-radius: var(--r-sm);
      max-width:100%;
    }
    .mgr-strip-label { font-size: var(--fs-12); color: var(--c-muted); }
    .mgr-strip-name { font-size: var(--fs-13); color: var(--c-ink); font-weight:650; }
    .mgr-strip-vacant { background: var(--c-surface-3); color: var(--c-muted); border-color: var(--c-border); }
    .mgr-strip-vacant-label { font-size: var(--fs-13); color: var(--c-muted); font-style:italic; }

    /* Service panel */
    .svc-panel { border-top:1px solid var(--c-border); padding: var(--sp-4) var(--sp-5); background: var(--c-surface-2); animation: fade-in .2s ease; }
    .svc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--sp-3); }
    .svc-title { display:inline-flex; align-items:center; gap:6px; font-weight:650; color: var(--c-ink-soft); font-size: var(--fs-14); }

    .svc-tree { position:relative; padding-left: var(--sp-5); }
    .svc-trunk { position:absolute; left:8px; top:0; bottom:16px; width:2px; background: var(--c-border-strong); }
    .svc-node { position:relative; margin-bottom: var(--sp-2); }
    .svc-node.last { margin-bottom:0; }
    .svc-branch-line { position:absolute; left:-12px; top:50%; width:12px; height:2px; background: var(--c-border-strong); }
    .svc-card {
      display:flex; align-items:center; gap: var(--sp-3);
      padding: var(--sp-3) var(--sp-4); background: var(--c-surface);
      border:1px solid var(--c-border); border-radius: var(--r-md);
      transition: border-color var(--transition);
    }
    .svc-card:hover { border-color: var(--c-border-strong); }
    .svc-dot { flex:none; width:8px; height:8px; border-radius:50%; background: var(--c-accent); }
    .svc-info { flex:1; display:flex; flex-direction:column; gap:1px; min-width:0; }
    .svc-name { font-weight:600; color: var(--c-ink); font-size: var(--fs-14); }
    .svc-desc { color: var(--c-muted); font-size: var(--fs-12); }
    .svc-actions { display:flex; gap:2px; }
    .svc-empty { display:flex; align-items:center; justify-content:center; gap:6px; color: var(--c-muted); font-size: var(--fs-13); padding: var(--sp-4) 0; }

    @media (max-width: 600px) {
      .dept-head { flex-wrap:wrap; }
      .dept-right { align-self:flex-end; }
    }
  `]
})
export class DepartmentManagementComponent implements OnInit {
  departments: any[] = [];
  allServices: any[] = [];
  allEmployees: any[] = [];
  managerUsernames: Set<string> = new Set();
  expandedDepts: { [key: number]: boolean } = {};

  // Département form
  showDeptForm = false;
  isEditingDept = false;
  editDeptId: number | null = null;
  deptForm: any = {};

  // Service form
  showServiceForm = false;
  isEditingService = false;
  editServiceId: number | null = null;
  serviceForm: any = {};
  selectedDeptForService: any = null;

  // Assignation de manager
  showManagerForm = false;
  selectedDeptForManager: any = null;
  managerForm: { employeeId: number | null } = { employeeId: null };

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadAllServices();
    this.loadAllEmployees();
    this.loadManagerUsernames();
  }

  loadAllEmployees(): void {
    this.employeeApi.getAllEmployees().subscribe({
      next: (data) => this.allEmployees = data,
      error: () => this.allEmployees = []
    });
  }

  loadManagerUsernames(): void {
    this.employeeApi.getManagers().subscribe({
      next: (mgrs) => this.managerUsernames = new Set(mgrs.map(m => m.username)),
      error: () => this.managerUsernames = new Set()
    });
  }

  loadDepartments(): void {
    this.employeeApi.getDepartments().subscribe({ next: (data) => this.departments = data });
  }

  loadAllServices(): void {
    this.employeeApi.getServices().subscribe({ next: (data) => this.allServices = data });
  }

  getServicesForDept(deptId: number): any[] {
    return this.allServices.filter(s => s.department?.id === deptId);
  }

  toggleDept(deptId: number): void {
    this.expandedDepts[deptId] = !this.expandedDepts[deptId];
  }

  // ── Département CRUD ──

  resetDeptForm(): void {
    this.deptForm = {};
    this.isEditingDept = false;
    this.editDeptId = null;
  }

  editDepartment(dept: any): void {
    this.deptForm = { ...dept };
    this.isEditingDept = true;
    this.editDeptId = dept.id;
    this.showDeptForm = true;
  }

  saveDepartment(): void {
    const obs = this.isEditingDept
      ? this.employeeApi.updateDepartment(this.editDeptId!, this.deptForm)
      : this.employeeApi.createDepartment(this.deptForm);
    obs.subscribe({ next: () => { this.showDeptForm = false; this.loadDepartments(); } });
  }

  deleteDepartment(id: number): void {
    if (confirm('Supprimer ce département et tous ses services ?')) {
      this.employeeApi.deleteDepartment(id).subscribe({
        next: () => { this.loadDepartments(); this.loadAllServices(); }
      });
    }
  }

  // ── Service CRUD ──

  openAddService(dept: any): void {
    this.selectedDeptForService = dept;
    this.serviceForm = {};
    this.isEditingService = false;
    this.editServiceId = null;
    this.showServiceForm = true;
  }

  editService(svc: any): void {
    this.serviceForm = { name: svc.name, description: svc.description };
    this.selectedDeptForService = svc.department;
    this.isEditingService = true;
    this.editServiceId = svc.id;
    this.showServiceForm = true;
  }

  saveService(): void {
    const payload = {
      name: this.serviceForm.name,
      description: this.serviceForm.description,
      department: { id: this.selectedDeptForService.id }
    };

    const obs = this.isEditingService
      ? this.employeeApi.updateService(this.editServiceId!, payload)
      : this.employeeApi.createService(payload);

    obs.subscribe({
      next: () => { this.showServiceForm = false; this.loadAllServices(); },
      error: (err: any) => console.error('Erreur sauvegarde service:', err)
    });
  }

  deleteService(id: number): void {
    if (confirm('Supprimer ce service ?')) {
      this.employeeApi.deleteService(id).subscribe({ next: () => this.loadAllServices() });
    }
  }

  // ── Gestion du manager du département ──

  openAssignManager(dept: any): void {
    this.selectedDeptForManager = dept;
    this.managerForm = { employeeId: dept.manager?.id || null };
    this.showManagerForm = true;
  }

  /** Employés candidats : uniquement ceux ayant le rôle Keycloak MANAGER. */
  candidateManagers(): any[] {
    if (this.managerUsernames.size === 0) return [];
    return this.allEmployees.filter(emp => emp.keycloakUsername && this.managerUsernames.has(emp.keycloakUsername));
  }

  /** Si l'employé manage déjà un département, renvoyer le nom de ce département (pour affichage). */
  getCurrentDeptOfEmployee(employeeId: number): string | null {
    const dept = this.departments.find(d => d.manager?.id === employeeId);
    return dept ? dept.name : null;
  }

  saveManagerAssignment(): void {
    if (!this.selectedDeptForManager || !this.managerForm.employeeId) return;
    this.employeeApi.assignDepartmentManager(this.selectedDeptForManager.id, this.managerForm.employeeId).subscribe({
      next: () => {
        this.showManagerForm = false;
        this.loadDepartments();
      },
      error: (err: any) => alert('Erreur assignation : ' + (err.error?.message || err.message))
    });
  }

  removeManager(dept: any): void {
    if (!confirm(`Retirer ${dept.manager?.firstName} ${dept.manager?.lastName} comme manager du département "${dept.name}" ?`)) return;
    this.employeeApi.removeDepartmentManager(dept.id).subscribe({
      next: () => this.loadDepartments(),
      error: (err: any) => alert('Erreur : ' + (err.error?.message || err.message))
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Gestion des départements et services pour le RH Admin.
 * Chaque département affiche ses services avec possibilité d'ajouter/modifier/supprimer.
 */
@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">🏗️</div>
          <div>
            <h1>Gestion des Départements & Services</h1>
            <p class="header-sub">Organisez la structure de votre entreprise</p>
          </div>
        </div>
        <button class="add-dept-btn" (click)="showDeptForm = true; resetDeptForm()">
          <span>+</span> Nouveau Département
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row" *ngIf="departments.length > 0">
        <div class="stat-chip">
          <span class="sc-icon">🏗️</span>
          <span class="sc-val">{{ departments.length }}</span>
          <span class="sc-lbl">Départements</span>
        </div>
        <div class="stat-chip">
          <span class="sc-icon">📂</span>
          <span class="sc-val">{{ allServices.length }}</span>
          <span class="sc-lbl">Services</span>
        </div>
      </div>

      <!-- Tree -->
      <div class="tree" *ngIf="departments.length > 0">
        <!-- Root -->
        <div class="tree-root">
          <div class="root-card">
            <span class="root-icon">🏢</span>
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
                  <div class="dept-icon-box">🏗️</div>
                  <div class="dept-details">
                    <h3>{{ dept.name }}</h3>
                    <div class="dept-badges">
                      <span class="badge svc-badge">📂 {{ getServicesForDept(dept.id).length }} service(s)</span>
                      <span class="badge desc-badge" *ngIf="dept.description">{{ dept.description }}</span>
                    </div>
                  </div>
                </div>
                <div class="dept-right">
                  <div class="dept-actions" (click)="$event.stopPropagation()">
                    <button class="act-btn edit-btn" (click)="editDepartment(dept)" title="Modifier">✏️</button>
                    <button class="act-btn del-btn" (click)="deleteDepartment(dept.id)" title="Supprimer">🗑️</button>
                  </div>
                  <span class="chevron" [class.open]="expandedDepts[dept.id]">▶</span>
                </div>
              </div>

              <!-- Services tree inside dept -->
              <div class="svc-panel" *ngIf="expandedDepts[dept.id]">
                <div class="svc-header">
                  <span class="svc-title">📂 Services</span>
                  <button class="add-svc-btn" (click)="openAddService(dept)">+ Ajouter</button>
                </div>

                <div class="svc-tree" *ngIf="getServicesForDept(dept.id).length > 0">
                  <div class="svc-trunk"></div>
                  <div class="svc-node" *ngFor="let svc of getServicesForDept(dept.id); let last = last" [class.last]="last">
                    <div class="svc-branch-line"></div>
                    <div class="svc-card">
                      <div class="svc-dot"></div>
                      <div class="svc-info">
                        <span class="svc-name">{{ svc.name }}</span>
                        <span class="svc-desc">{{ svc.description || 'Aucune description' }}</span>
                      </div>
                      <div class="svc-actions">
                        <button class="act-btn edit-btn sm" (click)="editService(svc)">✏️</button>
                        <button class="act-btn del-btn sm" (click)="deleteService(svc.id)">🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="svc-empty" *ngIf="getServicesForDept(dept.id).length === 0">
                  Aucun service — cliquez sur "+ Ajouter" pour commencer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="departments.length === 0">
        <div class="empty-icon">📭</div>
        <p>Aucun département créé</p>
        <span>Commencez par ajouter votre premier département.</span>
      </div>

      <!-- Modal Département -->
      <div class="modal-overlay" *ngIf="showDeptForm" (click)="showDeptForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <div class="modal-icon">🏗️</div>
            <h3>{{ isEditingDept ? 'Modifier' : 'Nouveau' }} département</h3>
          </div>
          <div class="modal-body">
            <label>Nom du département</label>
            <input [(ngModel)]="deptForm.name" placeholder="Ex: Informatique, RH, Finance..." />
            <label>Description</label>
            <textarea [(ngModel)]="deptForm.description" placeholder="Description du département..." rows="3"></textarea>
          </div>
          <div class="modal-foot">
            <button class="m-cancel" (click)="showDeptForm = false">Annuler</button>
            <button class="m-submit" (click)="saveDepartment()">
              {{ isEditingDept ? '💾 Modifier' : '✅ Créer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Service -->
      <div class="modal-overlay" *ngIf="showServiceForm" (click)="showServiceForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <div class="modal-icon">📂</div>
            <h3>{{ isEditingService ? 'Modifier' : 'Nouveau' }} service</h3>
          </div>
          <div class="modal-body">
            <div class="dept-context" *ngIf="!isEditingService">
              <span>Département :</span>
              <strong>{{ selectedDeptForService?.name }}</strong>
            </div>
            <label>Nom du service</label>
            <input [(ngModel)]="serviceForm.name" placeholder="Ex: Développement, Support, Comptabilité..." />
            <label>Description</label>
            <textarea [(ngModel)]="serviceForm.description" placeholder="Description du service..." rows="3"></textarea>
          </div>
          <div class="modal-foot">
            <button class="m-cancel" (click)="showServiceForm = false">Annuler</button>
            <button class="m-submit" (click)="saveService()">
              {{ isEditingService ? '💾 Modifier' : '✅ Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { animation: fadeIn 0.4s ease; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes cardIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

    /* Header */
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; }
    .header-left { display:flex; align-items:center; gap:14px; }
    .header-icon-wrap { font-size:2.2rem; }
    .page-header h1 {
      margin:0; font-size:1.6rem; font-weight:800;
      background:linear-gradient(135deg,#1e3a5f,#3b82f6);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    }
    .header-sub { margin:4px 0 0; color:#64748b; font-size:0.88rem; }
    .add-dept-btn {
      display:flex; align-items:center; gap:6px;
      padding:10px 22px; background:linear-gradient(135deg,#3b82f6,#2563eb);
      color:white; border:none; border-radius:10px; cursor:pointer;
      font-size:0.9rem; font-weight:600; box-shadow:0 4px 12px rgba(37,99,235,0.25);
      transition:all 0.25s;
    }
    .add-dept-btn:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(37,99,235,0.35); }
    .add-dept-btn span { font-size:1.2rem; font-weight:700; }

    /* Stats */
    .stats-row { display:flex; gap:14px; margin-bottom:28px; flex-wrap:wrap; }
    .stat-chip { display:flex; align-items:center; gap:8px; background:white; border:1px solid #e2e8f0; border-radius:12px; padding:10px 18px; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
    .sc-icon { font-size:1.1rem; }
    .sc-val { font-size:1.3rem; font-weight:800; color:#1e293b; }
    .sc-lbl { font-size:0.8rem; color:#64748b; }

    /* Tree */
    .tree { display:flex; flex-direction:column; align-items:center; }
    .tree-root { margin-bottom:0; }
    .root-card {
      display:flex; align-items:center; gap:10px;
      background:linear-gradient(135deg,#1e3a5f,#2563eb);
      padding:14px 28px; border-radius:14px; color:white;
      box-shadow:0 8px 24px rgba(37,99,235,0.25);
    }
    .root-icon { font-size:1.6rem; }
    .root-label { font-weight:800; font-size:1.1rem; }
    .trunk { width:3px; height:24px; background:linear-gradient(180deg,#2563eb,#cbd5e1); border-radius:2px; }

    /* Dept cards */
    .dept-cards { display:flex; flex-direction:column; gap:14px; width:100%; max-width:800px; }
    .dept-branch { animation: cardIn 0.4s ease both; }
    .branch-line { width:3px; height:14px; background:#cbd5e1; margin:0 auto; border-radius:2px; }

    .dept-card {
      background:white; border-radius:16px; border:2px solid #e2e8f0;
      overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); transition:all 0.3s;
    }
    .dept-card:hover { border-color:#93c5fd; box-shadow:0 8px 20px rgba(59,130,246,0.1); }
    .dept-card.expanded { border-color:#3b82f6; }

    .dept-head { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; cursor:pointer; transition:background 0.15s; }
    .dept-head:hover { background:#f8fafc; }
    .dept-left { display:flex; align-items:center; gap:14px; flex:1; min-width:0; }
    .dept-icon-box {
      width:44px; height:44px; border-radius:12px;
      background:linear-gradient(135deg,#eff6ff,#dbeafe);
      display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0;
    }
    .dept-details { min-width:0; }
    .dept-details h3 { margin:0; color:#1e293b; font-size:1.05rem; font-weight:700; }
    .dept-badges { display:flex; gap:8px; margin-top:5px; flex-wrap:wrap; }
    .badge { font-size:0.73rem; padding:3px 10px; border-radius:20px; font-weight:500; }
    .svc-badge { background:#f0fdf4; color:#166534; }
    .desc-badge { background:#f8fafc; color:#64748b; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    .dept-right { display:flex; align-items:center; gap:12px; }
    .dept-actions { display:flex; gap:4px; }
    .act-btn {
      border:none; background:none; cursor:pointer; font-size:1rem;
      padding:6px 8px; border-radius:8px; transition:all 0.15s;
    }
    .act-btn.sm { font-size:0.85rem; padding:4px 6px; }
    .edit-btn:hover { background:#dbeafe; }
    .del-btn:hover { background:#fee2e2; }
    .chevron { font-size:0.7rem; color:#94a3b8; transition:transform 0.3s ease; display:inline-block; }
    .chevron.open { transform:rotate(90deg); }

    /* Services panel */
    .svc-panel { border-top:1px solid #f1f5f9; padding:16px 20px; background:#f8fafc; animation:slideDown 0.25s ease; }
    @keyframes slideDown { from { opacity:0; } to { opacity:1; } }

    .svc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
    .svc-title { font-weight:700; color:#475569; font-size:0.9rem; }
    .add-svc-btn {
      padding:6px 16px; background:linear-gradient(135deg,#10b981,#059669);
      color:white; border:none; border-radius:8px; cursor:pointer;
      font-size:0.8rem; font-weight:600; transition:all 0.2s;
      box-shadow:0 2px 8px rgba(16,185,129,0.25);
    }
    .add-svc-btn:hover { box-shadow:0 4px 12px rgba(16,185,129,0.35); }

    /* Service tree */
    .svc-tree { position:relative; padding-left:20px; }
    .svc-trunk { position:absolute; left:8px; top:0; bottom:16px; width:2px; background:#d1fae5; border-radius:2px; }
    .svc-node { position:relative; margin-bottom:10px; }
    .svc-node.last { margin-bottom:0; }
    .svc-branch-line {
      position:absolute; left:-12px; top:50%; width:12px; height:2px; background:#d1fae5;
    }
    .svc-card {
      display:flex; align-items:center; gap:12px;
      padding:12px 16px; background:white; border-radius:12px;
      border:1px solid #e2e8f0; transition:all 0.2s;
    }
    .svc-card:hover { border-color:#a7f3d0; box-shadow:0 4px 12px rgba(16,185,129,0.08); }
    .svc-dot { width:10px; height:10px; border-radius:50%; background:linear-gradient(135deg,#10b981,#059669); flex-shrink:0; }
    .svc-info { flex:1; display:flex; flex-direction:column; gap:2px; }
    .svc-name { font-weight:600; color:#1e293b; font-size:0.9rem; }
    .svc-desc { color:#94a3b8; font-size:0.78rem; }
    .svc-actions { display:flex; gap:2px; }

    .svc-empty { text-align:center; color:#94a3b8; font-style:italic; font-size:0.85rem; padding:16px 0; }

    /* Empty */
    .empty-state { text-align:center; padding:60px 20px; }
    .empty-icon { font-size:3rem; margin-bottom:12px; }
    .empty-state p { font-size:1.1rem; color:#64748b; margin:0 0 4px; font-weight:600; }
    .empty-state span { font-size:0.85rem; color:#94a3b8; }

    /* Modal */
    .modal-overlay {
      position:fixed; inset:0; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px);
      display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .modal {
      background:white; border-radius:20px; width:90%; max-width:500px;
      box-shadow:0 24px 48px rgba(0,0,0,0.2); overflow:hidden;
      animation:modalIn 0.3s ease;
    }
    @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }

    .modal-head {
      text-align:center; padding:24px 24px 12px;
      background:linear-gradient(135deg,#eff6ff,#f8fafc);
    }
    .modal-icon { font-size:2rem; margin-bottom:6px; }
    .modal-head h3 { margin:0; color:#1e293b; font-size:1.15rem; font-weight:700; }

    .modal-body { padding:20px 24px; }
    .modal-body label {
      display:block; font-size:0.78rem; font-weight:700; color:#64748b;
      text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; margin-top:12px;
    }
    .modal-body label:first-child { margin-top:0; }
    .modal-body input, .modal-body textarea {
      width:100%; padding:12px 14px; border:2px solid #e2e8f0; border-radius:10px;
      font-size:0.9rem; outline:none; box-sizing:border-box; font-family:inherit;
      transition:border-color 0.2s;
    }
    .modal-body input:focus, .modal-body textarea:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
    .dept-context {
      display:flex; align-items:center; gap:8px; padding:10px 14px;
      background:#f0fdf4; border-radius:10px; border:1px solid #bbf7d0;
      font-size:0.88rem; margin-bottom:8px;
    }
    .dept-context span { color:#64748b; }
    .dept-context strong { color:#166534; }

    .modal-foot {
      display:flex; justify-content:flex-end; gap:10px;
      padding:16px 24px 24px; border-top:1px solid #f1f5f9;
    }
    .m-cancel {
      padding:10px 20px; border:1px solid #e2e8f0; background:white;
      border-radius:10px; cursor:pointer; font-size:0.88rem; font-weight:600;
      color:#64748b; transition:all 0.2s;
    }
    .m-cancel:hover { background:#f8fafc; }
    .m-submit {
      padding:10px 22px; background:linear-gradient(135deg,#3b82f6,#2563eb);
      color:white; border:none; border-radius:10px; cursor:pointer;
      font-size:0.88rem; font-weight:600; box-shadow:0 4px 12px rgba(37,99,235,0.25);
      transition:all 0.2s;
    }
    .m-submit:hover { box-shadow:0 6px 16px rgba(37,99,235,0.35); }
  `]
})
export class DepartmentManagementComponent implements OnInit {
  departments: any[] = [];
  allServices: any[] = [];
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

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadAllServices();
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
}

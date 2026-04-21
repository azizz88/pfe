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
      <div class="header">
        <h1>🏗️ Gestion des Départements & Services</h1>
        <button class="add-btn" (click)="showDeptForm = true; resetDeptForm()">+ Ajouter un Département</button>
      </div>

      <!-- Liste des départements avec leurs services -->
      <div class="dept-list">
        <div class="dept-block" *ngFor="let dept of departments">
          <!-- En-tête du département -->
          <div class="dept-header" (click)="toggleDept(dept.id)">
            <div class="dept-header-left">
              <span class="expand-icon">{{ expandedDepts[dept.id] ? '▼' : '▶' }}</span>
              <h3>{{ dept.name }}</h3>
              <span class="service-count">{{ getServicesForDept(dept.id).length }} service(s)</span>
            </div>
            <div class="dept-header-right" (click)="$event.stopPropagation()">
              <p class="dept-desc" *ngIf="dept.description">{{ dept.description }}</p>
              <button class="icon-btn edit" (click)="editDepartment(dept)" title="Modifier">✏️</button>
              <button class="icon-btn delete" (click)="deleteDepartment(dept.id)" title="Supprimer">🗑️</button>
            </div>
          </div>

          <!-- Services du département (expandable) -->
          <div class="services-panel" *ngIf="expandedDepts[dept.id]">
            <div class="services-header">
              <span class="services-label">📂 Services</span>
              <button class="add-service-btn" (click)="openAddService(dept)">+ Ajouter un Service</button>
            </div>

            <div class="service-list" *ngIf="getServicesForDept(dept.id).length > 0">
              <div class="service-item" *ngFor="let svc of getServicesForDept(dept.id)">
                <div class="service-info">
                  <strong>{{ svc.name }}</strong>
                  <span class="service-desc">{{ svc.description || 'Aucune description' }}</span>
                </div>
                <div class="service-actions">
                  <button class="icon-btn edit-sm" (click)="editService(svc)" title="Modifier">✏️</button>
                  <button class="icon-btn delete-sm" (click)="deleteService(svc.id)" title="Supprimer">🗑️</button>
                </div>
              </div>
            </div>
            <p class="empty-services" *ngIf="getServicesForDept(dept.id).length === 0">
              Aucun service dans ce département.
            </p>
          </div>
        </div>
      </div>

      <p class="empty" *ngIf="departments.length === 0">Aucun département créé.</p>

      <!-- Formulaire Département -->
      <div class="modal-overlay" *ngIf="showDeptForm" (click)="showDeptForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ isEditingDept ? 'Modifier' : 'Ajouter' }} un département</h3>
          <input [(ngModel)]="deptForm.name" placeholder="Nom du département" />
          <textarea [(ngModel)]="deptForm.description" placeholder="Description" rows="3"></textarea>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showDeptForm = false">Annuler</button>
            <button class="submit-btn" (click)="saveDepartment()">
              {{ isEditingDept ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Formulaire Service -->
      <div class="modal-overlay" *ngIf="showServiceForm" (click)="showServiceForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ isEditingService ? 'Modifier' : 'Ajouter' }} un service</h3>
          <div class="form-info" *ngIf="!isEditingService">
            <span class="info-label">Département :</span>
            <strong>{{ selectedDeptForService?.name }}</strong>
          </div>
          <input [(ngModel)]="serviceForm.name" placeholder="Nom du service" />
          <textarea [(ngModel)]="serviceForm.description" placeholder="Description du service" rows="3"></textarea>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showServiceForm = false">Annuler</button>
            <button class="submit-btn" (click)="saveService()">
              {{ isEditingService ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .header h1 { color: #1e3a5f; margin: 0; }
    .add-btn {
      padding: 10px 20px; background: #3b82f6; color: white; border: none;
      border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s;
    }
    .add-btn:hover { background: #2563eb; }

    /* Département block */
    .dept-list { display: flex; flex-direction: column; gap: 12px; }
    .dept-block {
      background: white; border-radius: 12px; overflow: hidden;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .dept-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; cursor: pointer; transition: background 0.15s;
    }
    .dept-header:hover { background: #f8fafc; }
    .dept-header-left { display: flex; align-items: center; gap: 12px; }
    .dept-header-left h3 { margin: 0; color: #1e293b; font-size: 1.05rem; }
    .expand-icon { color: #94a3b8; font-size: 0.75rem; }
    .service-count {
      background: #eff6ff; color: #3b82f6; padding: 2px 10px;
      border-radius: 999px; font-size: 0.75rem; font-weight: 600;
    }
    .dept-header-right { display: flex; align-items: center; gap: 8px; }
    .dept-desc { margin: 0; color: #64748b; font-size: 0.85rem; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .icon-btn {
      border: none; background: none; cursor: pointer; font-size: 1rem;
      padding: 4px 6px; border-radius: 6px; transition: background 0.15s;
    }
    .icon-btn.edit:hover { background: #dbeafe; }
    .icon-btn.delete:hover { background: #fee2e2; }
    .icon-btn.edit-sm:hover { background: #dbeafe; }
    .icon-btn.delete-sm:hover { background: #fee2e2; }

    /* Services panel */
    .services-panel {
      border-top: 1px solid #f1f5f9; padding: 16px 20px;
      background: #fafbfd;
    }
    .services-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .services-label { font-weight: 600; color: #475569; font-size: 0.9rem; }
    .add-service-btn {
      padding: 6px 14px; background: #22c55e; color: white; border: none;
      border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: background 0.2s;
    }
    .add-service-btn:hover { background: #16a34a; }

    .service-list { display: flex; flex-direction: column; gap: 8px; }
    .service-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; background: white; border-radius: 8px;
      border: 1px solid #e2e8f0; transition: box-shadow 0.15s;
    }
    .service-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .service-info { display: flex; flex-direction: column; gap: 2px; }
    .service-info strong { color: #1e293b; font-size: 0.9rem; }
    .service-desc { color: #94a3b8; font-size: 0.8rem; }
    .service-actions { display: flex; gap: 4px; }
    .empty-services { color: #94a3b8; font-style: italic; font-size: 0.85rem; margin: 8px 0 0 0; }

    .empty { text-align: center; color: #94a3b8; font-style: italic; margin-top: 40px; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: white; border-radius: 16px; padding: 24px;
      width: 90%; max-width: 480px;
    }
    .modal h3 { margin: 0 0 16px 0; color: #1e293b; }
    .modal input, .modal textarea {
      width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; outline: none; margin-bottom: 12px; box-sizing: border-box;
      font-family: inherit;
    }
    .modal input:focus, .modal textarea:focus { border-color: #3b82f6; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .cancel-btn { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
    .submit-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .submit-btn:hover { background: #2563eb; }
    .form-info {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
      padding: 10px 14px; background: #f0fdf4; border-radius: 8px;
      border: 1px solid #bbf7d0; font-size: 0.9rem;
    }
    .info-label { color: #64748b; }
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

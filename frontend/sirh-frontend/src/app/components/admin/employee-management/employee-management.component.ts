import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Gestion des employés (CRUD complet) pour le RH Admin.
 */
@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <div class="header">
        <h1>👥 Gestion des Employés</h1>
        <button class="add-btn" (click)="showForm = true; resetForm()">+ Ajouter</button>
      </div>

      <!-- Tableau des employés -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom Complet</th>
              <th>Email</th>
              <th>Poste</th>
              <th>Département</th>
              <th>Contrat</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of employees">
              <td><strong>{{ emp.matricule }}</strong></td>
              <td>{{ emp.firstName }} {{ emp.lastName }}</td>
              <td>{{ emp.email }}</td>
              <td>{{ emp.position || '—' }}</td>
              <td>{{ emp.department?.name || '—' }}</td>
              <td>
                <span *ngIf="emp.contract" class="badge" [class]="emp.contract.type">
                  {{ emp.contract.type }}
                </span>
              </td>
              <td class="actions">
                <button class="edit-btn" (click)="editEmployee(emp)">✏️</button>
                <button class="doc-btn" (click)="openDocuments(emp)">📎</button>
                <button class="delete-btn" (click)="deleteEmployee(emp.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Formulaire ajout/modification -->
      <div class="modal-overlay" *ngIf="showForm" (click)="showForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ isEditing ? 'Modifier' : 'Ajouter' }} un employé</h3>
          <div class="form-grid">
            <input [(ngModel)]="form.matricule" placeholder="Matricule (ex: EMP-001)" />
            <input [(ngModel)]="form.firstName" placeholder="Prénom" />
            <input [(ngModel)]="form.lastName" placeholder="Nom" />
            <input [(ngModel)]="form.email" placeholder="Email" type="email" />
            <input [(ngModel)]="form.phone" placeholder="Téléphone" />
            <input [(ngModel)]="form.position" placeholder="Poste" />
            <input [(ngModel)]="form.keycloakUsername" placeholder="Username Keycloak" />
            <select [(ngModel)]="form.departmentId">
              <option value="">-- Département --</option>
              <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
            </select>
            <div class="form-full-row">
              <label>Date d'embauche</label>
              <input [(ngModel)]="form.hireDate" type="date" />
            </div>
            <div class="form-section-title">Contrat</div>
            <select [(ngModel)]="form.contractType">
              <option value="">-- Type de contrat --</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
            </select>
            <div class="form-full-row">
              <label>Date début contrat</label>
              <input [(ngModel)]="form.contractStartDate" type="date" />
            </div>
            <div class="form-full-row">
              <label>Date fin contrat</label>
              <input [(ngModel)]="form.contractEndDate" type="date" />
            </div>
            <input [(ngModel)]="form.contractSalary" placeholder="Salaire mensuel (DT)" type="number" />
          </div>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showForm = false">Annuler</button>
            <button class="submit-btn" (click)="saveEmployee()">
              {{ isEditing ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Documents -->
      <div class="modal-overlay" *ngIf="showDocModal" (click)="showDocModal = false">
        <div class="modal doc-modal" (click)="$event.stopPropagation()">
          <h3>Documents de {{ docEmployee?.firstName }} {{ docEmployee?.lastName }}</h3>

          <!-- Upload -->
          <div class="upload-zone">
            <input type="file" #fileInput (change)="onFileSelected($event)" class="file-input" />
            <button class="upload-btn" (click)="uploadFile()" [disabled]="!selectedFile">
              Uploader
            </button>
          </div>

          <!-- Liste des documents -->
          <div class="doc-list">
            <div class="doc-item" *ngFor="let doc of documents">
              <div class="doc-icon">{{ getFileIcon(doc.fileType) }}</div>
              <div class="doc-info">
                <div class="doc-name">{{ doc.fileName }}</div>
                <div class="doc-meta">{{ doc.uploadDate }} &bull; {{ doc.fileType }}</div>
              </div>
              <div class="doc-actions">
                <button class="dl-btn" (click)="downloadDoc(doc)">Telecharger</button>
                <button class="rm-btn" (click)="deleteDoc(doc.id)">Supprimer</button>
              </div>
            </div>
            <p *ngIf="documents.length === 0" class="empty-docs">Aucun document.</p>
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" (click)="showDocModal = false">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header h1 { color: #1e3a5f; margin: 0; }
    .add-btn {
      padding: 10px 20px; background: #3b82f6; color: white; border: none;
      border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s;
    }
    .add-btn:hover { background: #2563eb; }
    .table-container {
      background: white; border-radius: 12px; overflow: hidden;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 12px 16px; text-align: left; color: #475569; font-size: 0.85rem; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
    tr:hover { background: #f8fafc; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .CDI { background: #dcfce7; color: #166534; }
    .CDD { background: #fef9c3; color: #854d0e; }
    .STAGE { background: #dbeafe; color: #1e40af; }
    .actions { display: flex; gap: 8px; }
    .edit-btn, .delete-btn, .doc-btn { border: none; background: none; cursor: pointer; font-size: 1.1rem; padding: 4px; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal { background: white; border-radius: 16px; padding: 24px; width: 90%; max-width: 600px; }
    .modal h3 { margin: 0 0 20px 0; color: #1e293b; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid input, .form-grid select {
      padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; outline: none;
    }
    .form-grid input:focus, .form-grid select:focus { border-color: #3b82f6; }
    .form-full-row { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 4px; }
    .form-full-row label { font-size: 0.8rem; color: #64748b; }
    .form-full-row input { padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; outline: none; }
    .form-full-row input:focus { border-color: #3b82f6; }
    .form-section-title {
      grid-column: 1 / -1; font-weight: 700; color: #1e3a5f; font-size: 0.95rem;
      margin-top: 8px; padding-top: 12px; border-top: 1px solid #e2e8f0;
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
    .cancel-btn { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
    .submit-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .doc-modal { max-width: 650px; }
    .upload-zone { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }
    .file-input { flex: 1; font-size: 0.85rem; }
    .upload-btn { padding: 8px 16px; background: #22c55e; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
    .upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .doc-list { max-height: 300px; overflow-y: auto; }
    .doc-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .doc-icon { font-size: 1.5rem; }
    .doc-info { flex: 1; }
    .doc-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .doc-meta { color: #94a3b8; font-size: 0.75rem; }
    .doc-actions { display: flex; gap: 6px; }
    .dl-btn { padding: 4px 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem; }
    .rm-btn { padding: 4px 10px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem; }
    .empty-docs { color: #94a3b8; font-style: italic; text-align: center; padding: 20px 0; }
  `]
})
export class EmployeeManagementComponent implements OnInit {
  employees: any[] = [];
  departments: any[] = [];
  showForm = false;
  isEditing = false;
  editId: number | null = null;
  form: any = {};

  // Documents
  showDocModal = false;
  docEmployee: any = null;
  documents: any[] = [];
  selectedFile: File | null = null;

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
  }

  loadEmployees(): void {
    this.employeeApi.getAllEmployees().subscribe({ next: (data) => this.employees = data });
  }

  loadDepartments(): void {
    this.employeeApi.getDepartments().subscribe({ next: (data) => this.departments = data });
  }

  resetForm(): void {
    this.form = { contractType: '', departmentId: '' };
    this.isEditing = false;
    this.editId = null;
  }

  editEmployee(emp: any): void {
    this.form = {
      ...emp,
      departmentId: emp.department?.id || '',
      contractType: emp.contract?.type || '',
      contractStartDate: emp.contract?.startDate || '',
      contractEndDate: emp.contract?.endDate || '',
      contractSalary: emp.contract?.salary || ''
    };
    this.isEditing = true;
    this.editId = emp.id;
    this.showForm = true;
  }

  saveEmployee(): void {
    const payload = {
      ...this.form,
      department: this.form.departmentId ? { id: this.form.departmentId } : null,
      contract: this.form.contractType ? {
        ...(this.isEditing && this.form.contract?.id ? { id: this.form.contract.id } : {}),
        type: this.form.contractType,
        startDate: this.form.contractStartDate || null,
        endDate: this.form.contractEndDate || null,
        salary: this.form.contractSalary || null
      } : null
    };

    const obs = this.isEditing
      ? this.employeeApi.updateEmployee(this.editId!, payload)
      : this.employeeApi.createEmployee(payload);

    obs.subscribe({
      next: () => { this.showForm = false; this.loadEmployees(); },
      error: (err: any) => console.error('Erreur sauvegarde:', err)
    });
  }

  deleteEmployee(id: number): void {
    if (confirm('Supprimer cet employé ?')) {
      this.employeeApi.deleteEmployee(id).subscribe({
        next: () => this.loadEmployees()
      });
    }
  }

  // ── Documents ──

  openDocuments(emp: any): void {
    this.docEmployee = emp;
    this.showDocModal = true;
    this.selectedFile = null;
    this.loadDocuments();
  }

  loadDocuments(): void {
    if (this.docEmployee) {
      this.employeeApi.getDocumentsByEmployee(this.docEmployee.id).subscribe({
        next: (data) => this.documents = data
      });
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  uploadFile(): void {
    if (this.selectedFile && this.docEmployee) {
      this.employeeApi.uploadDocument(this.docEmployee.id, this.selectedFile).subscribe({
        next: () => { this.selectedFile = null; this.loadDocuments(); }
      });
    }
  }

  downloadDoc(doc: any): void {
    this.employeeApi.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  deleteDoc(docId: number): void {
    if (confirm('Supprimer ce document ?')) {
      this.employeeApi.deleteDocument(docId).subscribe({
        next: () => this.loadDocuments()
      });
    }
  }

  getFileIcon(fileType: string): string {
    if (fileType?.includes('pdf')) return '\uD83D\uDCC4';
    if (fileType?.includes('image')) return '\uD83D\uDDBC\uFE0F';
    if (fileType?.includes('word') || fileType?.includes('document')) return '\uD83D\uDCC3';
    return '\uD83D\uDCCE';
  }
}

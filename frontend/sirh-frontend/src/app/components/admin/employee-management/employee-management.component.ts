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
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">👥</div>
          <div>
            <h1>Gestion des Employés</h1>
            <p class="header-sub">Gérez l'ensemble du personnel de votre entreprise</p>
          </div>
        </div>
        <button class="add-btn" (click)="showForm = true; resetForm()">
          <span>+</span> Ajouter un employé
        </button>
      </div>

      <!-- Bandeau d'erreur chargement -->
      <div class="error-banner" *ngIf="loadError">
        <span class="error-icon">⚠️</span>
        <span>{{ loadError }}</span>
        <button class="retry-btn" (click)="loadError = null; loadEmployees()">Réessayer</button>
      </div>

      <!-- Bannière de succès après création -->
      <div class="success-banner" *ngIf="createdUsername">
        <div class="sb-icon">✅</div>
        <div>
          <div class="sb-title">Employé créé avec succès</div>
          <div class="sb-body">
            Le compte Keycloak a été créé.<br>
            Nom d'utilisateur : <span class="sb-username">{{ createdUsername }}</span><br>
            L'employé doit changer son mot de passe à la première connexion.
          </div>
        </div>
      </div>

      <!-- Tableau -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Matricule</th><th>Nom Complet</th><th>Email</th>
              <th>Poste</th><th>Département</th><th>Service</th>
              <th>Contrat</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of employees">
              <td><strong>{{ emp.matricule }}</strong></td>
              <td>{{ emp.firstName }} {{ emp.lastName }}</td>
              <td>{{ emp.email }}</td>
              <td>{{ emp.position || '—' }}</td>
              <td>{{ emp.department?.name || '—' }}</td>
              <td>{{ emp.service?.name || '—' }}</td>
              <td>
                <span *ngIf="emp.contract" class="badge" [class]="emp.contract.type">{{ emp.contract.type }}</span>
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
        <div class="modal-form" (click)="$event.stopPropagation()">
          <!-- Modal header -->
          <div class="mf-header">
            <div class="mf-icon">{{ isEditing ? '✏️' : '👤' }}</div>
            <h3>{{ isEditing ? 'Modifier' : 'Ajouter' }} un employé</h3>
            <p class="mf-sub">{{ isEditing ? 'Modifiez les informations ci-dessous' : 'Remplissez les informations du nouvel employé' }}</p>
          </div>

          <div class="mf-body">
            <!-- Section: Informations personnelles -->
            <div class="section">
              <div class="section-title"><span class="st-icon">📋</span> Informations personnelles</div>
              <div class="grid-2">
                <div class="field">
                  <label>Matricule</label>
                  <input [(ngModel)]="form.matricule" placeholder="Ex: EMP-001" />
                </div>
                <div class="field">
                  <label>Prénom</label>
                  <input [(ngModel)]="form.firstName" placeholder="Prénom" />
                </div>
                <div class="field">
                  <label>Nom</label>
                  <input [(ngModel)]="form.lastName" placeholder="Nom" />
                </div>
                <div class="field">
                  <label>Email</label>
                  <input [(ngModel)]="form.email" placeholder="email@exemple.com" type="email" />
                </div>
                <div class="field">
                  <label>Téléphone</label>
                  <input [(ngModel)]="form.phone" placeholder="+216 XX XXX XXX" />
                </div>
                <div class="field">
                  <label>Poste</label>
                  <input [(ngModel)]="form.position" placeholder="Ex: Développeur" />
                </div>
              </div>
            </div>

            <!-- Section: Affectation -->
            <div class="section">
              <div class="section-title"><span class="st-icon">🏗️</span> Affectation</div>
              <div class="grid-2">
                <div class="field">
                  <label>Date d'embauche</label>
                  <input [(ngModel)]="form.hireDate" type="date" />
                </div>
                <div class="field">
                  <label>Département</label>
                  <select [(ngModel)]="form.departmentId" (change)="onDepartmentChange()">
                    <option value="">-- Sélectionner --</option>
                    <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
                  </select>
                </div>
                <div class="field">
                  <label>Service</label>
                  <select [(ngModel)]="form.serviceId" [disabled]="!form.departmentId">
                    <option value="">-- Sélectionner --</option>
                    <option *ngFor="let svc of filteredServices" [value]="svc.id">{{ svc.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Section: Compte Keycloak (création uniquement) -->
            <div class="section" *ngIf="!isEditing">
              <div class="section-title"><span class="st-icon">🔐</span> Compte d'accès</div>
              <div class="kc-info-banner">
                <span class="kc-info-icon">ℹ️</span>
                <span>Le nom d'utilisateur sera généré automatiquement : <strong>prénom.nom</strong></span>
              </div>
              <div class="grid-2">
                <div class="field">
                  <label>Rôle</label>
                  <select [(ngModel)]="form.keycloakRole">
                    <option value="EMPLOYEE">Employé</option>
                    <option value="HR_ADMIN">Administrateur RH</option>
                  </select>
                </div>
                <div class="field">
                  <label>Mot de passe temporaire</label>
                  <input [(ngModel)]="form.temporaryPassword" type="password" placeholder="Laissez vide pour le défaut" />
                </div>
              </div>
            </div>

            <!-- Section: Contrat -->
            <div class="section">
              <div class="section-title"><span class="st-icon">📄</span> Contrat</div>
              <div class="grid-2">
                <div class="field">
                  <label>Type de contrat</label>
                  <select [(ngModel)]="form.contractType">
                    <option value="">-- Sélectionner --</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="STAGE">Stage</option>
                  </select>
                </div>
                <div class="field">
                  <label>Salaire mensuel (DT)</label>
                  <input [(ngModel)]="form.contractSalary" placeholder="Ex: 2500" type="number" />
                </div>
                <div class="field">
                  <label>Date début</label>
                  <input [(ngModel)]="form.contractStartDate" type="date" />
                </div>
                <div class="field">
                  <label>Date fin</label>
                  <input [(ngModel)]="form.contractEndDate" type="date" />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer actions -->
          <div class="mf-footer">
            <button class="btn-cancel" (click)="showForm = false">✕ Annuler</button>
            <button class="btn-submit" (click)="saveEmployee()">
              {{ isEditing ? '💾 Enregistrer' : '✅ Créer l\\'employé' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Documents -->
      <div class="modal-overlay" *ngIf="showDocModal" (click)="showDocModal = false">
        <div class="modal-form doc-modal" (click)="$event.stopPropagation()">
          <div class="mf-header">
            <div class="mf-icon">📎</div>
            <h3>Documents</h3>
            <p class="mf-sub">{{ docEmployee?.firstName }} {{ docEmployee?.lastName }}</p>
          </div>
          <div class="mf-body">
            <div class="upload-zone">
              <input type="file" #fileInput (change)="onFileSelected($event)" class="file-input" />
              <button class="upload-btn" (click)="uploadFile()" [disabled]="!selectedFile">📤 Uploader</button>
            </div>
            <div class="doc-list">
              <div class="doc-item" *ngFor="let doc of documents">
                <div class="doc-icon">{{ getFileIcon(doc.fileType) }}</div>
                <div class="doc-info">
                  <div class="doc-name">{{ doc.fileName }}</div>
                  <div class="doc-meta">{{ doc.uploadDate }} &bull; {{ doc.fileType }}</div>
                </div>
                <div class="doc-actions">
                  <button class="dl-btn" (click)="downloadDoc(doc)">📥</button>
                  <button class="rm-btn" (click)="deleteDoc(doc.id)">🗑️</button>
                </div>
              </div>
              <p *ngIf="documents.length === 0" class="empty-docs">Aucun document.</p>
            </div>
          </div>
          <div class="mf-footer">
            <button class="btn-cancel" (click)="showDocModal = false">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { animation: fadeIn 0.4s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; }
    .header-left { display:flex; align-items:center; gap:14px; }
    .header-icon { font-size:2.2rem; }
    .page-header h1 { margin:0; font-size:1.6rem; font-weight:800; background:linear-gradient(135deg,#1e3a5f,#3b82f6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .header-sub { margin:4px 0 0; color:#64748b; font-size:0.88rem; }
    .add-btn { display:flex; align-items:center; gap:6px; padding:10px 22px; background:linear-gradient(135deg,#3b82f6,#2563eb); color:white; border:none; border-radius:10px; cursor:pointer; font-size:0.9rem; font-weight:600; box-shadow:0 4px 12px rgba(37,99,235,0.25); transition:all 0.25s; }
    .add-btn:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(37,99,235,0.35); }
    .add-btn span { font-size:1.2rem; font-weight:700; }

    .table-container { background:white; border-radius:14px; overflow-x:auto; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
    table { width:100%; border-collapse:collapse; }
    th { background:#f8fafc; padding:14px 16px; text-align:left; color:#475569; font-size:0.82rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #e2e8f0; }
    td { padding:14px 16px; border-bottom:1px solid #f1f5f9; font-size:0.88rem; color:#334155; }
    tr:hover { background:#f8fafc; }
    .badge { padding:3px 12px; border-radius:20px; font-size:0.73rem; font-weight:700; }
    .CDI { background:#dcfce7; color:#166534; } .CDD { background:#fef9c3; color:#854d0e; } .STAGE { background:#dbeafe; color:#1e40af; }
    .actions { display:flex; gap:6px; }
    .edit-btn,.delete-btn,.doc-btn { border:none; background:none; cursor:pointer; font-size:1.05rem; padding:5px; border-radius:8px; transition:background 0.15s; }
    .edit-btn:hover { background:#dbeafe; } .delete-btn:hover { background:#fee2e2; } .doc-btn:hover { background:#f0fdf4; }

    /* Modal overlay */
    .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; animation:fadeIn 0.2s ease; }

    /* Form modal */
    .modal-form { background:white; border-radius:20px; width:94%; max-width:680px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 48px rgba(0,0,0,0.2); animation:modalIn 0.3s ease; }
    @keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }

    .mf-header { text-align:center; padding:28px 24px 16px; background:linear-gradient(135deg,#eff6ff,#f8fafc); border-bottom:1px solid #e2e8f0; }
    .mf-icon { font-size:2.2rem; margin-bottom:6px; }
    .mf-header h3 { margin:0 0 4px; color:#1e293b; font-size:1.25rem; font-weight:800; }
    .mf-sub { margin:0; color:#64748b; font-size:0.88rem; }

    .mf-body { padding:24px; }

    /* Sections */
    .section { margin-bottom:24px; }
    .section:last-child { margin-bottom:0; }
    .section-title { display:flex; align-items:center; gap:8px; font-weight:700; color:#1e3a5f; font-size:0.95rem; margin-bottom:14px; padding-bottom:10px; border-bottom:2px solid #eff6ff; }
    .st-icon { font-size:1.1rem; }

    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.4px; }
    .field input, .field select {
      padding:11px 14px; border:2px solid #e2e8f0; border-radius:10px;
      font-size:0.9rem; outline:none; font-family:inherit; background:white;
      transition:all 0.2s; color:#1e293b;
    }
    .field input:focus, .field select:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
    .field input::placeholder { color:#94a3b8; }
    .field select:disabled { background:#f8fafc; color:#94a3b8; cursor:not-allowed; }

    /* Footer */
    .mf-footer { display:flex; justify-content:center; gap:14px; padding:20px 24px 28px; border-top:1px solid #f1f5f9; }
    .btn-cancel { padding:11px 28px; border:2px solid #e2e8f0; background:white; border-radius:10px; cursor:pointer; font-size:0.9rem; font-weight:600; color:#64748b; transition:all 0.2s; }
    .btn-cancel:hover { background:#f8fafc; border-color:#cbd5e1; }
    .btn-submit { padding:11px 32px; background:linear-gradient(135deg,#3b82f6,#2563eb); color:white; border:none; border-radius:10px; cursor:pointer; font-size:0.9rem; font-weight:700; box-shadow:0 4px 12px rgba(37,99,235,0.25); transition:all 0.25s; }
    .btn-submit:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(37,99,235,0.35); }

    /* Documents modal */
    .doc-modal { max-width:620px; }
    .upload-zone { display:flex; gap:12px; align-items:center; margin-bottom:18px; padding:14px; background:#f8fafc; border-radius:12px; border:2px dashed #cbd5e1; }
    .file-input { flex:1; font-size:0.85rem; }
    .upload-btn { padding:8px 18px; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; border-radius:8px; cursor:pointer; font-size:0.85rem; font-weight:600; transition:all 0.2s; }
    .upload-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .doc-list { max-height:280px; overflow-y:auto; }
    .doc-item { display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #f1f5f9; border-radius:8px; transition:background 0.15s; }
    .doc-item:hover { background:#f8fafc; }
    .doc-icon { font-size:1.5rem; }
    .doc-info { flex:1; }
    .doc-name { font-weight:600; color:#1e293b; font-size:0.88rem; }
    .doc-meta { color:#94a3b8; font-size:0.75rem; }
    .doc-actions { display:flex; gap:6px; }
    .dl-btn,.rm-btn { border:none; background:none; cursor:pointer; font-size:1.1rem; padding:4px; border-radius:6px; transition:background 0.15s; }
    .dl-btn:hover { background:#dbeafe; } .rm-btn:hover { background:#fee2e2; }
    .empty-docs { color:#94a3b8; font-style:italic; text-align:center; padding:24px 0; }

    /* Error banner */
    .error-banner { display:flex; align-items:center; gap:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:14px 18px; margin-bottom:18px; color:#dc2626; font-size:0.88rem; }
    .error-icon { font-size:1.2rem; flex-shrink:0; }
    .retry-btn { margin-left:auto; padding:6px 16px; background:#dc2626; color:white; border:none; border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:600; flex-shrink:0; }
    .retry-btn:hover { background:#b91c1c; }

    /* Keycloak account section */
    .kc-info-banner { display:flex; align-items:center; gap:8px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 14px; margin-bottom:14px; font-size:0.85rem; color:#1e40af; }
    .kc-info-icon { font-size:1rem; flex-shrink:0; }
    .kc-info-banner strong { font-weight:700; }

    /* Success banner */
    .success-banner { background:#f0fdf4; border:1px solid #86efac; border-radius:12px; padding:14px 18px; margin-bottom:18px; display:flex; align-items:flex-start; gap:12px; }
    .success-banner .sb-icon { font-size:1.4rem; flex-shrink:0; margin-top:1px; }
    .success-banner .sb-title { font-weight:700; color:#15803d; font-size:0.95rem; margin-bottom:4px; }
    .success-banner .sb-body { color:#166534; font-size:0.85rem; line-height:1.6; }
    .sb-username { font-family:monospace; background:#dcfce7; border:1px solid #86efac; border-radius:6px; padding:2px 8px; font-weight:700; }

    @media (max-width:600px) {
      .grid-2 { grid-template-columns:1fr; }
      .mf-footer { flex-direction:column; }
      .btn-cancel,.btn-submit { width:100%; text-align:center; }
    }
  `]
})
export class EmployeeManagementComponent implements OnInit {
  employees: any[] = [];
  departments: any[] = [];
  allServices: any[] = [];
  filteredServices: any[] = [];
  showForm = false;
  isEditing = false;
  editId: number | null = null;
  form: any = {};
  createdUsername: string | null = null;
  loadError: string | null = null;

  // Documents
  showDocModal = false;
  docEmployee: any = null;
  documents: any[] = [];
  selectedFile: File | null = null;

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
    this.loadServices();
  }

  loadEmployees(): void {
    this.employeeApi.getAllEmployees().subscribe({
      next: (data) => this.employees = data,
      error: (err: any) => {
        console.error('Erreur chargement employés:', err);
        this.loadError = 'Impossible de charger les employés. Vérifiez que le serveur est démarré.';
      }
    });
  }

  loadDepartments(): void {
    this.employeeApi.getDepartments().subscribe({ next: (data) => this.departments = data });
  }

  loadServices(): void {
    this.employeeApi.getServices().subscribe({ next: (data) => this.allServices = data });
  }

  onDepartmentChange(): void {
    this.form.serviceId = '';
    if (this.form.departmentId) {
      this.filteredServices = this.allServices.filter(s => s.department?.id === +this.form.departmentId);
    } else {
      this.filteredServices = [];
    }
  }

  resetForm(): void {
    this.form = { contractType: '', departmentId: '', serviceId: '', keycloakRole: 'EMPLOYEE', temporaryPassword: '' };
    this.filteredServices = [];
    this.isEditing = false;
    this.editId = null;
    this.createdUsername = null;
  }

  editEmployee(emp: any): void {
    this.form = {
      ...emp,
      departmentId: emp.department?.id || '',
      serviceId: emp.service?.id || '',
      contractType: emp.contract?.type || '',
      contractStartDate: emp.contract?.startDate || '',
      contractEndDate: emp.contract?.endDate || '',
      contractSalary: emp.contract?.salary || ''
    };
    this.isEditing = true;
    this.editId = emp.id;
    if (this.form.departmentId) {
      this.filteredServices = this.allServices.filter(s => s.department?.id === +this.form.departmentId);
    } else {
      this.filteredServices = [];
    }
    this.showForm = true;
  }

  saveEmployee(): void {
    const contract = this.form.contractType ? {
      ...(this.isEditing && this.form.contract?.id ? { id: this.form.contract.id } : {}),
      type: this.form.contractType,
      startDate: this.form.contractStartDate || null,
      endDate: this.form.contractEndDate || null,
      salary: this.form.contractSalary || null
    } : null;

    if (this.isEditing) {
      // Mise à jour : on envoie l'entité Employee directement (pas de Keycloak)
      const payload = {
        ...this.form,
        department: this.form.departmentId ? { id: this.form.departmentId } : null,
        service: this.form.serviceId ? { id: this.form.serviceId } : null,
        contract
      };
      this.employeeApi.updateEmployee(this.editId!, payload).subscribe({
        next: () => { this.showForm = false; this.loadEmployees(); },
        error: (err: any) => alert('Erreur mise à jour : ' + (err.error?.message || err.message))
      });
    } else {
      // Création : on envoie le DTO avec les champs Keycloak
      const payload = {
        matricule: this.form.matricule,
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        email: this.form.email,
        phone: this.form.phone,
        position: this.form.position,
        hireDate: this.form.hireDate || null,
        department: this.form.departmentId ? { id: this.form.departmentId } : null,
        service: this.form.serviceId ? { id: this.form.serviceId } : null,
        contract,
        keycloakRole: this.form.keycloakRole || 'EMPLOYEE',
        temporaryPassword: this.form.temporaryPassword || null
      };
      this.employeeApi.createEmployee(payload).subscribe({
        next: (emp: any) => {
          this.showForm = false;
          this.createdUsername = emp.keycloakUsername;
          this.loadEmployees();
          // Effacer la bannière après 12 secondes
          setTimeout(() => this.createdUsername = null, 12000);
        },
        error: (err: any) => alert('Erreur création : ' + (err.error?.message || err.message))
      });
    }
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

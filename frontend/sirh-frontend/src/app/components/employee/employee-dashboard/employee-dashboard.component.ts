import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Dashboard personnel de l'employé.
 * Affiche le profil, les infos de contrat et le département.
 */
@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>🏠 Mon Dashboard</h1>
      <p class="welcome">Bienvenue, <strong>{{ keycloakService.getFullName() }}</strong></p>

      <div class="cards">
        <!-- Carte Profil -->
        <div class="card">
          <h3>👤 Mon Profil</h3>
          <div *ngIf="profile; else loading">
            <div class="info-row"><span>Matricule</span><strong>{{ profile.matricule }}</strong></div>
            <div class="info-row"><span>Nom</span><strong>{{ profile.firstName }} {{ profile.lastName }}</strong></div>
            <div class="info-row"><span>Email</span><strong>{{ profile.email }}</strong></div>
            <div class="info-row"><span>Téléphone</span><strong>{{ profile.phone || '—' }}</strong></div>
            <div class="info-row"><span>Poste</span><strong>{{ profile.position || '—' }}</strong></div>
          </div>
          <ng-template #loading><p class="loading">Chargement...</p></ng-template>
        </div>

        <!-- Carte Département -->
        <div class="card" *ngIf="profile?.department">
          <h3>🏗️ Mon Département</h3>
          <div class="info-row"><span>Nom</span><strong>{{ profile.department.name }}</strong></div>
          <div class="info-row"><span>Description</span><strong>{{ profile.department.description || '—' }}</strong></div>
        </div>

        <!-- Carte Contrat -->
        <div class="card" *ngIf="profile?.contract">
          <h3>📄 Mon Contrat</h3>
          <div class="info-row"><span>Type</span>
            <strong class="badge" [class]="profile.contract.type">{{ profile.contract.type }}</strong>
          </div>
          <div class="info-row"><span>Début</span><strong>{{ profile.contract.startDate }}</strong></div>
          <div class="info-row"><span>Fin</span><strong>{{ profile.contract.endDate || 'Indéterminé' }}</strong></div>
          <div class="info-row"><span>Salaire</span><strong>{{ profile.contract.salary | number:'1.2-2' }} DT</strong></div>
        </div>

        <!-- Carte Documents -->
        <div class="card">
          <h3>📎 Mes Documents</h3>
          <div class="doc-list" *ngIf="documents.length > 0">
            <div class="doc-row" *ngFor="let doc of documents">
              <div class="doc-row-info">
                <strong>{{ doc.fileName }}</strong>
                <span class="doc-date">{{ doc.uploadDate }}</span>
              </div>
              <button class="download-btn" (click)="downloadDocument(doc)">
                Telecharger
              </button>
            </div>
          </div>
          <p *ngIf="documents.length === 0" class="no-docs">Aucun document disponible.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard h1 { margin: 0 0 4px 0; color: #1e3a5f; }
    .welcome { color: #64748b; margin-bottom: 24px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
    .card {
      background: white; border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
    }
    .card h3 { margin: 0 0 16px 0; color: #334155; font-size: 1.1rem; }
    .info-row {
      display: flex; justify-content: space-between; padding: 8px 0;
      border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;
    }
    .info-row span { color: #94a3b8; }
    .info-row strong { color: #1e293b; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; }
    .CDI { background: #dcfce7; color: #166534; }
    .CDD { background: #fef9c3; color: #854d0e; }
    .STAGE { background: #dbeafe; color: #1e40af; }
    .loading { color: #94a3b8; font-style: italic; }
    .doc-list { display: flex; flex-direction: column; gap: 0; }
    .doc-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid #f1f5f9;
    }
    .doc-row-info { display: flex; flex-direction: column; }
    .doc-row-info strong { color: #1e293b; font-size: 0.9rem; }
    .doc-date { color: #94a3b8; font-size: 0.75rem; }
    .download-btn {
      padding: 5px 12px; background: #3b82f6; color: white; border: none;
      border-radius: 6px; cursor: pointer; font-size: 0.8rem;
    }
    .download-btn:hover { background: #2563eb; }
    .no-docs { color: #94a3b8; font-style: italic; text-align: center; margin: 12px 0 0 0; }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  profile: any = null;
  documents: any[] = [];

  constructor(
    public keycloakService: KeycloakService,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    this.employeeApi.getMyProfile().subscribe({
      next: (data) => this.profile = data,
      error: () => {
        // Fallback : afficher les infos Keycloak si pas de fiche employé
        this.profile = {
          firstName: this.keycloakService.keycloak.tokenParsed?.['given_name'] || '',
          lastName: this.keycloakService.keycloak.tokenParsed?.['family_name'] || '',
          email: this.keycloakService.getEmail(),
          matricule: '\u2014',
          position: this.keycloakService.isHrAdmin() ? 'RH Administrateur' : 'Employ\u00e9',
          phone: '\u2014'
        };
      }
    });

    this.employeeApi.getMyDocuments().subscribe({
      next: (data) => this.documents = data,
      error: () => this.documents = []
    });
  }

  downloadDocument(doc: any): void {
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
}

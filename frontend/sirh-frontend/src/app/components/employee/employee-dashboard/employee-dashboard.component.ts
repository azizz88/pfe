import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Dashboard personnel de l'employé.
 * La carte "Mon Profil" ouvre une modale en lecture seule avec toutes les données.
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
        <!-- Carte Profil cliquable -->
        <div class="card card-profile clickable" (click)="openProfile()" title="Cliquer pour voir mon profil complet">
          <div class="card-header">
            <h3>👤 Mon Profil</h3>
            <span class="view-badge">👁️ Voir tout</span>
          </div>
          <div *ngIf="profile; else loading">
            <div class="info-row"><span>Matricule</span><strong>{{ profile.matricule }}</strong></div>
            <div class="info-row"><span>Nom</span><strong>{{ profile.firstName }} {{ profile.lastName }}</strong></div>
            <div class="info-row"><span>Email</span><strong>{{ profile.email }}</strong></div>
            <div class="info-row"><span>Poste</span><strong>{{ profile.position || '—' }}</strong></div>
          </div>
          <ng-template #loading><p class="loading">Chargement...</p></ng-template>
          <div class="click-hint">🔍 Cliquez pour afficher toutes vos informations</div>
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

    <!-- ══════════════ Modale Profil Complet (Lecture seule) ══════════════ -->
    <div class="modal-overlay" *ngIf="showProfileModal" (click)="closeProfile()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <!-- En-tête -->
        <div class="modal-header">
          <div class="modal-avatar">
            {{ (profile?.firstName || '?')[0]?.toUpperCase() }}{{ (profile?.lastName || '')[0]?.toUpperCase() }}
          </div>
          <div class="modal-title">
            <h2>{{ profile?.firstName }} {{ profile?.lastName }}</h2>
            <span class="modal-subtitle">{{ profile?.position || 'Employé' }}</span>
          </div>
          <button class="close-btn" (click)="closeProfile()">✕</button>
        </div>

        <!-- Alerte lecture seule -->
        <div class="readonly-notice">
          <span class="notice-icon">ℹ️</span>
          <span>Ces informations sont en <strong>lecture seule</strong>. Pour toute correction, veuillez contacter votre administrateur RH.</span>
        </div>

        <!-- Sections -->
        <div class="modal-sections">

          <!-- Section Informations Personnelles -->
          <div class="section">
            <div class="section-title">📋 Informations Personnelles</div>
            <div class="field-grid">
              <div class="field">
                <label>Matricule</label>
                <div class="field-value">{{ profile?.matricule || '—' }}</div>
              </div>
              <div class="field">
                <label>Prénom</label>
                <div class="field-value">{{ profile?.firstName || '—' }}</div>
              </div>
              <div class="field">
                <label>Nom</label>
                <div class="field-value">{{ profile?.lastName || '—' }}</div>
              </div>
              <div class="field">
                <label>Email</label>
                <div class="field-value">{{ profile?.email || '—' }}</div>
              </div>
              <div class="field">
                <label>Téléphone</label>
                <div class="field-value">{{ profile?.phone || '—' }}</div>
              </div>
              <div class="field">
                <label>Poste</label>
                <div class="field-value">{{ profile?.position || '—' }}</div>
              </div>
              <div class="field">
                <label>Username Keycloak</label>
                <div class="field-value">{{ profile?.keycloakUsername || '—' }}</div>
              </div>
              <div class="field">
                <label>Date d'embauche</label>
                <div class="field-value">{{ profile?.hireDate || '—' }}</div>
              </div>
            </div>
          </div>

          <!-- Section Département -->
          <div class="section" *ngIf="profile?.department">
            <div class="section-title">🏗️ Département</div>
            <div class="field-grid">
              <div class="field">
                <label>Nom du département</label>
                <div class="field-value">{{ profile?.department?.name || '—' }}</div>
              </div>
              <div class="field">
                <label>Description</label>
                <div class="field-value">{{ profile?.department?.description || '—' }}</div>
              </div>
            </div>
          </div>

          <!-- Section Contrat -->
          <div class="section" *ngIf="profile?.contract">
            <div class="section-title">📄 Contrat</div>
            <div class="field-grid">
              <div class="field">
                <label>Type de contrat</label>
                <div class="field-value">
                  <span class="badge" [class]="profile?.contract?.type">{{ profile?.contract?.type || '—' }}</span>
                </div>
              </div>
              <div class="field">
                <label>Date début</label>
                <div class="field-value">{{ profile?.contract?.startDate || '—' }}</div>
              </div>
              <div class="field">
                <label>Date fin</label>
                <div class="field-value">{{ profile?.contract?.endDate || 'Indéterminé' }}</div>
              </div>
              <div class="field">
                <label>Salaire mensuel</label>
                <div class="field-value salary">{{ profile?.contract?.salary | number:'1.2-2' }} DT</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <div class="contact-admin">
            <span class="contact-icon">📧</span>
            <span>Une erreur dans vos informations ? Contactez votre <strong>administrateur RH</strong> pour les corriger.</span>
          </div>
          <button class="close-modal-btn" (click)="closeProfile()">Fermer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Dashboard ── */
    .dashboard h1 { margin: 0 0 4px 0; color: #1e3a5f; }
    .welcome { color: #64748b; margin-bottom: 24px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

    .card {
      background: white; border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
    }
    .card h3 { margin: 0 0 16px 0; color: #334155; font-size: 1.1rem; }

    /* Carte profil cliquable */
    .card-profile {
      border: 2px solid #3b82f6;
      background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    .card-profile:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(59,130,246,0.18);
      border-color: #2563eb;
    }
    .card-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    }
    .card-header h3 { margin: 0; }
    .view-badge {
      background: #3b82f6; color: white;
      padding: 3px 10px; border-radius: 999px; font-size: 0.75rem;
    }
    .click-hint {
      margin-top: 12px; padding: 8px 12px;
      background: #eff6ff; border-radius: 8px;
      color: #2563eb; font-size: 0.8rem; text-align: center;
    }

    .info-row {
      display: flex; justify-content: space-between; padding: 8px 0;
      border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;
    }
    .info-row span { color: #94a3b8; }
    .info-row strong { color: #1e293b; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
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

    /* ── Modale Profil Complet ── */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000; padding: 16px;
      backdrop-filter: blur(3px);
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-box {
      background: #ffffff; border-radius: 20px; width: 100%; max-width: 680px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: 0 25px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* En-tête modale */
    .modal-header {
      display: flex; align-items: center; gap: 16px;
      padding: 24px 28px; border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
      border-radius: 20px 20px 0 0;
    }
    .modal-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: rgba(255,255,255,0.2); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 700; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.4);
    }
    .modal-title { flex: 1; }
    .modal-title h2 { margin: 0; color: white; font-size: 1.3rem; }
    .modal-subtitle { color: rgba(255,255,255,0.75); font-size: 0.9rem; }
    .close-btn {
      background: rgba(255,255,255,0.15); border: none; color: white;
      width: 36px; height: 36px; border-radius: 50%;
      font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.3); }

    /* Notice lecture seule */
    .readonly-notice {
      display: flex; align-items: flex-start; gap: 10px;
      margin: 16px 28px 0 28px; padding: 12px 16px;
      background: #fffbeb; border: 1px solid #fde68a;
      border-radius: 10px; color: #78350f; font-size: 0.85rem;
    }
    .notice-icon { font-size: 1rem; flex-shrink: 0; }

    /* Sections */
    .modal-sections { padding: 20px 28px; display: flex; flex-direction: column; gap: 24px; }

    .section {}
    .section-title {
      font-weight: 700; color: #1e3a5f; font-size: 0.95rem;
      margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .field-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label {
      font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 600;
    }
    .field-value {
      padding: 10px 14px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; color: #1e293b; font-size: 0.9rem;
      min-height: 40px; display: flex; align-items: center;
    }
    .salary { color: #166534; font-weight: 700; background: #f0fdf4; border-color: #bbf7d0; }

    /* Footer modale */
    .modal-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 28px 24px 28px; border-top: 1px solid #f1f5f9;
      background: #f8fafc; border-radius: 0 0 20px 20px; gap: 16px;
    }
    .contact-admin {
      display: flex; align-items: flex-start; gap: 8px;
      color: #475569; font-size: 0.82rem; flex: 1;
    }
    .contact-icon { font-size: 1rem; flex-shrink: 0; }
    .close-modal-btn {
      padding: 10px 24px; background: #1e3a5f; color: white;
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 0.9rem; font-weight: 600; white-space: nowrap;
      transition: background 0.2s;
    }
    .close-modal-btn:hover { background: #1e40af; }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  profile: any = null;
  documents: any[] = [];
  showProfileModal = false;

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

  openProfile(): void {
    this.showProfileModal = true;
  }

  closeProfile(): void {
    this.showProfileModal = false;
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

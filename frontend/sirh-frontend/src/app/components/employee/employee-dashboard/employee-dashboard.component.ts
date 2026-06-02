import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Dashboard personnel de l'employé.
 * La carte "Mon Profil" ouvre une modale en lecture seule avec toutes les données.
 */
@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <h1>🏠 Mon Dashboard</h1>
      <p class="welcome">Bienvenue, <strong>{{ keycloakService.getFullName() }}</strong></p>

      <!-- ══════════════ Navigation Rapide (miroir de la sidebar) ══════════════ -->
      <h2 class="section-heading">⚡ Accès Rapide</h2>
      <div class="quick-nav">
        <a class="nav-tile tile-profile" routerLink="/employee/profile">
          <div class="tile-icon">👤</div>
          <div class="tile-body">
            <h4>Mon Profil</h4>
            <p>Voir et gérer mes informations</p>
          </div>
          <span class="tile-arrow">→</span>
        </a>

        <a class="nav-tile tile-directory" routerLink="/employee/directory">
          <div class="tile-icon">📖</div>
          <div class="tile-body">
            <h4>Annuaire</h4>
            <p>Rechercher mes collègues</p>
          </div>
          <span class="tile-arrow">→</span>
        </a>

        <a class="nav-tile tile-jobs" routerLink="/employee/applications">
          <div class="tile-icon">💼</div>
          <div class="tile-body">
            <h4>Offres d'emploi</h4>
            <p>Postuler en interne</p>
          </div>
          <span class="tile-arrow">→</span>
        </a>
      </div>

      <!-- ══════════════ Bandeau identité ══════════════ -->
      <div class="identity-banner" *ngIf="profile">
        <div class="identity-avatar">
          {{ (profile.firstName || '?')[0]?.toUpperCase() }}{{ (profile.lastName || '')[0]?.toUpperCase() }}
        </div>
        <div class="identity-info">
          <h2>{{ profile.firstName }} {{ profile.lastName }}</h2>
          <div class="identity-meta">
            <span class="meta-chip" *ngIf="profile.position">💼 {{ profile.position }}</span>
            <span class="meta-chip" *ngIf="profile.department?.name">🏗️ {{ profile.department.name }}</span>
            <span class="meta-chip matricule-chip" *ngIf="profile.matricule">🔖 {{ profile.matricule }}</span>
          </div>
        </div>
        <div class="readonly-tag">🔒 Lecture seule</div>
      </div>

      <!-- ══════════════ Mes Informations ══════════════ -->
      <h2 class="section-heading">📋 Mes Informations</h2>

      <div class="readonly-notice">
        <span class="notice-icon">ℹ️</span>
        <span>Ces informations sont en <strong>lecture seule</strong>. Pour toute correction, veuillez contacter votre administrateur RH.</span>
      </div>

      <div class="cards" *ngIf="profile; else loading">

        <!-- Carte Informations personnelles -->
        <div class="card">
          <h3>👤 Informations personnelles</h3>
          <div class="info-row"><span>Matricule</span><strong>{{ profile.matricule || '—' }}</strong></div>
          <div class="info-row"><span>Prénom</span><strong>{{ profile.firstName || '—' }}</strong></div>
          <div class="info-row"><span>Nom</span><strong>{{ profile.lastName || '—' }}</strong></div>
          <div class="info-row"><span>Email</span><strong>{{ profile.email || '—' }}</strong></div>
          <div class="info-row"><span>Téléphone</span><strong>{{ profile.phone || '—' }}</strong></div>
          <div class="info-row"><span>Poste</span><strong>{{ profile.position || '—' }}</strong></div>
          <div class="info-row"><span>Username</span><strong>{{ profile.keycloakUsername || '—' }}</strong></div>
          <div class="info-row"><span>Date d'embauche</span><strong>{{ profile.hireDate || '—' }}</strong></div>
        </div>

        <!-- Carte Département -->
        <div class="card" *ngIf="profile?.department">
          <h3>🏗️ Mon Département</h3>
          <div class="info-row"><span>Nom</span><strong>{{ profile.department.name }}</strong></div>
          <div class="info-row"><span>Description</span><strong>{{ profile.department.description || '—' }}</strong></div>
          <div class="info-row" *ngIf="profile.department.manager">
            <span>Manager</span>
            <strong>{{ profile.department.manager.firstName }} {{ profile.department.manager.lastName }}</strong>
          </div>
        </div>

        <!-- Carte Service -->
        <div class="card" *ngIf="profile?.service">
          <h3>📂 Mon Service</h3>
          <div class="info-row"><span>Nom</span><strong>{{ profile.service.name }}</strong></div>
          <div class="info-row"><span>Description</span><strong>{{ profile.service.description || '—' }}</strong></div>
        </div>

        <!-- Carte Contrat -->
        <div class="card" *ngIf="profile?.contract">
          <h3>📄 Mon Contrat</h3>
          <div class="info-row"><span>Type</span>
            <strong class="badge" [class]="profile.contract.type">{{ profile.contract.type }}</strong>
          </div>
          <div class="info-row"><span>Début</span><strong>{{ profile.contract.startDate || '—' }}</strong></div>
          <div class="info-row"><span>Fin</span><strong>{{ profile.contract.endDate || 'Indéterminé' }}</strong></div>
          <div class="info-row"><span>Salaire</span><strong class="salary-val">{{ profile.contract.salary | number:'1.2-2' }} DT</strong></div>
        </div>

        <!-- Carte Compétences -->
        <div class="card card-skills">
          <h3>🎓 Mes Compétences</h3>
          <div class="skills-list" *ngIf="skills.length > 0">
            <div class="skill-item" *ngFor="let s of skills">
              <div class="skill-head">
                <span class="skill-name">{{ s.skillName || s.skill?.name }}</span>
                <span class="skill-cat" *ngIf="s.category || s.skill?.category">{{ s.category || s.skill?.category }}</span>
              </div>
              <div class="skill-stars">
                <span class="star" *ngFor="let _ of [1,2,3,4,5]; let i = index"
                      [class.filled]="i < (s.level || 0)">★</span>
                <span class="level-num">{{ s.level || 0 }}/5</span>
              </div>
            </div>
          </div>
          <p *ngIf="skills.length === 0" class="no-docs">Aucune compétence enregistrée.</p>
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
      <ng-template #loading><p class="loading">Chargement de vos informations...</p></ng-template>
    </div>

  `,
  styles: [`
    /* ── Dashboard ── */
    .dashboard h1 { margin: 0 0 4px 0; color: #1e3a5f; }
    .welcome { color: #64748b; margin-bottom: 28px; }

    .section-heading {
      margin: 28px 0 16px 0;
      font-size: 1.05rem;
      color: #1e3a5f;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .section-heading:first-of-type { margin-top: 8px; }

    /* ── Quick Nav Tiles (miroir sidebar) ── */
    .quick-nav {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 12px;
    }
    .nav-tile {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      background: white;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .nav-tile::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #60a5fa, #a78bfa);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .nav-tile:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(59,130,246,0.15);
      border-color: #93c5fd;
    }
    .nav-tile:hover::before { opacity: 1; }
    .nav-tile:hover .tile-arrow { transform: translateX(4px); color: #2563eb; }

    .tile-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .tile-profile .tile-icon { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
    .tile-directory .tile-icon { background: linear-gradient(135deg, #fef3c7, #fde68a); }
    .tile-jobs .tile-icon { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }

    .tile-body { flex: 1; min-width: 0; }
    .tile-body h4 {
      margin: 0 0 4px 0;
      color: #1e293b;
      font-size: 0.98rem;
      font-weight: 700;
    }
    .tile-body p {
      margin: 0;
      color: #64748b;
      font-size: 0.8rem;
    }
    .tile-arrow {
      color: #94a3b8;
      font-size: 1.2rem;
      font-weight: 600;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

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

    /* ── Bandeau identité ── */
    .identity-banner {
      display: flex; align-items: center; gap: 18px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
      border-radius: 16px;
      margin-bottom: 24px;
      color: white;
      box-shadow: 0 8px 24px rgba(30,58,95,0.18);
    }
    .identity-avatar {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(255,255,255,0.18); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 800; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.35);
    }
    .identity-info { flex: 1; min-width: 0; }
    .identity-info h2 { margin: 0 0 8px 0; color: white; font-size: 1.35rem; font-weight: 700; }
    .identity-meta { display: flex; flex-wrap: wrap; gap: 8px; }
    .meta-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 20px;
      background: rgba(255,255,255,0.15);
      font-size: 0.78rem; font-weight: 500;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .matricule-chip { background: rgba(96,165,250,0.3); }
    .readonly-tag {
      padding: 6px 14px; background: rgba(245,158,11,0.25);
      border: 1px solid rgba(252,211,77,0.5);
      border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      color: #fef3c7; white-space: nowrap;
    }

    /* ── Notice lecture seule ── */
    .readonly-notice {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; margin-bottom: 16px;
      background: #fffbeb; border: 1px solid #fde68a;
      border-radius: 10px; color: #78350f; font-size: 0.85rem;
    }
    .notice-icon { font-size: 1rem; flex-shrink: 0; }

    .salary-val { color: #166534; font-weight: 700; }

    /* ── Compétences ── */
    .card-skills { grid-column: span 1; }
    .skills-list { display: flex; flex-direction: column; gap: 10px; }
    .skill-item {
      padding: 10px 12px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
    .skill-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 6px; gap: 8px;
    }
    .skill-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .skill-cat {
      font-size: 0.7rem; padding: 2px 8px; border-radius: 12px;
      background: #ede9fe; color: #6d28d9; font-weight: 500;
    }
    .skill-stars { display: flex; align-items: center; gap: 2px; }
    .star { color: #e2e8f0; font-size: 1rem; }
    .star.filled { color: #f59e0b; }
    .level-num {
      margin-left: 8px; font-size: 0.78rem; color: #64748b; font-weight: 600;
    }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  profile: any = null;
  documents: any[] = [];
  skills: any[] = [];

  constructor(
    public keycloakService: KeycloakService,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    this.employeeApi.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        if (data?.matricule) {
          this.loadSkills(data.matricule);
        }
      },
      error: () => {
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

  loadSkills(matricule: string): void {
    this.employeeApi.getEmployeeSkills(matricule).subscribe({
      next: (data) => this.skills = data || [],
      error: () => this.skills = []
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

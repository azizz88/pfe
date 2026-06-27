import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KeycloakService } from '../../../services/keycloak.service';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Dashboard personnel de l'employé.
 * La carte "Mon Profil" ouvre une modale en lecture seule avec toutes les données.
 */
@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Bonjour, {{ firstNameOnly() }}</h1>
          <p class="page-header__sub">Voici un aperçu de votre espace personnel.</p>
        </div>
      </div>

      <!-- Accès rapide -->
      <div class="quick-nav">
        <a class="nav-tile" routerLink="/employee/profile">
          <span class="nav-tile__icon"><app-icon name="profile" [size]="20" /></span>
          <span class="nav-tile__body">
            <span class="nav-tile__title">Mon profil</span>
            <span class="nav-tile__desc">Consulter mes informations</span>
          </span>
          <app-icon name="arrow-right" [size]="18" class="nav-tile__arrow" />
        </a>
        <a class="nav-tile" routerLink="/employee/directory">
          <span class="nav-tile__icon"><app-icon name="directory" [size]="20" /></span>
          <span class="nav-tile__body">
            <span class="nav-tile__title">Annuaire</span>
            <span class="nav-tile__desc">Rechercher mes collègues</span>
          </span>
          <app-icon name="arrow-right" [size]="18" class="nav-tile__arrow" />
        </a>
        <a class="nav-tile" routerLink="/employee/applications">
          <span class="nav-tile__icon"><app-icon name="job" [size]="20" /></span>
          <span class="nav-tile__body">
            <span class="nav-tile__title">Offres d'emploi</span>
            <span class="nav-tile__desc">Postuler en interne</span>
          </span>
          <app-icon name="arrow-right" [size]="18" class="nav-tile__arrow" />
        </a>
      </div>

      <!-- Bandeau identité -->
      <div class="identity card" *ngIf="profile">
        <span class="avatar avatar--lg avatar--round">{{ (profile.firstName || '?')[0]?.toUpperCase() }}{{ (profile.lastName || '')[0]?.toUpperCase() }}</span>
        <div class="identity__info">
          <h2>{{ profile.firstName }} {{ profile.lastName }}</h2>
          <div class="identity__meta">
            <span class="chip" *ngIf="profile.position"><app-icon name="job" [size]="14" /> {{ profile.position }}</span>
            <span class="chip" *ngIf="profile.department?.name"><app-icon name="department" [size]="14" /> {{ profile.department.name }}</span>
            <span class="chip" *ngIf="profile.matricule"><app-icon name="hash" [size]="14" /> {{ profile.matricule }}</span>
          </div>
        </div>
        <span class="badge badge--neutral identity__tag"><app-icon name="lock" [size]="13" /> Lecture seule</span>
      </div>

      <div class="section-title">Mes informations</div>

      <div class="alert alert--info" style="margin-bottom: var(--sp-4)">
        <app-icon name="info" [size]="18" class="alert__icon" />
        <span>Ces informations sont en <strong>lecture seule</strong>. Pour toute correction, contactez votre administrateur RH.</span>
      </div>

      <div class="cards" *ngIf="profile; else loading">

        <!-- Informations personnelles -->
        <div class="card">
          <div class="card__header"><span class="card__title"><app-icon name="profile" [size]="17" /> Informations personnelles</span></div>
          <div class="card__body">
            <dl class="dl">
              <dt>Matricule</dt><dd>{{ profile.matricule || '—' }}</dd>
              <dt>Prénom</dt><dd>{{ profile.firstName || '—' }}</dd>
              <dt>Nom</dt><dd>{{ profile.lastName || '—' }}</dd>
              <dt>Email</dt><dd>{{ profile.email || '—' }}</dd>
              <dt>Téléphone</dt><dd>{{ profile.phone || '—' }}</dd>
              <dt>Poste</dt><dd>{{ profile.position || '—' }}</dd>
              <dt>Identifiant</dt><dd>{{ profile.keycloakUsername || '—' }}</dd>
              <dt>Date d'embauche</dt><dd>{{ profile.hireDate || '—' }}</dd>
            </dl>
          </div>
        </div>

        <!-- Département -->
        <div class="card" *ngIf="profile?.department">
          <div class="card__header"><span class="card__title"><app-icon name="department" [size]="17" /> Mon département</span></div>
          <div class="card__body">
            <dl class="dl">
              <dt>Nom</dt><dd>{{ profile.department.name }}</dd>
              <dt>Description</dt><dd>{{ profile.department.description || '—' }}</dd>
              <ng-container *ngIf="profile.department.manager">
                <dt>Manager</dt><dd>{{ profile.department.manager.firstName }} {{ profile.department.manager.lastName }}</dd>
              </ng-container>
            </dl>
          </div>
        </div>

        <!-- Service -->
        <div class="card" *ngIf="profile?.service">
          <div class="card__header"><span class="card__title"><app-icon name="layers" [size]="17" /> Mon service</span></div>
          <div class="card__body">
            <dl class="dl">
              <dt>Nom</dt><dd>{{ profile.service.name }}</dd>
              <dt>Description</dt><dd>{{ profile.service.description || '—' }}</dd>
            </dl>
          </div>
        </div>

        <!-- Contrat -->
        <div class="card" *ngIf="profile?.contract">
          <div class="card__header"><span class="card__title"><app-icon name="contract" [size]="17" /> Mon contrat</span></div>
          <div class="card__body">
            <dl class="dl">
              <dt>Type</dt><dd><span class="badge" [ngClass]="'ct-' + profile.contract.type">{{ profile.contract.type }}</span></dd>
              <dt>Début</dt><dd>{{ profile.contract.startDate || '—' }}</dd>
              <dt>Fin</dt><dd>{{ profile.contract.endDate || 'Indéterminé' }}</dd>
              <dt>Salaire</dt><dd class="salary-val">{{ profile.contract.salary | number:'1.2-2' }} DT</dd>
            </dl>
          </div>
        </div>

        <!-- Compétences -->
        <div class="card">
          <div class="card__header"><span class="card__title"><app-icon name="skills" [size]="17" /> Mes compétences</span></div>
          <div class="card__body">
            <div class="skills-list" *ngIf="skills.length > 0">
              <div class="skill-item" *ngFor="let s of skills">
                <div class="skill-head">
                  <span class="skill-name">{{ s.skillName || s.skill?.name }}</span>
                  <span class="badge badge--neutral" *ngIf="s.category || s.skill?.category">{{ s.category || s.skill?.category }}</span>
                </div>
                <div class="skill-stars">
                  <app-icon name="star" [size]="15" *ngFor="let _ of [1,2,3,4,5]; let i = index"
                            class="star" [class.filled]="i < (s.level || 0)" />
                  <span class="level-num">{{ s.level || 0 }}/5</span>
                </div>
              </div>
            </div>
            <div *ngIf="skills.length === 0" class="empty-state">
              <span class="empty-state__icon"><app-icon name="skills" [size]="24" /></span>
              <span class="empty-state__text">Aucune compétence enregistrée.</span>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div class="card">
          <div class="card__header"><span class="card__title"><app-icon name="document" [size]="17" /> Mes documents</span></div>
          <div class="card__body">
            <div class="doc-list" *ngIf="documents.length > 0">
              <div class="doc-row" *ngFor="let doc of documents">
                <span class="doc-row__ic"><app-icon name="document" [size]="18" /></span>
                <div class="doc-row__info">
                  <strong>{{ doc.fileName }}</strong>
                  <span class="doc-date">{{ doc.uploadDate }}</span>
                </div>
                <button class="btn btn--secondary btn--sm" (click)="downloadDocument(doc)">
                  <app-icon name="download" [size]="15" /> Télécharger
                </button>
              </div>
            </div>
            <div *ngIf="documents.length === 0" class="empty-state">
              <span class="empty-state__icon"><app-icon name="document" [size]="24" /></span>
              <span class="empty-state__text">Aucun document disponible.</span>
            </div>
          </div>
        </div>
      </div>
      <ng-template #loading>
        <div class="loading-row"><span class="spinner"></span> Chargement de vos informations…</div>
      </ng-template>
    </div>
  `,
  styles: [`
    /* Accès rapide */
    .quick-nav {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--sp-4);
      margin-bottom: var(--sp-6);
    }
    .nav-tile {
      display: flex; align-items: center; gap: var(--sp-3);
      padding: var(--sp-4) var(--sp-5);
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: var(--r-lg);
      box-shadow: var(--sh-sm);
      text-decoration: none; color: inherit;
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    }
    .nav-tile:hover { border-color: var(--c-accent); box-shadow: var(--sh-md); transform: translateY(-1px); }
    .nav-tile__icon {
      width: 42px; height: 42px; flex: none; border-radius: var(--r-md);
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--c-accent-soft); color: var(--c-accent-ink);
    }
    .nav-tile__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .nav-tile__title { font-weight: 650; color: var(--c-ink); font-size: var(--fs-15); }
    .nav-tile__desc { color: var(--c-muted); font-size: var(--fs-13); }
    .nav-tile__arrow { color: var(--c-faint); transition: transform var(--transition), color var(--transition); }
    .nav-tile:hover .nav-tile__arrow { transform: translateX(3px); color: var(--c-accent); }

    /* Bandeau identité */
    .identity {
      display: flex; align-items: center; gap: var(--sp-4);
      padding: var(--sp-5); margin-bottom: var(--sp-6);
    }
    .identity .avatar { background: var(--c-accent); color: #fff; }
    .identity__info { flex: 1; min-width: 0; }
    .identity__info h2 { margin: 0 0 8px; font-size: var(--fs-20); }
    .identity__meta { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
    .identity__tag { white-space: nowrap; align-self: flex-start; }

    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: var(--sp-5); }
    .salary-val { color: var(--c-success-ink); font-weight: 700; }

    /* Badges de contrat */
    .ct-CDI { background: var(--c-success-soft); color: var(--c-success-ink); }
    .ct-CDD { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .ct-STAGE { background: var(--c-info-soft); color: var(--c-info-ink); }

    /* Compétences */
    .skills-list { display: flex; flex-direction: column; gap: var(--sp-2); }
    .skill-item { padding: 10px 12px; background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--r-md); }
    .skill-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: var(--sp-2); }
    .skill-name { font-weight: 600; color: var(--c-ink); font-size: var(--fs-14); }
    .skill-stars { display: flex; align-items: center; gap: 2px; }
    .star { color: var(--c-border-strong); }
    .star.filled { color: var(--c-warning); }
    .level-num { margin-left: var(--sp-2); font-size: var(--fs-13); color: var(--c-muted); font-weight: 600; }

    /* Documents */
    .doc-list { display: flex; flex-direction: column; }
    .doc-row { display: flex; align-items: center; gap: var(--sp-3); padding: 11px 0; border-bottom: 1px solid var(--c-border); }
    .doc-row:last-child { border-bottom: none; }
    .doc-row__ic { color: var(--c-muted); flex: none; }
    .doc-row__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .doc-row__info strong { color: var(--c-ink); font-size: var(--fs-14); }
    .doc-date { color: var(--c-faint); font-size: var(--fs-12); }

    @media (max-width: 640px) {
      .identity { flex-wrap: wrap; }
      .cards { grid-template-columns: 1fr; }
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

  /** Prénom seul pour l'accueil (fallback sur le nom complet). */
  firstNameOnly(): string {
    const full = this.keycloakService.getFullName() || '';
    return full.trim().split(/\s+/)[0] || full;
  }

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

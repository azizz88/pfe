import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { KeycloakService } from '../../../services/keycloak.service';

/**
 * Composant "Mes Candidatures".
 * Permet à l'employé de voir les offres actives et son historique de candidatures.
 */
@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="applications">
      <h1>📝 Mes Candidatures</h1>

      <!-- Onglets -->
      <div class="tabs">
        <button [class.active]="activeTab === 'offers'" (click)="activeTab = 'offers'">
          🎯 Offres Actives
        </button>
        <button [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">
          📋 Mon Historique
        </button>
      </div>

      <!-- Offres actives -->
      <div *ngIf="activeTab === 'offers'">
        <div class="offer-card" *ngFor="let offer of activeOffers">
          <div class="offer-header">
            <h3>{{ offer.title }}</h3>
            <span class="badge active">ACTIVE</span>
          </div>
          <p class="offer-dept">🏗️ {{ offer.department }}</p>
          <p class="offer-desc">{{ offer.description }}</p>
          <p class="offer-skills" *ngIf="offer.requiredSkills">
            <strong>Compétences :</strong> {{ offer.requiredSkills }}
          </p>
          <p class="offer-deadline" *ngIf="offer.deadline">📅 Date limite : {{ offer.deadline }}</p>
          <button class="apply-btn" *ngIf="!isAdmin && !hasApplied(offer.id)" (click)="applyToOffer(offer)">Postuler</button>
          <button class="applied-btn" *ngIf="!isAdmin && hasApplied(offer.id)" disabled>✅ Déjà postulé</button>
        </div>
        <p *ngIf="activeOffers.length === 0" class="empty">Aucune offre active pour le moment.</p>
      </div>

      <!-- Historique des candidatures -->
      <div *ngIf="activeTab === 'history'">
        <div class="application-card" *ngFor="let app of myApplications">
          <div class="app-header">
            <h3>{{ app.jobOfferTitle }}</h3>
            <span class="badge" [class]="app.status">{{ app.status }}</span>
          </div>
          <p class="app-date">📅 Soumis le {{ app.applicationDate }}</p>
          <p class="app-cover" *ngIf="app.coverLetter">{{ app.coverLetter }}</p>
        </div>
        <p *ngIf="myApplications.length === 0" class="empty">Vous n'avez pas encore postulé.</p>
      </div>

      <!-- Modal de candidature -->
      <div class="modal-overlay" *ngIf="showApplyModal" (click)="showApplyModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Postuler à : {{ selectedOffer?.title }}</h3>
          <textarea [(ngModel)]="coverLetter" placeholder="Lettre de motivation..." rows="6"></textarea>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showApplyModal = false">Annuler</button>
            <button class="submit-btn" (click)="submitApplication()">Envoyer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .applications h1 { color: #1e3a5f; margin: 0 0 20px 0; }
    .tabs { display: flex; gap: 8px; margin-bottom: 24px; }
    .tabs button {
      padding: 10px 20px; border: 2px solid #e2e8f0; background: white;
      border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
    }
    .tabs button.active { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
    .offer-card, .application-card {
      background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .offer-header, .app-header { display: flex; justify-content: space-between; align-items: center; }
    .offer-header h3, .app-header h3 { margin: 0; color: #1e293b; }
    .offer-desc { color: #475569; font-size: 0.9rem; line-height: 1.5; }
    .offer-dept, .offer-skills, .offer-deadline, .app-date { font-size: 0.85rem; color: #64748b; }
    .badge {
      padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600;
      text-transform: uppercase;
    }
    .badge.active, .badge.ACTIVE { background: #dcfce7; color: #166534; }
    .badge.EN_ATTENTE { background: #fef9c3; color: #854d0e; }
    .badge.ENTRETIEN { background: #dbeafe; color: #1e40af; }
    .badge.RETENU { background: #dcfce7; color: #166534; }
    .badge.REFUSE { background: #fee2e2; color: #991b1b; }
    .apply-btn {
      margin-top: 12px; padding: 8px 20px; background: #3b82f6; color: white;
      border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;
      transition: background 0.2s;
    }
    .apply-btn:hover { background: #2563eb; }
    .applied-btn {
      margin-top: 12px; padding: 8px 20px; background: #e2e8f0; color: #64748b;
      border: none; border-radius: 8px; cursor: not-allowed; font-size: 0.9rem;
    }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex;
      align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: white; border-radius: 16px; padding: 24px; width: 90%; max-width: 500px;
    }
    .modal h3 { margin: 0 0 16px 0; color: #1e293b; }
    .modal textarea {
      width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; resize: vertical; outline: none; box-sizing: border-box;
    }
    .modal textarea:focus { border-color: #3b82f6; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .cancel-btn { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
    .submit-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .empty { text-align: center; color: #94a3b8; font-style: italic; margin-top: 40px; }
    .admin-notice {
      margin-top: 12px; padding: 8px 16px; background: #fef3c7; color: #92400e;
      border-radius: 8px; font-size: 0.85rem; border: 1px solid #fde68a;
    }
  `]
})
export class MyApplicationsComponent implements OnInit {
  activeTab = 'offers';
  activeOffers: any[] = [];
  myApplications: any[] = [];
  showApplyModal = false;
  selectedOffer: any = null;
  coverLetter = '';
  isAdmin = false;
  appliedOfferIds = new Set<number>();

  constructor(
    private recruitmentApi: RecruitmentApiService,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.keycloakService.isHrAdmin();
    this.loadActiveOffers();
    this.loadMyApplications();
  }

  loadActiveOffers(): void {
    this.recruitmentApi.getActiveOffers().subscribe({
      next: (data) => this.activeOffers = data,
      error: (err) => console.error('Erreur chargement offres:', err)
    });
  }

  loadMyApplications(): void {
    const username = this.keycloakService.getUserName();
    this.recruitmentApi.getMyApplications(username).subscribe({
      next: (data) => {
        this.myApplications = data;
        this.appliedOfferIds = new Set(data.map((app: any) => app.jobOfferId));
      },
      error: (err) => console.error('Erreur chargement candidatures:', err)
    });
  }

  hasApplied(offerId: number): boolean {
    return this.appliedOfferIds.has(offerId);
  }

  applyToOffer(offer: any): void {
    this.selectedOffer = offer;
    this.coverLetter = '';
    this.showApplyModal = true;
  }

  submitApplication(): void {
    const application = {
      jobOfferId: this.selectedOffer.id,
      employeeMatricule: this.keycloakService.getUserName(),
      applicantName: this.keycloakService.getFullName(),
      coverLetter: this.coverLetter
    };

    this.recruitmentApi.submitApplication(application).subscribe({
      next: () => {
        this.showApplyModal = false;
        this.appliedOfferIds.add(this.selectedOffer.id);
        this.loadMyApplications();
        this.activeTab = 'history';
      },
      error: (err) => console.error('Erreur soumission:', err)
    });
  }
}

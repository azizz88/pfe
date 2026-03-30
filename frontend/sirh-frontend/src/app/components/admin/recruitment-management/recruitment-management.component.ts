import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';

/**
 * Gestion du recrutement pour le RH Admin.
 * Permet de créer des offres, gérer les candidatures et le workflow.
 */
@Component({
  selector: 'app-recruitment-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <div class="header">
        <h1>🎯 Gestion du Recrutement</h1>
        <button class="add-btn" (click)="showOfferForm = true; resetOfferForm()">+ Nouvelle Offre</button>
      </div>

      <!-- Onglets -->
      <div class="tabs">
        <button [class.active]="activeTab === 'offers'" (click)="activeTab = 'offers'">📋 Offres</button>
        <button [class.active]="activeTab === 'applications'" (click)="activeTab = 'applications'; loadAllApplications()">
          📝 Candidatures
        </button>
      </div>

      <!-- Offres d'emploi -->
      <div *ngIf="activeTab === 'offers'">
        <div class="offer-card" *ngFor="let offer of offers">
          <div class="offer-header">
            <div>
              <h3>{{ offer.title }}</h3>
              <p class="offer-dept">🏗️ {{ offer.department }} | 📅 Publié le {{ offer.publishDate }}</p>
            </div>
            <span class="badge" [class]="offer.status">{{ offer.status }}</span>
          </div>
          <p class="offer-desc">{{ offer.description }}</p>
          <div class="offer-actions">
            <button class="edit-btn" (click)="editOffer(offer)">✏️ Modifier</button>
            <button *ngIf="offer.status === 'ACTIVE'" class="close-btn" (click)="closeOffer(offer.id)">🔒 Clôturer</button>
            <button class="view-btn" (click)="viewApplications(offer)">👁️ Candidatures</button>
            <button class="delete-btn" (click)="deleteOffer(offer.id)">🗑️</button>
          </div>
        </div>
      </div>

      <!-- Candidatures -->
      <div *ngIf="activeTab === 'applications'">
        <div class="application-card" *ngFor="let app of applications">
          <div class="app-header">
            <div>
              <h3>{{ app.applicantName }}</h3>
              <p class="app-info">📋 {{ app.jobOfferTitle }} | 📅 {{ app.applicationDate }}</p>
            </div>
            <span class="badge" [class]="app.status">{{ app.status }}</span>
          </div>
          <p *ngIf="app.coverLetter" class="cover-letter">{{ app.coverLetter }}</p>
          <div class="status-actions">
            <span>Changer statut :</span>
            <button *ngFor="let s of statuses" [class]="s" class="status-btn"
                    [disabled]="app.status === s" (click)="changeStatus(app.id, s)">
              {{ s }}
            </button>
          </div>
        </div>
        <p *ngIf="applications.length === 0" class="empty">Aucune candidature.</p>
      </div>

      <!-- Modal Offre -->
      <div class="modal-overlay" *ngIf="showOfferForm" (click)="showOfferForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ isEditingOffer ? 'Modifier' : 'Créer' }} une offre</h3>
          <input [(ngModel)]="offerForm.title" placeholder="Titre du poste" />
          <input [(ngModel)]="offerForm.department" placeholder="Département" />
          <textarea [(ngModel)]="offerForm.description" placeholder="Description du poste" rows="4"></textarea>
          <textarea [(ngModel)]="offerForm.requiredSkills" placeholder="Compétences requises" rows="2"></textarea>
          <label>Date limite :</label>
          <input [(ngModel)]="offerForm.deadline" type="date" />
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showOfferForm = false">Annuler</button>
            <button class="submit-btn" (click)="saveOffer()">
              {{ isEditingOffer ? 'Modifier' : 'Publier' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header h1 { color: #1e3a5f; margin: 0; }
    .add-btn { padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .tabs button {
      padding: 10px 20px; border: 2px solid #e2e8f0; background: white;
      border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
    }
    .tabs button.active { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
    .offer-card, .application-card {
      background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .offer-header, .app-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .offer-header h3, .app-header h3 { margin: 0; color: #1e293b; }
    .offer-dept, .app-info { font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0; }
    .offer-desc { color: #475569; font-size: 0.9rem; }
    .cover-letter { color: #475569; font-size: 0.85rem; font-style: italic; background: #f8fafc; padding: 12px; border-radius: 8px; }
    .offer-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .offer-actions button { padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; border: 1px solid #e2e8f0; background: white; }
    .edit-btn { color: #3b82f6; border-color: #3b82f6 !important; }
    .close-btn { color: #f97316; border-color: #f97316 !important; }
    .view-btn { color: #6366f1; border-color: #6366f1 !important; }
    .delete-btn { color: #ef4444; border-color: #ef4444 !important; }
    .status-actions { display: flex; align-items: center; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .status-actions span { font-size: 0.85rem; color: #64748b; }
    .status-btn {
      padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 600;
      cursor: pointer; border: none; transition: opacity 0.2s;
    }
    .status-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .status-btn.EN_ATTENTE { background: #fef9c3; color: #854d0e; }
    .status-btn.ENTRETIEN { background: #dbeafe; color: #1e40af; }
    .status-btn.RETENU { background: #dcfce7; color: #166534; }
    .status-btn.REFUSE { background: #fee2e2; color: #991b1b; }
    .badge { padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .ACTIVE { background: #dcfce7; color: #166534; }
    .CLOSED { background: #f1f5f9; color: #64748b; }
    .EN_ATTENTE { background: #fef9c3; color: #854d0e; }
    .ENTRETIEN { background: #dbeafe; color: #1e40af; }
    .RETENU { background: #dcfce7; color: #166534; }
    .REFUSE { background: #fee2e2; color: #991b1b; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; padding: 24px; width: 90%; max-width: 550px; }
    .modal h3 { margin: 0 0 16px 0; color: #1e293b; }
    .modal input, .modal textarea {
      width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; outline: none; margin-bottom: 12px; box-sizing: border-box;
    }
    .modal label { font-size: 0.85rem; color: #64748b; display: block; margin-bottom: 4px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    .cancel-btn { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
    .submit-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .empty { text-align: center; color: #94a3b8; font-style: italic; margin-top: 40px; }
  `]
})
export class RecruitmentManagementComponent implements OnInit {
  activeTab = 'offers';
  offers: any[] = [];
  applications: any[] = [];
  statuses = ['EN_ATTENTE', 'ENTRETIEN', 'RETENU', 'REFUSE'];

  showOfferForm = false;
  isEditingOffer = false;
  editOfferId: number | null = null;
  offerForm: any = {};

  constructor(private recruitmentApi: RecruitmentApiService) {}

  ngOnInit(): void { this.loadOffers(); }

  loadOffers(): void {
    this.recruitmentApi.getAllOffers().subscribe({ next: (data) => this.offers = data });
  }

  loadAllApplications(): void {
    this.recruitmentApi.getAllApplications().subscribe({ next: (data) => this.applications = data });
  }

  resetOfferForm(): void { this.offerForm = {}; this.isEditingOffer = false; this.editOfferId = null; }

  editOffer(offer: any): void {
    this.offerForm = { ...offer }; this.isEditingOffer = true; this.editOfferId = offer.id; this.showOfferForm = true;
  }

  saveOffer(): void {
    const obs = this.isEditingOffer
      ? this.recruitmentApi.updateOffer(this.editOfferId!, this.offerForm)
      : this.recruitmentApi.createOffer(this.offerForm);
    obs.subscribe({ next: () => { this.showOfferForm = false; this.loadOffers(); } });
  }

  closeOffer(id: number): void {
    this.recruitmentApi.closeOffer(id).subscribe({ next: () => this.loadOffers() });
  }

  deleteOffer(id: number): void {
    if (confirm('Supprimer cette offre ?')) {
      this.recruitmentApi.deleteOffer(id).subscribe({ next: () => this.loadOffers() });
    }
  }

  viewApplications(offer: any): void {
    this.activeTab = 'applications';
    this.recruitmentApi.getApplicationsByJobOffer(offer.id).subscribe({
      next: (data) => this.applications = data
    });
  }

  changeStatus(id: number, status: string): void {
    this.recruitmentApi.updateApplicationStatus(id, status).subscribe({
      next: () => this.loadAllApplications()
    });
  }
}

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
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">💼</div>
          <div>
            <h1>Offres d'emploi</h1>
            <p class="header-subtitle">Découvrez les opportunités disponibles au sein de l'entreprise</p>
          </div>
        </div>
        <div class="offers-count" *ngIf="activeOffers.length > 0">
          <span class="count-number">{{ activeOffers.length }}</span>
          <span class="count-label">offre(s) active(s)</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button [class.active]="activeTab === 'offers'" (click)="activeTab = 'offers'">
          <span class="tab-icon">🎯</span> Offres Actives
          <span class="tab-badge" *ngIf="activeOffers.length > 0">{{ activeOffers.length }}</span>
        </button>
        <button *ngIf="!isAdmin" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">
          <span class="tab-icon">📋</span> Mon Historique
          <span class="tab-badge history-badge" *ngIf="myApplications.length > 0">{{ myApplications.length }}</span>
        </button>
      </div>

      <!-- Active offers -->
      <div class="offers-grid" *ngIf="activeTab === 'offers'">
        <div class="offer-card" *ngFor="let offer of activeOffers; let i = index"
             [style.animation-delay]="i * 60 + 'ms'">
          <div class="offer-top">
            <div class="offer-title-row">
              <h3>{{ offer.title }}</h3>
              <span class="status-badge active">ACTIVE</span>
            </div>
            <div class="offer-tags">
              <span class="tag dept-tag" *ngIf="offer.department">
                <span class="tag-icon">🏗️</span> {{ offer.department }}
              </span>
              <span class="tag deadline-tag" *ngIf="offer.deadline">
                <span class="tag-icon">📅</span> {{ offer.deadline }}
              </span>
            </div>
          </div>

          <p class="offer-desc" *ngIf="offer.description">{{ offer.description }}</p>

          <div class="offer-skills-row" *ngIf="offer.requiredSkills">
            <span class="skills-label">Compétences requises</span>
            <p class="skills-text">{{ offer.requiredSkills }}</p>
          </div>

          <div class="offer-actions" *ngIf="!isAdmin">
            <button class="apply-btn" *ngIf="!hasApplied(offer.id)" (click)="applyToOffer(offer)">
              <span>🚀</span> Postuler maintenant
            </button>
            <button class="applied-btn" *ngIf="hasApplied(offer.id)" disabled>
              ✅ Candidature envoyée
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="activeOffers.length === 0">
          <div class="empty-icon">📭</div>
          <p>Aucune offre active pour le moment</p>
          <span>Les nouvelles opportunités seront publiées ici.</span>
        </div>
      </div>

      <!-- Application history (employees only) -->
      <div class="history-list" *ngIf="!isAdmin && activeTab === 'history'">
        <div class="history-card" *ngFor="let app of myApplications; let i = index"
             [style.animation-delay]="i * 60 + 'ms'">
          <div class="history-left">
            <div class="history-status-dot" [ngClass]="getStatusClass(app.status)"></div>
          </div>
          <div class="history-content">
            <div class="history-top">
              <h3>{{ app.jobOfferTitle }}</h3>
              <span class="status-badge" [ngClass]="getStatusClass(app.status)">{{ getStatusLabel(app.status) }}</span>
            </div>
            <div class="history-meta">
              <span>📅 Soumis le {{ app.applicationDate }}</span>
            </div>
            <p class="history-cover" *ngIf="app.coverLetter">{{ app.coverLetter }}</p>
          </div>
        </div>

        <div class="empty-state" *ngIf="myApplications.length === 0">
          <div class="empty-icon">📝</div>
          <p>Vous n'avez pas encore postulé</p>
          <span>Consultez les offres actives pour découvrir les opportunités.</span>
        </div>
      </div>

      <!-- Apply modal -->
      <div class="modal-overlay" *ngIf="showApplyModal" (click)="showApplyModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon">🚀</div>
            <h3>Postuler à cette offre</h3>
            <p class="modal-offer-title">{{ selectedOffer?.title }}</p>
          </div>
          <div class="modal-body">
            <label>Lettre de motivation</label>
            <textarea [(ngModel)]="coverLetter" placeholder="Décrivez votre motivation pour ce poste..." rows="6"></textarea>
          </div>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showApplyModal = false">Annuler</button>
            <button class="submit-btn" (click)="submitApplication()">
              <span>📨</span> Envoyer ma candidature
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .applications {
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    /* Header */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
    }
    .header-content { display: flex; align-items: center; gap: 16px; }
    .header-icon { font-size: 2.4rem; }
    .page-header h1 {
      margin: 0; font-size: 1.7rem; font-weight: 800;
      background: linear-gradient(135deg, #1e3a5f, #3b82f6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .header-subtitle { margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem; }

    .offers-count {
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 1px solid #bfdbfe; border-radius: 12px; padding: 10px 18px;
    }
    .offers-count .count-number { font-size: 1.5rem; font-weight: 800; color: #1d4ed8; }
    .offers-count .count-label { font-size: 0.8rem; color: #3b82f6; }

    /* Tabs */
    .tabs { display: flex; gap: 8px; margin-bottom: 24px; }
    .tabs button {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 22px; border: 2px solid #e2e8f0; background: white;
      border-radius: 10px; cursor: pointer; font-size: 0.88rem; font-weight: 600;
      color: #64748b; transition: all 0.25s ease; position: relative;
    }
    .tabs button:hover { border-color: #93c5fd; color: #3b82f6; background: #f8fafc; }
    .tabs button.active {
      border-color: #3b82f6; background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #1d4ed8; box-shadow: 0 2px 8px rgba(59,130,246,0.15);
    }
    .tab-icon { font-size: 1rem; }
    .tab-badge {
      background: #3b82f6; color: white; font-size: 0.7rem; font-weight: 700;
      padding: 2px 8px; border-radius: 10px; min-width: 20px; text-align: center;
    }
    .history-badge { background: #6366f1; }

    /* Offers grid */
    .offers-grid {
      display: flex; flex-direction: column; gap: 16px;
    }
    .offer-card {
      background: white; border-radius: 16px; border: 1px solid #e2e8f0;
      padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: all 0.3s ease; animation: cardIn 0.4s ease both;
    }
    .offer-card:hover { border-color: #93c5fd; box-shadow: 0 8px 24px rgba(59,130,246,0.1); transform: translateY(-2px); }

    .offer-top { margin-bottom: 14px; }
    .offer-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
    .offer-title-row h3 { margin: 0; color: #1e293b; font-size: 1.15rem; font-weight: 700; }

    .status-badge {
      padding: 4px 14px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; flex-shrink: 0;
    }
    .status-badge.active { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #166534; }
    .status-badge.pending { background: linear-gradient(135deg, #fef9c3, #fde68a); color: #854d0e; }
    .status-badge.interview { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1e40af; }
    .status-badge.accepted { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #166534; }
    .status-badge.rejected { background: linear-gradient(135deg, #fee2e2, #fecaca); color: #991b1b; }

    .offer-tags { display: flex; gap: 10px; flex-wrap: wrap; }
    .tag {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.8rem; padding: 4px 12px; border-radius: 8px; font-weight: 500;
    }
    .tag-icon { font-size: 0.85rem; }
    .dept-tag { background: #f0fdf4; color: #166534; }
    .deadline-tag { background: #fef3c7; color: #92400e; }

    .offer-desc {
      color: #475569; font-size: 0.9rem; line-height: 1.6; margin: 0 0 14px 0;
      padding: 12px 16px; background: #f8fafc; border-radius: 10px;
      border-left: 3px solid #3b82f6;
    }

    .offer-skills-row { margin-bottom: 16px; }
    .skills-label {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 6px; display: block;
    }
    .skills-text { margin: 0; color: #334155; font-size: 0.88rem; line-height: 1.5; }

    .offer-actions { display: flex; gap: 10px; }
    .apply-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 24px; background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white; border: none; border-radius: 10px; cursor: pointer;
      font-size: 0.9rem; font-weight: 600; transition: all 0.25s ease;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .apply-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.35); }
    .applied-btn {
      padding: 10px 24px; background: #f1f5f9; color: #64748b;
      border: 1px solid #e2e8f0; border-radius: 10px; cursor: not-allowed;
      font-size: 0.9rem; font-weight: 600;
    }

    /* History */
    .history-list { display: flex; flex-direction: column; gap: 12px; }
    .history-card {
      display: flex; gap: 16px; background: white; border-radius: 14px;
      border: 1px solid #e2e8f0; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: all 0.3s ease; animation: cardIn 0.4s ease both;
    }
    .history-card:hover { border-color: #c7d2fe; box-shadow: 0 6px 16px rgba(99,102,241,0.1); }

    .history-left { display: flex; align-items: flex-start; padding-top: 4px; }
    .history-status-dot {
      width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
    }
    .history-status-dot.pending { background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.4); }
    .history-status-dot.interview { background: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,0.4); }
    .history-status-dot.accepted { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.4); }
    .history-status-dot.rejected { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.4); }

    .history-content { flex: 1; }
    .history-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; }
    .history-top h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #1e293b; }
    .history-meta { font-size: 0.82rem; color: #64748b; margin-bottom: 8px; }
    .history-cover {
      margin: 0; padding: 10px 14px; background: #f8fafc; border-radius: 8px;
      font-size: 0.85rem; color: #475569; line-height: 1.5;
      border-left: 3px solid #6366f1;
    }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.6);
      backdrop-filter: blur(4px); display: flex;
      align-items: center; justify-content: center; z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    .modal {
      background: white; border-radius: 20px; width: 90%; max-width: 520px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.2); overflow: hidden;
      animation: modalIn 0.3s ease;
    }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

    .modal-header {
      text-align: center; padding: 28px 24px 16px;
      background: linear-gradient(135deg, #eff6ff, #f8fafc);
    }
    .modal-icon { font-size: 2rem; margin-bottom: 8px; }
    .modal-header h3 { margin: 0 0 4px 0; color: #1e293b; font-size: 1.2rem; font-weight: 700; }
    .modal-offer-title { margin: 0; color: #3b82f6; font-weight: 600; font-size: 0.95rem; }

    .modal-body { padding: 20px 24px; }
    .modal-body label {
      display: block; font-size: 0.8rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
    }
    .modal-body textarea {
      width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px;
      font-size: 0.9rem; resize: vertical; outline: none; box-sizing: border-box;
      font-family: inherit; transition: border-color 0.2s;
    }
    .modal-body textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

    .modal-actions {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px 24px; border-top: 1px solid #f1f5f9;
    }
    .cancel-btn {
      padding: 10px 20px; border: 1px solid #e2e8f0; background: white;
      border-radius: 10px; cursor: pointer; font-size: 0.88rem; font-weight: 600;
      color: #64748b; transition: all 0.2s;
    }
    .cancel-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
    .submit-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 22px; background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white; border: none; border-radius: 10px; cursor: pointer;
      font-size: 0.88rem; font-weight: 600; transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .submit-btn:hover { box-shadow: 0 6px 16px rgba(37,99,235,0.35); }

    /* Empty state */
    .empty-state {
      text-align: center; padding: 48px 20px; color: #94a3b8;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-state p { font-size: 1.05rem; color: #64748b; margin: 0 0 4px 0; font-weight: 600; }
    .empty-state span { font-size: 0.85rem; }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: flex-start; }
      .offer-title-row { flex-direction: column; }
      .history-top { flex-direction: column; align-items: flex-start; }
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
    if (!this.isAdmin) {
      this.loadMyApplications();
    }
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'pending';
      case 'ENTRETIEN': return 'interview';
      case 'RETENU': return 'accepted';
      case 'REFUSE': return 'rejected';
      default: return 'pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'ENTRETIEN': return 'Entretien';
      case 'RETENU': return 'Retenu';
      case 'REFUSE': return 'Refusé';
      default: return status;
    }
  }
}

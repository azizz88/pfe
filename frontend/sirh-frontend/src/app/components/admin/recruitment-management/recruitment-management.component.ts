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
  templateUrl: './recruitment-management.component.html',
  styleUrls: ['./recruitment-management.component.css']
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

  // Skills picker state
  allSkills: { id: number; name: string; category?: string }[] = [];
  selectedSkillIds = new Set<number>();
  skillSearch = '';
  skillsOpen = false;

  // Search & filter
  searchQuery = '';
  statusFilter = '';

  constructor(private recruitmentApi: RecruitmentApiService) {}

  ngOnInit(): void {
    this.loadOffers();
    this.loadSkills();
  }

  loadOffers(): void {
    this.recruitmentApi.getAllOffers().subscribe({ next: (data) => this.offers = data });
  }

  loadSkills(): void {
    this.recruitmentApi.getAllSkills().subscribe({ next: (data) => this.allSkills = data });
  }

  loadAllApplications(): void {
    this.recruitmentApi.getAllApplications().subscribe({ next: (data) => this.applications = data });
  }

  // --- Computed ---
  get activeOffers(): number {
    return this.offers.filter(o => o.status === 'ACTIVE').length;
  }
  get closedOffers(): number {
    return this.offers.filter(o => o.status === 'CLOSED').length;
  }

  get filteredOffers(): any[] {
    let result = this.offers;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(o =>
        o.title?.toLowerCase().includes(q) ||
        o.department?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter) {
      result = result.filter(o => o.status === this.statusFilter);
    }
    return result;
  }

  get filteredApplications(): any[] {
    let result = this.applications;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(a =>
        a.applicantName?.toLowerCase().includes(q) ||
        a.jobOfferTitle?.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter) {
      result = result.filter(a => a.status === this.statusFilter);
    }
    return result;
  }

  // --- Skills picker helpers ---
  get filteredSkillOptions() {
    const q = this.skillSearch.trim().toLowerCase();
    if (!q) return this.allSkills;
    return this.allSkills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  }

  toggleSkill(id: number): void {
    if (this.selectedSkillIds.has(id)) this.selectedSkillIds.delete(id);
    else this.selectedSkillIds.add(id);
  }

  getSkillNameById(id: number): string {
    return this.allSkills.find(s => s.id === id)?.name ?? '(inconnue)';
  }

  resetOfferForm(): void {
    this.offerForm = {};
    this.isEditingOffer = false;
    this.editOfferId = null;
    this.selectedSkillIds.clear();
    this.skillSearch = '';
    this.skillsOpen = false;
  }

  editOffer(offer: any): void {
    this.offerForm = { ...offer };
    this.isEditingOffer = true;
    this.editOfferId = offer.id;
    // Hydrate la selection depuis les objets Skill renvoyes par le backend
    this.selectedSkillIds = new Set<number>((offer.skills || []).map((s: any) => s.id));
    this.skillSearch = '';
    this.skillsOpen = false;
    this.showOfferForm = true;
  }

  saveOffer(): void {
    const payload = {
      title: this.offerForm.title,
      description: this.offerForm.description,
      department: this.offerForm.department,
      deadline: this.offerForm.deadline,
      skillIds: Array.from(this.selectedSkillIds)
    };
    const obs = this.isEditingOffer
      ? this.recruitmentApi.updateOffer(this.editOfferId!, payload)
      : this.recruitmentApi.createOffer(payload);
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
    this.searchQuery = '';
    this.statusFilter = '';
    this.recruitmentApi.getApplicationsByJobOffer(offer.id).subscribe({
      next: (data) => this.applications = data
    });
  }

  changeStatus(id: number, status: string): void {
    this.recruitmentApi.updateApplicationStatus(id, status).subscribe({
      next: () => this.loadAllApplications()
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'ENTRETIEN': 'Entretien',
      'RETENU': 'Retenu',
      'REFUSE': 'Refusé'
    };
    return labels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'EN_ATTENTE': '⏳',
      'ENTRETIEN': '🗣️',
      'RETENU': '✅',
      'REFUSE': '❌'
    };
    return icons[status] || '📋';
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.statusFilter = '';
    if (tab === 'applications') this.loadAllApplications();
  }
}

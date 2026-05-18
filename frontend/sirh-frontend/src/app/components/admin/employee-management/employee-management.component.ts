import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';

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
            Nom d'utilisateur : <span class="sb-username">{{ createdUsername }}</span><br>
            Un email contenant ses identifiants a été envoyé à <strong>{{ createdEmail }}</strong>.
            Il devra changer son mot de passe lors de sa première connexion.
          </div>
        </div>
      </div>

      <!-- Tableau -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nom Complet</th><th>Email</th>
              <th>Poste</th><th>Département</th><th>Service</th>
              <th>Contrat</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of employees">
              <td>{{ emp.firstName }} {{ emp.lastName }}</td>
              <td>{{ emp.email }}</td>
              <td>{{ emp.position || '—' }}</td>
              <td>{{ emp.department?.name || '—' }}</td>
              <td>{{ emp.service?.name || '—' }}</td>
              <td>
                <span *ngIf="emp.contract" class="badge" [class]="emp.contract.type">{{ emp.contract.type }}</span>
              </td>
              <td class="actions">
                <button class="edit-btn" (click)="editEmployee(emp)" title="Modifier">✏️</button>
                <button class="skill-btn" (click)="openSkills(emp)" title="Compétences">🎓</button>
                <button class="doc-btn" (click)="openDocuments(emp)" title="Documents">📎</button>
                <button class="delete-btn" (click)="deleteEmployee(emp.id)" title="Supprimer">🗑️</button>
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
                <span>Un email d'activation sera envoyé à l'employé. Le nom d'utilisateur sera généré automatiquement : <strong>prénom.nom</strong></span>
              </div>
              <div class="grid-2">
                <div class="field">
                  <label>Rôle</label>
                  <select [(ngModel)]="form.keycloakRole">
                    <option value="EMPLOYEE">Employé</option>
                    <option value="HR_ADMIN">Administrateur RH</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Section: Extraction IA depuis CV (création uniquement) -->
            <div class="section" *ngIf="!isEditing">
              <div class="section-title"><span class="st-icon">🤖</span> Extraction IA des compétences</div>
              <div class="cv-zone">
                <div class="cv-upload-row">
                  <label class="cv-file-label">
                    <input #cvInput type="file" accept=".pdf,.docx,.txt"
                           (change)="onCvSelected($event)" class="cv-file-input" />
                    <span class="cv-file-btn">📎 Choisir un CV (PDF / DOCX / TXT)</span>
                    <span class="cv-file-name" *ngIf="cvFile">{{ cvFile.name }}</span>
                  </label>
                  <button type="button" class="cv-extract-btn"
                          [disabled]="!cvFile || cvExtracting"
                          (click)="extractCvSkills()">
                    {{ cvExtracting ? '⏳ Analyse…' : '🤖 Extraire les compétences' }}
                  </button>
                </div>
                <p class="cv-hint" *ngIf="!cvExtractResult && !cvError">
                  L'IA analysera le CV et proposera les compétences avec un niveau estimé.
                  Vous pourrez valider/ajuster avant de créer l'employé.
                </p>
                <div class="cv-error" *ngIf="cvError">⚠️ {{ cvError }}</div>

                <!-- Résultats d'extraction -->
                <div class="cv-result" *ngIf="cvExtractResult">
                  <div class="cv-summary">
                    <span class="cv-summary-item">
                      <strong>{{ cvExtractResult.skills.length }}</strong> compétence(s) détectée(s)
                    </span>
                    <span class="cv-summary-item" *ngIf="cvExtractResult.estimatedYearsOfExperience">
                      ⏱️ {{ cvExtractResult.estimatedYearsOfExperience }} ans d'expérience détectés
                    </span>
                    <span class="cv-selected-count">
                      ✅ {{ selectedExtractedCount() }} sélectionnée(s)
                    </span>
                  </div>

                  <div class="cv-skill-row" *ngFor="let sk of cvExtractResult.skills">
                    <input type="checkbox" [(ngModel)]="sk.preselected"
                           [ngModelOptions]="{standalone: true}"
                           class="cv-check" />
                    <div class="cv-skill-info">
                      <div class="cv-skill-head">
                        <strong>{{ sk.skillName }}</strong>
                        <span class="cv-skill-cat" *ngIf="sk.category">{{ sk.category }}</span>
                        <span class="cv-conf" [class.high]="sk.confidence >= 0.75"
                                              [class.mid]="sk.confidence >= 0.5 && sk.confidence < 0.75"
                                              [class.low]="sk.confidence < 0.5">
                          {{ getConfidenceLabel(sk.confidence) }}
                        </span>
                      </div>
                      <div class="cv-evidence" *ngIf="sk.evidence">
                        <span class="ev-icon">💬</span> {{ sk.evidence }}
                      </div>
                    </div>
                    <div class="level-picker cv-level">
                      <button type="button"
                              *ngFor="let lvl of [1,2,3,4,5]"
                              class="lvl-btn"
                              [class.active]="sk.level === lvl"
                              (click)="sk.level = lvl"
                              [title]="getLevelLabel(lvl)">
                        {{ lvl }}
                      </button>
                    </div>
                    <span class="cv-lvl-label">{{ getLevelLabel(sk.level) }}</span>
                  </div>

                  <p *ngIf="cvExtractResult.skills.length === 0" class="cv-empty">
                    Aucune compétence du catalogue détectée dans ce CV.
                    Vous pouvez ajouter les compétences manuellement après création.
                  </p>
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

      <!-- ═══ Modal Compétences ═══ -->
      <div class="modal-overlay" *ngIf="showSkillModal" (click)="showSkillModal = false">
        <div class="modal-form skill-modal" (click)="$event.stopPropagation()">
          <div class="mf-header skill-header">
            <div class="mf-icon">🎓</div>
            <h3>Compétences</h3>
            <p class="mf-sub">{{ skillEmployee?.firstName }} {{ skillEmployee?.lastName }}</p>
          </div>

          <div class="mf-body">
            <!-- Ajout d'une compétence -->
            <div class="add-skill-zone">
              <div class="ask-title">➕ Ajouter une compétence</div>
              <div class="ask-row">
                <select [(ngModel)]="newSkillId" class="ask-select">
                  <option [ngValue]="null">— Choisir une compétence —</option>
                  <option *ngFor="let s of availableSkillsForAdd()" [ngValue]="s.id">
                    {{ s.name }}{{ s.category ? ' (' + s.category + ')' : '' }}
                  </option>
                </select>
                <div class="ask-levels">
                  <button type="button"
                          *ngFor="let lvl of [1,2,3,4,5]"
                          class="lvl-btn"
                          [class.active]="newSkillLevel === lvl"
                          (click)="newSkillLevel = lvl"
                          [title]="getLevelLabel(lvl)">
                    {{ lvl }}
                  </button>
                </div>
                <button class="ask-add" [disabled]="!newSkillId" (click)="addSkillToEmployee()">
                  ✅ Ajouter
                </button>
              </div>
              <p class="ask-hint">{{ getLevelLabel(newSkillLevel) }} — utilisé par le matching IA</p>
            </div>

            <!-- Liste des compétences actuelles -->
            <div class="current-skills">
              <div class="cs-title">📋 Compétences actuelles ({{ employeeSkills.length }})</div>

              <div class="cs-empty" *ngIf="employeeSkills.length === 0">
                <p>Aucune compétence assignée.</p>
                <p class="cs-empty-sub">L'employé n'apparaîtra pas dans le matching pour les offres nécessitant des compétences.</p>
              </div>

              <div class="cs-row" *ngFor="let sk of employeeSkills">
                <div class="cs-info">
                  <strong>{{ sk.skillName }}</strong>
                  <span class="cs-cat" *ngIf="sk.category">{{ sk.category }}</span>
                </div>
                <div class="level-picker">
                  <button type="button"
                          *ngFor="let lvl of [1,2,3,4,5]"
                          class="lvl-btn"
                          [class.active]="sk.level === lvl"
                          (click)="updateSkillLevel(sk, lvl)">
                    {{ lvl }}
                  </button>
                </div>
                <span class="cs-label">{{ getLevelLabel(sk.level) }}</span>
                <button class="cs-remove" (click)="removeSkill(sk)" title="Retirer">×</button>
              </div>
            </div>
          </div>

          <div class="mf-footer">
            <button class="btn-cancel" (click)="showSkillModal = false">Fermer</button>
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
    .edit-btn,.delete-btn,.doc-btn,.skill-btn { border:none; background:none; cursor:pointer; font-size:1.05rem; padding:5px; border-radius:8px; transition:background 0.15s; }
    .edit-btn:hover { background:#dbeafe; } .delete-btn:hover { background:#fee2e2; } .doc-btn:hover { background:#f0fdf4; }
    .skill-btn:hover { background:#f3e8ff; }

    /* ══════════════ Modal Compétences ══════════════ */
    .skill-modal { max-width:720px; }
    .skill-header { background:linear-gradient(135deg,#f5f3ff,#ede9fe) !important; }
    .add-skill-zone {
      background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;
      padding:14px 16px; margin-bottom:20px;
    }
    .ask-title { font-weight:700; color:#1e293b; font-size:0.9rem; margin-bottom:12px; }
    .ask-row {
      display:flex; gap:10px; align-items:center; flex-wrap:wrap;
    }
    .ask-select {
      flex:1; min-width:200px;
      padding:9px 12px; border:2px solid #e2e8f0; border-radius:10px;
      font-size:0.88rem; outline:none; background:white;
    }
    .ask-select:focus { border-color:#8b5cf6; }
    .ask-levels {
      display:flex; gap:4px;
      background:white; padding:3px; border-radius:8px;
      border:1px solid #e2e8f0;
    }
    .lvl-btn {
      width:30px; height:30px;
      border:none; background:transparent;
      border-radius:6px; cursor:pointer;
      font-size:0.85rem; font-weight:600;
      color:#64748b; transition:all 0.15s;
    }
    .lvl-btn:hover { background:#f1f5f9; color:#1e293b; }
    .lvl-btn.active {
      background:linear-gradient(135deg,#8b5cf6,#6366f1);
      color:white;
      box-shadow:0 2px 6px rgba(139,92,246,0.3);
    }
    .ask-add {
      padding:9px 18px;
      background:linear-gradient(135deg,#10b981,#059669);
      color:white; border:none; border-radius:10px;
      cursor:pointer; font-size:0.85rem; font-weight:700;
      transition:all 0.2s;
    }
    .ask-add:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 10px rgba(16,185,129,0.3); }
    .ask-add:disabled { opacity:0.4; cursor:not-allowed; }
    .ask-hint {
      margin:8px 0 0; font-size:0.78rem; color:#64748b;
    }

    .current-skills {}
    .cs-title { font-weight:700; color:#1e293b; font-size:0.92rem; margin-bottom:12px; }
    .cs-empty {
      text-align:center; padding:32px 16px;
      background:#fffbeb; border:1px dashed #fde68a;
      border-radius:12px;
    }
    .cs-empty p { margin:4px 0; color:#92400e; font-weight:500; }
    .cs-empty-sub { font-size:0.82rem; color:#a16207 !important; font-weight:400 !important; }
    .cs-row {
      display:flex; align-items:center; gap:12px;
      padding:12px;
      border-bottom:1px solid #f1f5f9;
      transition:background 0.15s;
    }
    .cs-row:hover { background:#fafafa; }
    .cs-info { flex:1; display:flex; flex-direction:column; gap:2px; }
    .cs-info strong { color:#1e293b; font-size:0.9rem; }
    .cs-cat {
      font-size:0.72rem; color:#94a3b8;
      background:#f1f5f9; padding:2px 8px;
      border-radius:6px; align-self:flex-start;
    }
    .level-picker {
      display:flex; gap:4px;
      background:#f8fafc; padding:3px; border-radius:8px;
      border:1px solid #e2e8f0;
    }
    .cs-label {
      min-width:90px; text-align:right;
      font-size:0.78rem; color:#64748b; font-weight:500;
    }
    .cs-remove {
      width:28px; height:28px;
      border:none; background:#fee2e2; color:#b91c1c;
      border-radius:8px; cursor:pointer;
      font-size:1rem; font-weight:700;
    }
    .cs-remove:hover { background:#fecaca; }

    /* ══════════════ Extraction CV par IA ══════════════ */
    .cv-zone {
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      border: 1px solid #ddd6fe;
      border-radius: 12px;
      padding: 16px;
    }
    .cv-upload-row {
      display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
    }
    .cv-file-label {
      flex: 1; min-width: 200px;
      display: flex; gap: 10px; align-items: center;
      cursor: pointer;
    }
    .cv-file-input { display: none; }
    .cv-file-btn {
      padding: 10px 16px;
      background: white; border: 2px dashed #8b5cf6;
      border-radius: 10px;
      color: #6d28d9; font-size: 0.85rem; font-weight: 600;
      transition: all 0.2s;
    }
    .cv-file-label:hover .cv-file-btn {
      background: #f5f3ff; border-color: #6d28d9;
    }
    .cv-file-name {
      font-size: 0.82rem; color: #475569;
      font-family: monospace; padding: 4px 10px;
      background: white; border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .cv-extract-btn {
      padding: 10px 20px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      color: white; border: none; border-radius: 10px;
      cursor: pointer; font-size: 0.88rem; font-weight: 700;
      box-shadow: 0 3px 10px rgba(139, 92, 246, 0.3);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .cv-extract-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 5px 14px rgba(139, 92, 246, 0.45);
    }
    .cv-extract-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
    .cv-hint {
      margin: 12px 0 0; font-size: 0.8rem; color: #6d28d9; font-style: italic;
    }
    .cv-error {
      margin-top: 12px; padding: 10px 14px;
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; color: #991b1b; font-size: 0.85rem;
    }

    .cv-result {
      margin-top: 16px; padding-top: 14px;
      border-top: 1px solid #ddd6fe;
    }
    .cv-summary {
      display: flex; gap: 18px; flex-wrap: wrap;
      padding: 10px 14px; margin-bottom: 12px;
      background: white; border-radius: 10px;
      font-size: 0.83rem; color: #475569;
    }
    .cv-summary-item strong { color: #1e293b; font-weight: 700; }
    .cv-selected-count {
      margin-left: auto;
      font-weight: 700; color: #15803d;
    }

    .cv-skill-row {
      display: flex; gap: 10px; align-items: center;
      padding: 10px 12px; margin-bottom: 8px;
      background: white; border-radius: 10px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .cv-skill-row:hover { border-color: #c4b5fd; }
    .cv-check {
      width: 20px; height: 20px;
      cursor: pointer; accent-color: #8b5cf6;
      flex-shrink: 0;
    }
    .cv-skill-info { flex: 1; min-width: 0; }
    .cv-skill-head {
      display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
    }
    .cv-skill-head strong { color: #1e293b; font-size: 0.9rem; }
    .cv-skill-cat {
      font-size: 0.7rem; color: #6d28d9;
      background: #ede9fe; padding: 2px 8px;
      border-radius: 6px;
    }
    .cv-conf {
      font-size: 0.7rem; font-weight: 600;
      padding: 2px 8px; border-radius: 6px;
    }
    .cv-conf.high { background: #dcfce7; color: #166534; }
    .cv-conf.mid { background: #fef9c3; color: #854d0e; }
    .cv-conf.low { background: #f1f5f9; color: #64748b; }
    .cv-evidence {
      margin-top: 4px;
      font-size: 0.74rem; color: #64748b;
      font-style: italic; line-height: 1.4;
    }
    .ev-icon { opacity: 0.6; }
    .cv-level {
      flex-shrink: 0;
    }
    .cv-lvl-label {
      min-width: 90px; text-align: right;
      font-size: 0.75rem; color: #64748b; font-weight: 500;
    }
    .cv-empty {
      text-align: center; padding: 24px;
      background: white; border-radius: 10px;
      color: #6d28d9; font-size: 0.85rem;
    }

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
  createdEmail: string | null = null;
  loadError: string | null = null;

  // Documents
  showDocModal = false;
  docEmployee: any = null;
  documents: any[] = [];
  selectedFile: File | null = null;

  // Compétences (matching IA)
  showSkillModal = false;
  skillEmployee: any = null;
  employeeSkills: any[] = [];
  allSkills: any[] = [];
  newSkillId: number | null = null;
  newSkillLevel = 3;

  // Extraction CV par IA (création employé)
  cvFile: File | null = null;
  cvExtracting = false;
  cvExtractResult: any = null;
  cvError: string | null = null;

  constructor(
    private employeeApi: EmployeeApiService,
    private recruitmentApi: RecruitmentApiService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
    this.loadServices();
    this.loadAllSkills();
  }

  loadAllSkills(): void {
    this.recruitmentApi.getAllSkills().subscribe({
      next: (data) => this.allSkills = data,
      error: () => this.allSkills = []
    });
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
    this.form = { contractType: '', departmentId: '', serviceId: '', keycloakRole: 'EMPLOYEE' };
    this.filteredServices = [];
    this.isEditing = false;
    this.editId = null;
    this.createdUsername = null;
    this.createdEmail = null;
    this.resetCvExtraction();
  }

  // ─── Extraction CV par IA ────────────────────────────

  resetCvExtraction(): void {
    this.cvFile = null;
    this.cvExtracting = false;
    this.cvExtractResult = null;
    this.cvError = null;
  }

  onCvSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.cvFile = file;
    this.cvExtractResult = null;
    this.cvError = null;
  }

  extractCvSkills(): void {
    if (!this.cvFile) return;
    this.cvExtracting = true;
    this.cvError = null;
    this.cvExtractResult = null;
    this.employeeApi.extractCvSkills(this.cvFile).subscribe({
      next: (result) => {
        this.cvExtractResult = result;
        this.cvExtracting = false;
      },
      error: (err) => {
        this.cvError = err.status === 400
          ? 'Format de fichier non supporté ou fichier vide.'
          : (err.error?.message || err.message || 'Erreur lors de l\'extraction du CV.');
        this.cvExtracting = false;
      }
    });
  }

  selectedExtractedCount(): number {
    if (!this.cvExtractResult?.skills) return 0;
    return this.cvExtractResult.skills.filter((s: any) => s.preselected).length;
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.75) return '🟢 Haute';
    if (confidence >= 0.5) return '🟡 Moyenne';
    return '⚪ Faible';
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
        department: this.form.departmentId ? { id: +this.form.departmentId } : null,
        service: this.form.serviceId ? { id: +this.form.serviceId } : null,
        contract
      };
      this.employeeApi.updateEmployee(this.editId!, payload).subscribe({
        next: () => { this.showForm = false; this.loadEmployees(); },
        error: (err: any) => alert('Erreur mise à jour : ' + (err.error?.message || err.message))
      });
    } else {
      // Compétences validées par le RH après extraction CV (le cas échéant)
      const initialSkills = this.cvExtractResult?.skills
        ? this.cvExtractResult.skills
            .filter((s: any) => s.preselected && s.skillId && s.level)
            .map((s: any) => ({
              skillId: s.skillId,
              skillName: s.skillName,
              category: s.category,
              level: s.level
            }))
        : [];

      // Création : on envoie le DTO avec les champs Keycloak
      // (le matricule est généré côté backend à partir de l'ID auto-incrémenté)
      const payload = {
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        email: this.form.email,
        phone: this.form.phone,
        position: this.form.position,
        hireDate: this.form.hireDate || null,
        department: this.form.departmentId ? { id: +this.form.departmentId } : null,
        service: this.form.serviceId ? { id: +this.form.serviceId } : null,
        contract,
        keycloakRole: this.form.keycloakRole || 'EMPLOYEE',
        initialSkills
      };
      this.employeeApi.createEmployee(payload).subscribe({
        next: (emp: any) => {
          this.showForm = false;
          this.createdUsername = emp.keycloakUsername;
          this.createdEmail = emp.email;
          this.loadEmployees();
          // Effacer la bannière après 12 secondes
          setTimeout(() => { this.createdUsername = null; this.createdEmail = null; }, 12000);
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

  // \u2500\u2500\u2500 Comp\u00E9tences (matching IA) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  openSkills(emp: any): void {
    this.skillEmployee = emp;
    this.showSkillModal = true;
    this.newSkillId = null;
    this.newSkillLevel = 3;
    this.loadEmployeeSkills();
  }

  loadEmployeeSkills(): void {
    if (!this.skillEmployee) return;
    this.employeeApi.getEmployeeSkills(this.skillEmployee.matricule).subscribe({
      next: (data) => this.employeeSkills = data || [],
      error: () => this.employeeSkills = []
    });
  }

  /** Liste des comp\u00E9tences disponibles (= toutes - celles d\u00E9j\u00E0 assign\u00E9es) */
  availableSkillsForAdd(): any[] {
    const assignedIds = new Set(this.employeeSkills.map(s => s.skillId));
    return this.allSkills.filter(s => !assignedIds.has(s.id));
  }

  addSkillToEmployee(): void {
    if (!this.skillEmployee || !this.newSkillId) return;
    const skill = this.allSkills.find(s => s.id === this.newSkillId);
    if (!skill) return;
    this.employeeApi.addEmployeeSkill(this.skillEmployee.matricule, {
      skillId: skill.id,
      skillName: skill.name,
      category: skill.category,
      level: this.newSkillLevel
    }).subscribe({
      next: () => {
        this.newSkillId = null;
        this.newSkillLevel = 3;
        this.loadEmployeeSkills();
      },
      error: (err) => alert('Erreur ajout comp\u00E9tence : ' + (err.error?.message || err.message))
    });
  }

  updateSkillLevel(sk: any, level: number): void {
    if (sk.level === level) return;
    this.employeeApi.updateEmployeeSkillLevel(this.skillEmployee.matricule, sk.skillId, level).subscribe({
      next: () => { sk.level = level; },
      error: (err) => alert('Erreur mise \u00E0 jour : ' + (err.error?.message || err.message))
    });
  }

  removeSkill(sk: any): void {
    if (!confirm(`Retirer la comp\u00E9tence "${sk.skillName}" ?`)) return;
    this.employeeApi.removeEmployeeSkill(this.skillEmployee.matricule, sk.skillId).subscribe({
      next: () => this.loadEmployeeSkills()
    });
  }

  getLevelLabel(level: number): string {
    const labels: { [k: number]: string } = {
      1: 'D\u00E9butant', 2: 'Notions', 3: 'Interm\u00E9diaire', 4: 'Avanc\u00E9', 5: 'Expert'
    };
    return labels[level] || '\u2014';
  }
}

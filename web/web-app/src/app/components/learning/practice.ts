import { Component, OnInit, inject, signal, PLATFORM_ID, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiService, Question, Attempt, Tag, Topic } from '../../services/api.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="card shadow">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 class="mb-0">Practice Mode</h4>
          <div class="btn-group">
            <button class="btn btn-outline-light" [routerLink]="['/']">Dashboard</button>
          </div>
        </div>
        
        <div class="card-body">
          <!-- Source Selection & Controls -->
          <div *ngIf="!question() && !loading()" class="text-center py-4 border-bottom mb-4">
            <div class="btn-group" role="group">
              <input type="radio" class="btn-check" name="source" id="aiSource" [(ngModel)]="source" value="AI">
              <label class="btn btn-outline-secondary" for="aiSource">✨ AI Generated</label>
              <input type="radio" class="btn-check" name="source" id="dbSource" [(ngModel)]="source" value="DB">
              <label class="btn btn-outline-secondary" for="dbSource">📚 From Library</label>
            </div>
          </div>

          <div *ngIf="!question() && !loading()" class="text-center py-2">
            <h3>Ready to learn?</h3>
            
            <div class="mb-4 d-flex justify-content-center gap-4 flex-wrap text-start">
              <div style="min-width: 200px;">
                <label class="form-label d-block fw-bold">Topic:</label>
                <select class="form-select form-select-sm" [ngModel]="selectedTopicId()" (ngModelChange)="selectedTopicId.set($event)">
                  <option *ngIf="source === 'DB'" [ngValue]="null">-- All Topics --</option>
                  <option *ngFor="let t of allTopics()" [ngValue]="t.id">{{ t.name }}</option>
                </select>
              </div>

              <div>
                <label class="form-label d-block fw-bold">Difficulty:</label>
                <div class="btn-group" role="group">
                  <input type="radio" class="btn-check" name="diff" id="any" [ngModel]="difficulty()" (ngModelChange)="difficulty.set($event)" value="">
                  <label class="btn btn-sm btn-outline-secondary" for="any">Any</label>
                  <input type="radio" class="btn-check" name="diff" id="easy" [ngModel]="difficulty()" (ngModelChange)="difficulty.set($event)" value="EASY">
                  <label class="btn btn-sm btn-outline-success" for="easy">Easy</label>
                  <input type="radio" class="btn-check" name="diff" id="medium" [ngModel]="difficulty()" (ngModelChange)="difficulty.set($event)" value="MEDIUM">
                  <label class="btn btn-sm btn-outline-warning" for="medium">Medium</label>
                  <input type="radio" class="btn-check" name="diff" id="hard" [ngModel]="difficulty()" (ngModelChange)="difficulty.set($event)" value="HARD">
                  <label class="btn btn-sm btn-outline-danger" for="hard">Hard</label>
                </div>
              </div>

              <div *ngIf="source === 'AI'">
                <label class="form-label d-block fw-bold">Type:</label>
                <div class="btn-group" role="group">
                  <input type="radio" class="btn-check" name="qtype" id="open" [ngModel]="questionType()" (ngModelChange)="questionType.set($event)" value="OPEN">
                  <label class="btn btn-sm btn-outline-primary" for="open">Open Ended</label>
                  <input type="radio" class="btn-check" name="qtype" id="mcq" [ngModel]="questionType()" (ngModelChange)="questionType.set($event)" value="MCQ">
                  <label class="btn btn-sm btn-outline-primary" for="mcq">MCQ</label>
                </div>
              </div>

              <!-- Autocomplete Tag Filter for Library -->
              <div *ngIf="source === 'DB'" class="tag-filter-container" style="min-width: 250px; position: relative;">
                <label class="form-label d-block fw-bold">Filter by Tags:</label>
                <div class="input-group input-group-sm mb-2">
                  <input type="text" class="form-control" placeholder="Search tags..." 
                         [(ngModel)]="tagSearchQuery" (focus)="showTagDropdown = true">
                  <button class="btn btn-outline-secondary" type="button" (click)="tagSearchQuery = ''; showTagDropdown = false">×</button>
                </div>
                
                <!-- Dropdown -->
                <div *ngIf="showTagDropdown" 
                     class="list-group position-absolute w-100 shadow z-3 border" 
                     style="max-height: 200px; overflow-y: auto; top: 100%;">
                  <div class="d-flex justify-content-between align-items-center bg-light px-2 py-1 sticky-top border-bottom">
                    <small class="text-muted fw-bold">SUGGESTIONS</small>
                    <button class="btn btn-sm btn-link p-0 text-decoration-none text-danger fw-bold" (click)="showTagDropdown = false">×</button>
                  </div>
                  <button *ngFor="let tag of filteredAvailableTags()" 
                          class="list-group-item list-group-item-action py-1 px-2 small"
                          (click)="addFilterTag(tag.name)">
                    {{ tag.name }}
                  </button>
                  <div *ngIf="filteredAvailableTags().length === 0" class="list-group-item disabled small italic">
                    No matching tags found
                  </div>
                </div>

                <!-- Selected Tags Pills -->
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <span *ngFor="let t of selectedFilterTags()" class="badge bg-info text-white">
                    {{ t }} <span class="ms-1" style="cursor:pointer" (click)="removeFilterTag(t)">×</span>
                  </span>
                </div>
              </div>
            </div>

            <button class="btn btn-lg btn-primary shadow-sm" (click)="fetchQuestion()" [disabled]="source === 'AI' && !selectedTopicId()">
              {{ source === 'AI' ? 'Generate AI Question' : 'Get Library Question' }}
            </button>
          </div>

          <div *ngIf="loading()" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Fetching your question...</p>
          </div>

          <div *ngIf="question() && !loading()">
            @let q = question();
            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span class="badge bg-primary me-2">{{ getTopicName(q?.topic_id) }}</span>
                  <span class="badge bg-secondary">{{ q?.type }} | {{ q?.difficulty }}</span>
                </div>
                <div class="tags-container text-end">
                   <div class="mb-1 d-flex flex-wrap justify-content-end gap-1">
                     <span *ngFor="let tag of currentTags" class="badge rounded-pill bg-light text-dark border">
                        {{ tag }} 
                        <span class="ms-1 text-danger fw-bold" style="cursor:pointer" (click)="removeTagAndSave(tag)" title="Remove Tag">×</span>
                     </span>
                   </div>
                   <button class="btn btn-sm btn-link p-0 text-decoration-none" (click)="showTagEditor = !showTagEditor">
                     {{ showTagEditor ? 'Close' : '⊕ Add Tag' }}
                   </button>
                </div>
              </div>
              
              <div *ngIf="q?.attempt_summary" class="mb-2 small d-flex align-items-center gap-2">
                <span class="text-muted fw-bold">History: </span>
                <span class="badge bg-info text-white">Attempts: {{ q?.attempt_summary?.count }}</span>
                <span *ngIf="q?.attempt_summary?.last_score !== null" class="badge bg-dark text-white">
                  Last Score: {{ q?.attempt_summary?.last_score }}/10
                </span>
                <span *ngIf="q?.attempt_summary?.last_is_correct !== null && q?.attempt_summary?.last_is_correct !== undefined" 
                      class="badge" [ngClass]="q?.attempt_summary?.last_is_correct ? 'bg-success' : 'bg-danger'">
                  Last Result: {{ q?.attempt_summary?.last_is_correct ? 'Correct' : 'Incorrect' }}
                </span>
              </div>

              <div *ngIf="showTagEditor" class="mb-3 p-3 bg-light rounded border shadow-sm">
                <div class="input-group">
                  <input type="text" class="form-control form-control-sm" placeholder="New tag name..." #tagInput (keyup.enter)="addTagAndSave(tagInput)">
                  <button class="btn btn-sm btn-primary" (click)="addTagAndSave(tagInput)">Add & Save</button>
                </div>
              </div>

              <div class="bg-light p-4 rounded border">
                <h5 class="card-text white-space-pre-wrap mb-0">{{ q?.question_text }}</h5>
              </div>
            </div>

            <div *ngIf="q?.type === 'MCQ'" class="list-group mb-4">
              <button *ngFor="let opt of q?.options; let i = index" 
                      class="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center"
                      [class.active]="selectedOptionIndex() === i && !evaluation()"
                      [class.list-group-item-success]="evaluation() && opt.is_correct"
                      [class.list-group-item-danger]="evaluation() && !opt.is_correct && selectedOptionIndex() === i"
                      (click)="selectOption(i)"
                      [disabled]="!!evaluation()">
                <span>{{ opt.option_text }}</span>
                <span *ngIf="evaluation() && opt.is_correct" class="fw-bold text-success">✅</span>
                <span *ngIf="evaluation() && !opt.is_correct && selectedOptionIndex() === i" class="fw-bold text-danger">❌</span>
              </button>
            </div>

            <div *ngIf="q?.type === 'OPEN'" class="mb-4">
              <textarea class="form-control" rows="6" placeholder="Type your detailed answer here..." 
                        [ngModel]="userAnswer()" (ngModelChange)="userAnswer.set($event)" 
                        [disabled]="!!evaluation()"></textarea>
              
              <div class="mt-3">
                <button class="btn btn-sm btn-outline-info" (click)="toggleAnswer()">
                  {{ showReferenceAnswer() ? 'Hide Model Answer' : 'Show Model Answer' }}
                </button>
                
                <div *ngIf="showReferenceAnswer()" class="mt-2 p-3 bg-light border rounded position-relative">
                  <div *ngIf="!isEditingAnswer">
                    <p class="mb-0 white-space-pre-wrap">{{ q?.reference_answer || 'No reference answer provided for this question.' }}</p>
                    <button class="btn btn-sm btn-link position-absolute top-0 end-0 mt-1 me-1 text-decoration-none" (click)="startEditAnswer()">✎ Edit</button>
                  </div>
                  <div *ngIf="isEditingAnswer">
                    <textarea class="form-control form-control-sm mb-2" rows="4" [(ngModel)]="editableAnswer"></textarea>
                    <div class="text-end">
                      <button class="btn btn-sm btn-success me-1" (click)="saveAnswer()">Save</button>
                      <button class="btn btn-sm btn-secondary" (click)="isEditingAnswer = false">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-2" *ngIf="!evaluation()">
              <button class="btn btn-success btn-lg flex-grow-1 shadow-sm" (click)="submitAnswer()" [disabled]="!isAnswered()">
                {{ q?.type === 'OPEN' ? 'AI Evaluate' : 'Submit Answer' }}
              </button>
              
              <ng-container *ngIf="q?.type === 'OPEN'">
                <button class="btn btn-outline-success btn-lg shadow-sm" (click)="submitAnswer(true)" [disabled]="!isAnswered()">Success</button>
                <button class="btn btn-outline-danger btn-lg shadow-sm" (click)="submitAnswer(false)" [disabled]="!isAnswered()">Failure</button>
              </ng-container>

              <button class="btn btn-outline-secondary btn-lg shadow-sm" (click)="nextQuestion()">Skip / Next</button>
            </div>

            <div *ngIf="evaluation()" class="mt-4 border-top pt-4">
              @let ev = evaluation();
              <div class="alert shadow-sm" [class.alert-success]="ev?.is_correct" [class.alert-warning]="!ev?.is_correct">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h4 class="mb-0">{{ ev?.is_correct ? '✅ Correct!' : '💡 Keep trying!' }}</h4>
                  <span class="badge bg-white text-dark fs-5">Score: {{ ev?.score }}/10</span>
                </div>
                <hr>
                <div class="mb-3">
                  <strong>Feedback:</strong>
                  <p class="mb-0 mt-1">{{ ev?.evaluation_json?.feedback }}</p>
                </div>
                <div *ngIf="ev?.evaluation_json?.missing_points?.length">
                  <strong>Missing Points:</strong>
                  <ul class="mt-1">
                    <li *ngFor="let p of ev?.evaluation_json?.missing_points">{{ p }}</li>
                  </ul>
                </div>
              </div>
              <button class="btn btn-primary btn-lg w-100 shadow-sm" (click)="nextQuestion()">Next Question</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .white-space-pre-wrap {
      white-space: pre-wrap;
    }
    .z-3 {
      z-index: 1050;
    }
    .italic {
      font-style: italic;
    }
  `]
})
export class PracticeComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef);

  allTopics = signal<Topic[]>([]);
  selectedTopicId = signal<number | null>(null);
  
  userId = signal<number | null>(null);
  question = signal<Question | null>(null);
  loading = signal<boolean>(false);
  userAnswer = signal<string>('');
  selectedOptionIndex = signal<number | null>(null);
  evaluation = signal<Attempt | null>(null);
  difficulty = signal<string>('MEDIUM');
  questionType = signal<string>('OPEN');
  
  source: 'AI' | 'DB' = 'AI';
  showTagEditor: boolean = false;
  currentTags: string[] = [];
  
  availableTags = signal<Tag[]>([]);
  tagSearchQuery: string = '';
  showTagDropdown: boolean = false;
  selectedFilterTags = signal<string[]>([]);

  filteredAvailableTags = computed(() => {
    const query = this.tagSearchQuery.toLowerCase();
    const selected = this.selectedFilterTags();
    return this.availableTags().filter(t => 
      t.name.toLowerCase().includes(query) && !selected.includes(t.name)
    );
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.querySelector('.tag-filter-container')?.contains(event.target)) {
      this.showTagDropdown = false;
    }
  }

  showReferenceAnswer = signal<boolean>(false);
  isEditingAnswer: boolean = false;
  editableAnswer: string = '';

  ngOnInit() {
    const routeTopicId = +this.route.snapshot.params['topicId'];
    if (routeTopicId) {
      this.selectedTopicId.set(routeTopicId);
    }
    
    this.loadTopics();
    this.loadTags();
    
    if (isPlatformBrowser(this.platformId)) {
      const storedUserId = localStorage.getItem('selectedUserId');
      if (storedUserId) {
        this.userId.set(+storedUserId);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  loadTopics() {
    this.apiService.getTopics().subscribe(topics => this.allTopics.set(topics));
  }

  loadTags() {
    this.apiService.getTags().subscribe(tags => this.availableTags.set(tags));
  }

  addFilterTag(tagName: string) {
    this.selectedFilterTags.update(tags => [...tags, tagName]);
    this.tagSearchQuery = '';
    this.showTagDropdown = false;
  }

  removeFilterTag(tagName: string) {
    this.selectedFilterTags.update(tags => tags.filter(t => t !== tagName));
  }

  getTopicName(id?: number): string {
    if (!id) return 'Unknown';
    return this.allTopics().find(t => t.id === id)?.name || 'Unknown';
  }

  fetchQuestion() {
    this.loading.set(true);
    this.userAnswer.set('');
    this.selectedOptionIndex.set(null);
    this.evaluation.set(null);
    this.showTagEditor = false;
    this.showReferenceAnswer.set(false);
    this.isEditingAnswer = false;

    const topicId = this.selectedTopicId() || undefined;
    const diff = this.difficulty() || undefined;
    const userId = this.userId() || undefined;
    
    const request = this.source === 'AI' 
      ? this.apiService.generateQuestion(topicId!, this.questionType(), this.difficulty() || 'MEDIUM', userId)
      : this.apiService.getRandomQuestion(topicId, diff, this.selectedFilterTags(), userId);

    request.subscribe({
      next: (q) => {
        this.question.set(q);
        this.currentTags = q.tags?.map(t => t.name) || [];
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.detail || 'No questions found matching your filters.';
        alert(msg);
      }
    });
  }

  selectOption(index: number) {
    if (this.evaluation()) return;
    this.selectedOptionIndex.set(index);
    const q = this.question();
    if (q && q.options) {
      this.userAnswer.set(q.options[index].option_text);
    }
  }

  isAnswered(): boolean {
    const q = this.question();
    if (!q) return false;
    if (q.type === 'MCQ') return this.selectedOptionIndex() !== null;
    return this.userAnswer().trim().length > 0;
  }

  toggleAnswer() {
    this.showReferenceAnswer.update(v => !v);
  }

  startEditAnswer() {
    this.isEditingAnswer = true;
    this.editableAnswer = this.question()?.reference_answer || '';
  }

  saveAnswer() {
    const q = this.question();
    if (!q) return;

    this.apiService.updateQuestionAnswer(q.id, this.editableAnswer).subscribe({
      next: (updatedQ) => {
        const currentQ = this.question();
        if (currentQ) {
          this.question.set({
            ...updatedQ,
            attempt_summary: currentQ.attempt_summary
          });
        }
        this.isEditingAnswer = false;
      },
      error: () => alert('Failed to update answer.')
    });
  }

  addTagAndSave(input: HTMLInputElement) {
    const val = input.value.trim();
    if (val && !this.currentTags.includes(val)) {
      const newTags = [...this.currentTags, val];
      this.saveTags(newTags);
      input.value = '';
    }
  }

  removeTagAndSave(tagName: string) {
    const newTags = this.currentTags.filter(t => t !== tagName);
    this.saveTags(newTags);
  }

  saveTags(newTags: string[]) {
    const q = this.question();
    if (!q) return;

    this.apiService.updateQuestionTags(q.id, newTags).subscribe({
      next: (updatedQ) => {
        const currentQ = this.question();
        if (currentQ) {
          // Preserve attempt summary when updating tags
          this.question.set({
            ...updatedQ,
            attempt_summary: currentQ.attempt_summary
          });
        }
        this.currentTags = updatedQ.tags?.map(t => t.name) || [];
        this.loadTags(); 
      },
      error: () => alert('Failed to update tags.')
    });
  }

  submitAnswer(isCorrectManual?: boolean) {
    const uid = this.userId();
    const q = this.question();
    if (!uid || !q) return;

    this.apiService.submitAttempt(uid, q.id, this.userAnswer(), undefined, isCorrectManual).subscribe({
      next: (att) => {
        this.evaluation.set(att);
      },
      error: () => {
        alert('Failed to submit answer.');
      }
    });
  }

  nextQuestion() {
    this.question.set(null);
    this.evaluation.set(null);
    this.userAnswer.set('');
    this.selectedOptionIndex.set(null);
    this.fetchQuestion();
  }
}

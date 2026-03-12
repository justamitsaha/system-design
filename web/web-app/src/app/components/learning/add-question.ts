import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiService, Topic } from '../../services/api.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-question',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="card shadow-sm">
        <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 class="mb-0">Add New Question</h4>
          <button class="btn btn-outline-light btn-sm" [routerLink]="['/']">Back to Dashboard</button>
        </div>
        <div class="card-body">
          <form (ngSubmit)="saveQuestion()">
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Topic</label>
                <select class="form-select" [(ngModel)]="question.topic_id" name="topic" required>
                  <option [ngValue]="null">-- Select Topic --</option>
                  <option *ngFor="let t of topics()" [ngValue]="t.id">{{ t.name }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Difficulty</label>
                <select class="form-select" [(ngModel)]="question.difficulty" name="difficulty">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Type</label>
                <select class="form-select" [(ngModel)]="question.type" name="type" (change)="onTypeChange()">
                  <option value="OPEN">Open Ended</option>
                  <option value="MCQ">MCQ</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Question Text</label>
              <textarea class="form-control" rows="4" [(ngModel)]="question.question_text" name="text" placeholder="Enter the technical question..." required></textarea>
            </div>

            <div *ngIf="question.type === 'OPEN'" class="mb-3">
              <label class="form-label fw-bold">Reference Answer (Optional)</label>
              <textarea class="form-control" rows="4" [(ngModel)]="question.reference_answer" name="ref_answer" placeholder="Enter the correct/ideal answer for reference..."></textarea>
            </div>

            <!-- MCQ Options -->
            <div *ngIf="question.type === 'MCQ'" class="mb-4 p-3 bg-light rounded border">
              <label class="form-label fw-bold">MCQ Options</label>
              <div *ngFor="let opt of question.options; let i = index" class="input-group mb-2">
                <div class="input-group-text">
                  <input class="form-check-input mt-0" type="radio" name="correctOpt" [checked]="opt.is_correct" (change)="setCorrect(i)">
                </div>
                <input type="text" class="form-control" [(ngModel)]="opt.option_text" [name]="'opt' + i" placeholder="Option text...">
                <button class="btn btn-outline-danger" type="button" (click)="removeOption(i)" [disabled]="question.options.length <= 2">×</button>
              </div>
              <button class="btn btn-sm btn-outline-primary" type="button" (click)="addOption()">+ Add Option</button>
            </div>

            <div class="mb-4">
              <label class="form-label fw-bold">Tags</label>
              <div class="input-group mb-2" style="max-width: 400px;">
                <input type="text" class="form-control form-control-sm" placeholder="New tag..." #tagInput (keyup.enter)="addTag(tagInput)">
                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="addTag(tagInput)">Add</button>
              </div>
              <div class="d-flex flex-wrap gap-1">
                <span *ngFor="let t of question.tags" class="badge bg-info text-white">
                  {{ t }} <span class="ms-1" style="cursor:pointer" (click)="removeTag(t)">×</span>
                </span>
              </div>
            </div>

            <!-- Initial Attempt Logging -->
            <div class="mb-4 p-3 border rounded bg-light">
              <label class="form-label fw-bold d-block">Log Initial Attempt Result?</label>
              <div class="btn-group" role="group">
                <input type="radio" class="btn-check" name="attemptRes" id="resNone" [(ngModel)]="initialAttemptResult" [value]="null">
                <label class="btn btn-outline-secondary" for="resNone">None</label>
                <input type="radio" class="btn-check" name="attemptRes" id="resSuccess" [(ngModel)]="initialAttemptResult" [value]="true">
                <label class="btn btn-outline-success" for="resSuccess">Success (Correct)</label>
                <input type="radio" class="btn-check" name="attemptRes" id="resFailure" [(ngModel)]="initialAttemptResult" [value]="false">
                <label class="btn btn-outline-danger" for="resFailure">Failure (Incorrect)</label>
              </div>
              <p class="mt-2 mb-0 small text-muted">This will create your first history entry for this question.</p>
            </div>

            <div class="d-flex justify-content-end gap-2 border-top pt-3">
              <button type="button" class="btn btn-secondary" [routerLink]="['/']">Cancel</button>
              <button type="submit" class="btn btn-success px-4" [disabled]="!isValid()">Save Question</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class AddQuestionComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  topics = signal<Topic[]>([]);
  
  question: any = {
    topic_id: null,
    question_text: '',
    type: 'OPEN',
    difficulty: 'MEDIUM',
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false }
    ],
    tags: [],
    reference_answer: ''
  };

  initialAttemptResult: boolean | null = null;
  selectedUserId: number | null = null;

  ngOnInit() {
    this.apiService.getTopics().subscribe(t => this.topics.set(t));
    
    if (isPlatformBrowser(this.platformId)) {
      const storedId = localStorage.getItem('selectedUserId');
      if (storedId) {
        this.selectedUserId = +storedId;
      }
    }
  }

  onTypeChange() {
    if (this.question.type === 'MCQ' && this.question.options.length === 0) {
      this.question.options = [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false }
      ];
    }
  }

  addOption() {
    this.question.options.push({ option_text: '', is_correct: false });
  }

  removeOption(index: number) {
    this.question.options.splice(index, 1);
    if (!this.question.options.some((o: any) => o.is_correct)) {
      this.question.options[0].is_correct = true;
    }
  }

  setCorrect(index: number) {
    this.question.options.forEach((o: any, i: number) => o.is_correct = i === index);
  }

  addTag(input: HTMLInputElement) {
    const val = input.value.trim();
    if (val && !this.question.tags.includes(val)) {
      this.question.tags.push(val);
      input.value = '';
    }
  }

  removeTag(tag: string) {
    this.question.tags = this.question.tags.filter((t: string) => t !== tag);
  }

  isValid() {
    if (!this.question.topic_id || !this.question.question_text.trim()) return false;
    if (this.question.type === 'MCQ') {
      return this.question.options.every((o: any) => o.option_text.trim()) && 
             this.question.options.some((o: any) => o.is_correct);
    }
    return true;
  }

  saveQuestion() {
    const payload = { 
      ...this.question,
      user_id: this.selectedUserId,
      initial_result: this.initialAttemptResult
    };
    
    if (payload.type !== 'MCQ') {
      delete payload.options;
    }

    this.apiService.createManualQuestion(payload).subscribe({
      next: () => {
        alert('Question added successfully' + (this.initialAttemptResult !== null ? ' with initial attempt logged!' : '!'));
        this.router.navigate(['/']);
      },
      error: (err) => {
        alert(err.error?.detail || 'Failed to save question.');
      }
    });
  }
}

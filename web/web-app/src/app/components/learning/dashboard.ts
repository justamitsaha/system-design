import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiService, User, Topic } from '../../services/api.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-4">
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title">User Selection</h5>
              <div class="mb-3">
                <label for="userSelect" class="form-label">Current User</label>
                <select id="userSelect" class="form-select" 
                        [ngModel]="selectedUserId()" 
                        (ngModelChange)="onUserChange($event)">
                  <option [ngValue]="null">-- Select User --</option>
                  <option *ngFor="let user of users()" [ngValue]="user.id">{{ user.username }}</option>
                </select>
              </div>
              <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="New username" 
                       [ngModel]="newUsername()" 
                       (ngModelChange)="newUsername.set($event)">
                <button class="btn btn-outline-primary" type="button" (click)="createUser()">Add</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-8">
          <div class="card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">Learning Topics</h5>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-dark" [routerLink]="['/add-question']">+ Add New Question</button>
                  <div class="input-group input-group-sm" style="max-width: 250px;">
                    <input type="text" class="form-control" placeholder="New topic..." [(ngModel)]="newTopicName">
                    <button class="btn btn-primary" (click)="createTopic()">Add Topic</button>
                  </div>
                </div>
              </div>

              <div class="list-group mt-3">
                <div *ngFor="let topic of topics()" class="list-group-item">
                  <div class="d-flex justify-content-between align-items-center">
                    <div *ngIf="editingTopicId !== topic.id">
                      <h6 class="mb-0">{{ topic.name }}</h6>
                    </div>
                    <div *ngIf="editingTopicId === topic.id" class="flex-grow-1 me-3">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="editName">
                    </div>

                    <div class="btn-group">
                      <ng-container *ngIf="editingTopicId !== topic.id">
                        <button class="btn btn-sm btn-primary" [disabled]="!selectedUserId()" [routerLink]="['/practice', topic.id]">Practice</button>
                        <button class="btn btn-sm btn-outline-info" [routerLink]="['/analytics', topic.id]">Analytics</button>
                        <button class="btn btn-sm btn-outline-secondary" (click)="startEdit(topic)">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" (click)="deleteTopic(topic.id)">Delete</button>
                      </ng-container>
                      <ng-container *ngIf="editingTopicId === topic.id">
                        <button class="btn btn-sm btn-success" (click)="saveTopicEdit()">Save</button>
                        <button class="btn btn-sm btn-outline-secondary" (click)="editingTopicId = null">Cancel</button>
                      </ng-container>
                    </div>
                  </div>
                </div>
                <div *ngIf="topics().length === 0" class="text-center py-4 text-muted">
                  No topics found. Please add a new topic above.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  users = signal<User[]>([]);
  topics = signal<Topic[]>([]);
  selectedUserId = signal<number | null>(null);
  newUsername = signal<string>('');
  
  newTopicName: string = '';
  editingTopicId: number | null = null;
  editName: string = '';

  ngOnInit() {
    this.loadUsers();
    this.loadTopics();
    
    if (isPlatformBrowser(this.platformId)) {
      const storedUserId = localStorage.getItem('selectedUserId');
      if (storedUserId) {
        this.selectedUserId.set(+storedUserId);
      }
    }
  }

  loadUsers() {
    this.apiService.getUsers().subscribe(users => this.users.set(users));
  }

  loadTopics() {
    this.apiService.getTopics().subscribe(topics => this.topics.set(topics));
  }

  createUser() {
    const name = this.newUsername().trim();
    if (name) {
      this.apiService.createUser(name).subscribe(user => {
        this.users.update(current => [...current, user]);
        this.selectedUserId.set(user.id);
        this.onUserChange(user.id);
        this.newUsername.set('');
      });
    }
  }

  createTopic() {
    if (this.newTopicName.trim()) {
      this.apiService.createTopic(this.newTopicName.trim()).subscribe(() => {
        this.loadTopics();
        this.newTopicName = '';
      });
    }
  }

  startEdit(topic: Topic) {
    this.editingTopicId = topic.id;
    this.editName = topic.name;
  }

  saveTopicEdit() {
    if (this.editingTopicId && this.editName.trim()) {
      this.apiService.updateTopic(this.editingTopicId, this.editName.trim()).subscribe(() => {
        this.loadTopics();
        this.editingTopicId = null;
      });
    }
  }

  deleteTopic(id: number) {
    if (confirm('Are you sure you want to delete this topic and all its analytics?')) {
      this.apiService.deleteTopic(id).subscribe(() => {
        this.loadTopics();
      });
    }
  }

  onUserChange(userId: number | null) {
    this.selectedUserId.set(userId);
    if (isPlatformBrowser(this.platformId)) {
      if (userId) {
        localStorage.setItem('selectedUserId', userId.toString());
      } else {
        localStorage.removeItem('selectedUserId');
      }
    }
  }
}

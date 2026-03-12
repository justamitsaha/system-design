import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <div class="card shadow">
        <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
          <h4 class="mb-0">{{ topicId ? 'Topic Performance' : 'Performance Overview' }}</h4>
          <button class="btn btn-outline-light" [routerLink]="['/']">Back to Dashboard</button>
        </div>
        <div class="card-body">
          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border text-info" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>

          <!-- Single Topic Performance -->
          <div *ngIf="!loading && topicId && performance" class="text-center">
            <div class="display-1 mb-3" [class.text-success]="performance.average_score > 70" 
                 [class.text-warning]="performance.average_score <= 70 && performance.average_score > 40"
                 [class.text-danger]="performance.average_score <= 40">
              {{ performance.average_score | number:'1.0-1' }}%
            </div>
            <h3>Average Score</h3>
            <p class="text-muted">Based on all attempts for this topic.</p>
            
            <div class="mt-4">
              <div class="progress" style="height: 30px;">
                <div class="progress-bar" role="progressbar" 
                     [style.width.%]="performance.average_score"
                     [class.bg-success]="performance.average_score > 70"
                     [class.bg-warning]="performance.average_score <= 70 && performance.average_score > 40"
                     [class.bg-danger]="performance.average_score <= 40"
                     [attr.aria-valuenow]="performance.average_score" aria-valuemin="0" aria-valuemax="100">
                </div>
              </div>
            </div>
          </div>

          <!-- All Topics Overview -->
          <div *ngIf="!loading && !topicId">
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Average Score</th>
                    <th style="width: 40%">Progress</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of allPerformances">
                    <td><strong>{{ item.topic_name }}</strong></td>
                    <td>
                      <span class="badge" 
                            [class.bg-success]="item.average_score > 70"
                            [class.bg-warning]="item.average_score <= 70 && item.average_score > 40"
                            [class.bg-danger]="item.average_score <= 40">
                        {{ item.average_score | number:'1.0-1' }}%
                      </span>
                    </td>
                    <td>
                      <div class="progress" style="height: 10px;">
                        <div class="progress-bar" role="progressbar" 
                             [style.width.%]="item.average_score"
                             [class.bg-success]="item.average_score > 70"
                             [class.bg-warning]="item.average_score <= 70 && item.average_score > 40"
                             [class.bg-danger]="item.average_score <= 40">
                        </div>
                      </div>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" [routerLink]="['/analytics', item.topic_id]">Details</button>
                    </td>
                  </tr>
                  <tr *ngIf="allPerformances.length === 0">
                    <td colspan="4" class="text-center py-4">No data available. Start practicing!</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div *ngIf="!loading && topicId && !performance" class="text-center py-5">
            <p>No data available for this topic yet. Start practicing!</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  topicId: number | null = null;
  performance: any = null;
  allPerformances: any[] = [];
  loading: boolean = true;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.topicId = params['topicId'] ? +params['topicId'] : null;
      if (this.topicId) {
        this.loadPerformance();
      } else {
        this.loadAllPerformances();
      }
    });
  }

  loadPerformance() {
    this.loading = true;
    this.apiService.getPerformance(this.topicId!).subscribe({
      next: (data) => {
        this.performance = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadAllPerformances() {
    this.loading = true;
    this.apiService.getTopics().subscribe({
      next: (topics) => {
        if (topics.length === 0) {
          this.loading = false;
          return;
        }
        
        let loadedCount = 0;
        const results: any[] = [];
        
        topics.forEach(topic => {
          this.apiService.getPerformance(topic.id).subscribe({
            next: (perf) => {
              results.push({
                topic_id: topic.id,
                topic_name: topic.name,
                average_score: perf.average_score
              });
              loadedCount++;
              if (loadedCount === topics.length) {
                this.allPerformances = results;
                this.loading = false;
              }
            },
            error: () => {
              loadedCount++;
              if (loadedCount === topics.length) {
                this.allPerformances = results;
                this.loading = false;
              }
            }
          });
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}

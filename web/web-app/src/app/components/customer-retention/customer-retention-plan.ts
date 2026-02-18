import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerRetentionService } from '../../services/customer-retention.service';

@Component({
  selector: 'app-customer-retention-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-retention-plan.html',
  styleUrl: './customer-retention-plan.scss'
})
export class CustomerRetentionPlan {
  private customerRetentionService = inject(CustomerRetentionService);

  customerId = signal('');
  plan = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  getPlan() {
    if (!this.customerId()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.customerRetentionService.analyzeRetention(this.customerId()).subscribe({
      next: (res) => {
        this.plan.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load retention plan');
        this.loading.set(false);
      }
    });
  }

  riskBadgeClass(level: string): string {
    const l = (level || '').toUpperCase();
    if (l === 'HIGH') return 'bg-danger';
    if (l === 'MEDIUM') return 'bg-warning text-dark';
    return 'bg-success';
  }

  priorityClass(priority: string): string {
    const p = (priority || '').toUpperCase();
    if (p === 'HIGH') return 'bg-danger';
    if (p === 'MEDIUM') return 'bg-warning text-dark';
    return 'bg-secondary';
  }
}

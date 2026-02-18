import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerRetentionService } from '../../services/customer-retention.service';

@Component({
  selector: 'app-customer-browser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-browser.html',
  styleUrl: './customer-browser.scss'
})
export class CustomerBrowser {
  private customerRetentionService = inject(CustomerRetentionService);

  datasetType = signal('customers');
  page = signal(0);
  size = signal(10);
  data = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  loadPage() {
    this.loading.set(true);
    this.error.set(null);
    const serviceCall = this.datasetType() === 'customers'
      ? this.customerRetentionService.getCustomers(this.page(), this.size())
      : this.customerRetentionService.getChurnData(this.page(), this.size());

    serviceCall.subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load data');
        this.loading.set(false);
      }
    });
  }

  prevPage() {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
      this.loadPage();
    }
  }

  nextPage() {
    const currentData = this.data();
    if (currentData && !currentData.last) {
      this.page.update(p => p + 1);
      this.loadPage();
    }
  }

  cleanup() {
    if (confirm('Are you sure you want to delete all customer and churn data?')) {
      this.customerRetentionService.cleanup().subscribe({
        next: () => {
          this.data.set(null);
          this.page.set(0);
          alert('Cleanup successful');
        },
        error: (err) => {
          alert('Cleanup failed');
        }
      });
    }
  }
}

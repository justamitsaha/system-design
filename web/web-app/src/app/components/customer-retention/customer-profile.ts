import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerRetentionService } from '../../services/customer-retention.service';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-profile.html',
  styleUrl: './customer-profile.scss'
})
export class CustomerProfile {
  private customerRetentionService = inject(CustomerRetentionService);

  customerId = signal('');
  customer = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  loadProfile() {
    if (!this.customerId()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.customerRetentionService.getCustomerProfile(this.customerId()).subscribe({
      next: (res) => {
        this.customer.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load customer profile');
        this.loading.set(false);
      }
    });
  }
}

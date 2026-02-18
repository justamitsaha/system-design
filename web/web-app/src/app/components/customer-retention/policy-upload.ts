import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerRetentionService } from '../../services/customer-retention.service';

@Component({
  selector: 'app-policy-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './policy-upload.html',
  styleUrl: './policy-upload.scss'
})
export class PolicyUpload {
  private customerRetentionService = inject(CustomerRetentionService);

  policyFile = signal<File | null>(null);
  chunks = signal<any[]>([]);
  uploading = signal(false);
  searchQuery = signal('');
  searchResults = signal<any>(null);
  searching = signal(false);
  searchError = signal<string | null>(null);

  onFileSelected(event: any) {
    this.policyFile.set(event.target.files[0]);
  }

  uploadPolicy() {
    const file = this.policyFile();
    if (file) {
      this.uploading.set(true);
      this.chunks.set([]);
      this.customerRetentionService.uploadPolicyFile(file).subscribe({
        next: (res: any) => {
          this.chunks.set(res);
          this.uploading.set(false);
        },
        error: (err) => {
          this.uploading.set(false);
        }
      });
    }
  }

  searchPolicy() {
    if (!this.searchQuery()) {
      return;
    }
    this.searching.set(true);
    this.searchError.set(null);
    this.searchResults.set(null);
    this.customerRetentionService.searchPolicy(this.searchQuery()).subscribe({
      next: (res) => {
        this.searchResults.set(res);
        this.searching.set(false);
      },
      error: (err) => {
        this.searchError.set('Failed to search policies');
        this.searching.set(false);
      }
    });
  }
}

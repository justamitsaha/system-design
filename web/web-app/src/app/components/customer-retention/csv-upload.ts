import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerRetentionService } from '../../services/customer-retention.service';

@Component({
  selector: 'app-csv-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './csv-upload.html',
  styleUrl: './csv-upload.scss'
})
export class CsvUpload {
  private customerRetentionService = inject(CustomerRetentionService);

  customerFile = signal<File | null>(null);
  churnFile = signal<File | null>(null);
  saveOnlyFile = signal<File | null>(null);
  response = signal<string[]>([]);
  uploading = signal(false);

  onCustomerFileSelected(event: any) {
    this.customerFile.set(event.target.files[0]);
  }

  onChurnFileSelected(event: any) {
    this.churnFile.set(event.target.files[0]);
  }

  onSaveOnlyFileSelected(event: any) {
    this.saveOnlyFile.set(event.target.files[0]);
  }

  uploadCustomerFile() {
    const file = this.customerFile();
    if (file) {
      this.uploadAndStream('/upload/customer', file);
    }
  }

  uploadChurnFile() {
    const file = this.churnFile();
    if (file) {
      this.uploadAndStream('/upload/churn', file);
    }
  }

  saveFileOnly() {
    const file = this.saveOnlyFile();
    if (file) {
      this.response.set(['Saving file...']);
      this.uploading.set(true);
      this.customerRetentionService.uploadFile('/upload/save-only', file)
        .subscribe({
          next: (res: any) => {
            this.response.set([res.body]);
            this.uploading.set(false);
          },
          error: (err) => {
            this.response.set(['Save failed']);
            this.uploading.set(false);
          }
        });
    }
  }

  private uploadAndStream(endpoint: string, file: File) {
    this.response.set(['Uploading...']);
    this.uploading.set(true);

    const onChunk = (chunk: string) => {
      // Process SSE chunk
      chunk.split('\n\n').forEach(event => {
        if (event.startsWith('data:')) {
          const json = event.replace('data:', '').trim();
          if (json) {
            this.response.update(prev => {
              if (prev[0] === 'Uploading...') {
                return [json];
              }
              return [...prev, json];
            });
          }
        }
      });
    };

    const onComplete = () => {
      this.response.update(prev => [...prev, '✔ Completed']);
      this.uploading.set(false);
    };

    const onError = (error: any) => {
      this.response.update(prev => [...prev, `✖ Error: ${error.message}`]);
      this.uploading.set(false);
    };

    this.customerRetentionService.uploadAndStream(endpoint, file, onChunk, onComplete, onError);
  }
}

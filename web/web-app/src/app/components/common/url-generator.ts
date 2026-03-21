import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-url-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card mb-4">
      <div class="card-header bg-light d-flex justify-content-between align-items-center" (click)="isCollapsed.set(!isCollapsed())" style="cursor: pointer">
        <h5 class="mb-0 fs-6">Dynamic URL Generator</h5>
        <span class="badge bg-secondary">{{ isCollapsed() ? '+' : '-' }}</span>
      </div>
      
      @if (!isCollapsed()) {
        <div class="card-body">
          <div class="input-group input-group-sm mb-3">
            <input type="text" class="form-control" [ngModel]="host()" (ngModelChange)="host.set($event)" placeholder="http://localhost">
            <button class="btn btn-outline-secondary" type="button" (click)="host.set('http://localhost')">Reset</button>
          </div>

          <div class="list-group">
            @for (entry of urlMap() | keyvalue; track entry.key) {
              <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2">
                <div class="text-truncate me-2" style="max-width: 80%">
                  <div class="fw-bold small">{{ entry.key }}</div>
                  <div class="text-muted font-monospace" style="font-size: 0.75rem">{{ host() }}{{ entry.value }}</div>
                </div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" (click)="copyUrl(host() + entry.value)">
                    Copy
                  </button>
                  <button class="btn btn-outline-secondary" (click)="openUrl(host() + entry.value)">
                    Open
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .font-monospace { font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  `]
})
export class UrlGenerator {
  urlMap = input.required<Record<string, any>>();
  host = signal('http://localhost');
  isCollapsed = signal(false);

  copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    // Could add a toast here
  }

  openUrl(url: string) {
    window.open(url, '_blank');
  }
}

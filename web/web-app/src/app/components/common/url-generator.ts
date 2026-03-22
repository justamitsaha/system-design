import { Component, input, signal, computed } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-url-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card mb-4 border-0 shadow-sm overflow-hidden">
      <div class="card-header bg-white border-bottom-0 py-3 d-flex justify-content-between align-items-center" 
           (click)="isCollapsed.set(!isCollapsed())" style="cursor: pointer">
        <h5 class="mb-0 fs-6 fw-bold">Dynamic URL Generator</h5>
        <i class="bi" [class.bi-chevron-down]="isCollapsed()" [class.bi-chevron-up]="!isCollapsed()"></i>
      </div>
      
      @if (!isCollapsed()) {
        <div class="card-body pt-0">
          <div class="input-group input-group-sm mb-4 bg-light p-2 rounded">
            <input type="text" class="form-control border-0 bg-transparent" 
                   [ngModel]="host()" (ngModelChange)="host.set($event)" 
                   placeholder="http://localhost">
            <button class="btn btn-link text-decoration-none text-muted btn-sm" type="button" (click)="host.set('http://localhost')">Reset</button>
          </div>

          <div class="row g-2">
            @for (entry of urlMap() | keyvalue: originalOrder; track entry.key) {
              <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="p-3 rounded border bg-light h-100 d-flex flex-column justify-content-between">
                  <div class="mb-2">
                    <div class="fw-bold small text-dark opacity-75 mb-1">{{ entry.key }}</div>
                    <div class="text-muted font-monospace text-truncate" style="font-size: 0.7rem">
                      {{ host() }}{{ entry.value }}
                    </div>
                  </div>
                  <div class="d-flex gap-1 mt-auto">
                    <button class="btn btn-white btn-sm border flex-grow-1 py-1" (click)="copyUrl(host() + entry.value)">
                      <i class="bi bi-copy me-1"></i> Copy
                    </button>
                    <button class="btn btn-white btn-sm border py-1" (click)="openUrl(host() + entry.value)">
                      <i class="bi bi-box-arrow-up-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .btn-white { background: white; color: #444; }
    .btn-white:hover { background: #f8f9fa; }
    .font-monospace { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    .bi-chevron-down, .bi-chevron-up { font-size: 0.8rem; transition: transform 0.2s; }
  `]
})
export class UrlGenerator {
  urlMap = input.required<Record<string, any>>();
  host = signal('http://localhost');
  isCollapsed = signal(true);

  // Maintain original order from JSON
  originalOrder = (a: KeyValue<string, any>, b: KeyValue<string, any>): number => 0;

  copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  openUrl(url: string) {
    window.open(url, '_blank');
  }
}

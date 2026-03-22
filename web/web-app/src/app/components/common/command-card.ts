import { Component, input, signal, computed } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { CommandSection } from '../../services/command-hub.service';

@Component({
  selector: 'app-command-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card mb-3 border-0 shadow-sm overflow-hidden bg-white">
      <div class="card-header bg-white border-bottom-0 py-2 px-3 d-flex justify-content-between align-items-center" 
           (click)="isCollapsed.set(!isCollapsed())" style="cursor: pointer">
        <div class="text-truncate me-2">
          <h5 class="mb-0 fw-bold text-dark small text-truncate">{{ section().title }}</h5>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-light text-muted fw-normal" style="font-size: 0.65rem">{{ commandCount() }}</span>
          <i class="bi" [class.bi-chevron-down]="isCollapsed()" [class.bi-chevron-up]="!isCollapsed()" style="font-size: 0.7rem"></i>
        </div>
      </div>

      @if (!isCollapsed()) {
        <div class="card-body pt-0 px-3 pb-3">
          <div class="row g-2">
            @for (cmd of section().commands | keyvalue: originalOrder; track cmd.key) {
              <div class="col-xxl-2 col-xl-3 col-lg-4 col-md-6 col-12">
                <div class="p-2 border rounded-2 h-100 d-flex flex-column hover-card bg-white">
                  <div class="mb-1">
                    <span class="fw-bold text-dark opacity-75 text-truncate d-block" style="font-size: 0.7rem" [title]="cmd.key">
                      {{ cmd.key }}
                    </span>
                  </div>
                  <div class="mt-auto">
                    <div class="d-flex align-items-center gap-2 px-2 py-1 bg-code rounded-1 clickable-code" 
                         [title]="'Click to copy: ' + cmd.value"
                         (click)="copy(cmd.value, cmd.key, $event)">
                      <code class="text-code-light font-monospace border-0 text-nowrap overflow-hidden text-truncate flex-grow-1" 
                            style="font-size: 0.7rem">
                        {{ cmd.value }}
                      </code>
                      <i class="bi shrink-0" 
                         [class.bi-check2]="copiedKey() === cmd.key"
                         [class.bi-copy]="copiedKey() !== cmd.key"
                         [class.text-success]="copiedKey() === cmd.key"
                         [class.text-muted]="copiedKey() !== cmd.key"
                         style="font-size: 0.75rem"></i>
                    </div>
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
    .bg-code { background-color: #1e1e2e !important; }
    .text-code-light { color: #cdd6f4 !important; }
    .font-monospace { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    
    .hover-card:hover { border-color: #ced4da !important; background-color: #fcfcfc !important; }
    
    .clickable-code { cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
    .clickable-code:hover { border-color: #444; }
    .clickable-code:active { opacity: 0.7; }
    
    .shrink-0 { flex-shrink: 0; }
    .text-nowrap { white-space: nowrap !important; }
    .overflow-hidden { overflow: hidden !important; }
    .text-truncate { text-overflow: ellipsis !important; }
  `]
})
export class CommandCard {
  section = input.required<CommandSection>();
  isCollapsed = signal(false);
  copiedKey = signal<string | null>(null);

  commandCount = computed(() => Object.keys(this.section().commands || {}).length);
  originalOrder = (a: KeyValue<string, any>, b: KeyValue<string, any>): number => 0;

  copy(val: string, key: string, event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(val).then(() => {
      this.copiedKey.set(key);
      setTimeout(() => {
        if (this.copiedKey() === key) {
          this.copiedKey.set(null);
        }
      }, 2000);
    });
  }
}

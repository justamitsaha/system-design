import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommandSection } from '../../services/command-hub.service';

@Component({
  selector: 'app-command-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card mb-4">
      <div class="card-header bg-light d-flex justify-content-between align-items-center" (click)="isCollapsed.set(!isCollapsed())" style="cursor: pointer">
        <div>
          <h5 class="mb-0 fs-6">{{ section().title }}</h5>
          @if (section().description) {
            <small class="text-muted">{{ section().description }}</small>
          }
        </div>
        <span class="badge bg-secondary">{{ isCollapsed() ? '+' : '-' }}</span>
      </div>

      @if (!isCollapsed()) {
        <div class="card-body">
          <div class="row g-2">
            @for (cmd of section().commands | keyvalue; track cmd.key) {
              <div class="col-12">
                <div class="p-2 border rounded bg-light">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold small text-primary">{{ cmd.key }}</span>
                    <button class="btn btn-sm btn-outline-secondary py-0" style="font-size: 0.7rem" (click)="copy(cmd.value)">
                      Copy
                    </button>
                  </div>
                  <code class="d-block p-2 bg-dark text-light rounded small text-break">
                    {{ cmd.value }}
                  </code>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class CommandCard {
  section = input.required<CommandSection>();
  isCollapsed = signal(false);

  copy(val: string) {
    navigator.clipboard.writeText(val);
  }
}

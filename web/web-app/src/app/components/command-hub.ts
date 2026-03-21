import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommandHubService, TabConfig, AppData } from '../services/command-hub.service';
import { CommandCard } from './common/command-card';

@Component({
  selector: 'app-command-hub',
  standalone: true,
  imports: [CommonModule, CommandCard],
  template: `
    <div class="container-fluid mt-4 px-4">
      <h2 class="mb-4">CommandHub</h2>

      @if (service.loadingTabs()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading tabs...</span>
          </div>
        </div>
      } @else {
        <!-- Tabs Navigation -->
        <ul class="nav nav-tabs mb-4">
          @for (tab of service.tabs(); track tab.id) {
            <li class="nav-item">
              <button 
                class="nav-link" 
                [class.active]="selectedTabId() === tab.id"
                (click)="selectTab(tab.id)"
              >
                {{ tab.label }}
              </button>
            </li>
          }
        </ul>

        @if (loadingData()) {
          <div class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-secondary" role="status">
              <span class="visually-hidden">Loading data...</span>
            </div>
          </div>
        } @else if (error()) {
          <div class="alert alert-danger">{{ error() }}</div>
        } @else if (data(); as appData) {
          <div class="row g-4">
            <!-- Main Content for Command Cards (Full Width) -->
            <div class="col-12">
              <div class="row g-3">
                @for (section of appData.commandSections; track section.title) {
                  <div class="col-xxl-3 col-xl-4 col-lg-6 col-md-12">
                    <app-command-card [section]="section" />
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class CommandHub {
  service = inject(CommandHubService);
  selectedTabId = signal<string | null>(null);
  data = signal<AppData | null>(null);
  loadingData = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Select first tab once tabs are loaded
    effect(() => {
      const tabs = this.service.tabs();
      if (tabs.length > 0 && !this.selectedTabId()) {
        this.selectTab(tabs[0].id);
      }
    }, { allowSignalWrites: true });
  }

  selectTab(tabId: string) {
    this.selectedTabId.set(tabId);
    this.loadTabData(tabId);
  }

  private loadTabData(tabId: string) {
    this.loadingData.set(true);
    this.error.set(null);
    this.service.getTabData(tabId).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loadingData.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to load data for ${tabId}`);
        this.loadingData.set(false);
      }
    });
  }
}

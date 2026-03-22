import { Component, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandHubService, TabConfig, AppData, CommandSection } from '../services/command-hub.service';
import { UrlGenerator } from './common/url-generator';
import { CommandCard } from './common/command-card';

@Component({
  selector: 'app-command-hub',
  standalone: true,
  imports: [CommonModule, UrlGenerator, CommandCard, FormsModule],
  template: `
    <div class="command-hub-container mt-3 px-3 pb-5">
      
      @if (service.loadingTabs()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading tabs...</span>
          </div>
        </div>
      } @else {
        <div class="d-flex flex-wrap gap-3 align-items-center mb-3">
          <!-- Navigation Pills -->
          <div class="nav-pills-container overflow-auto">
            <div class="d-flex gap-2">
              @for (tab of service.tabs(); track tab.id) {
                <button 
                  class="btn btn-pill" 
                  [class.active]="selectedTabId() === tab.id"
                  (click)="selectTab(tab.id)"
                >
                  {{ tab.label }}
                </button>
              }
            </div>
          </div>

          <!-- Compact Search Bar -->
          <div class="search-container flex-grow-1 position-relative">
            <i class="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted small"></i>
            <input 
              type="text" 
              class="form-control form-control-sm ps-5 border-0 shadow-sm rounded-2" 
              [ngModel]="searchTerm()" 
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Filter commands..."
              style="height: 34px; font-size: 0.85rem;"
            >
            @if (searchTerm()) {
              <button class="btn btn-sm btn-link position-absolute top-50 end-0 translate-middle-y me-1 text-muted text-decoration-none" 
                      (click)="searchTerm.set('')">
                <i class="bi bi-x-lg" style="font-size: 0.7rem"></i>
              </button>
            }
          </div>
        </div>

        @if (loadingData()) {
          <div class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-secondary" role="status">
              <span class="visually-hidden">Loading data...</span>
            </div>
          </div>
        } @else if (error()) {
          <div class="alert alert-danger py-2 px-3 small rounded-2 border-0 shadow-sm">{{ error() }}</div>
        } @else if (data(); as appData) {
          
          <!-- Dynamic URL Generator -->
          @if (appData.urlMap && (appData.urlMap | keyvalue).length > 0) {
            <app-url-generator [urlMap]="appData.urlMap" />
          }

          <!-- Command Sections -->
          <div class="command-sections">
            @for (section of filteredSections(); track section.title) {
              <app-command-card [section]="section" />
            } @empty {
              <div class="text-center py-5 opacity-50">
                <i class="bi bi-search fs-4 mb-2 d-block"></i>
                <p class="small">No commands found matching "{{ searchTerm() }}"</p>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .command-hub-container { max-width: 100%; margin: 0 auto; }
    .btn-pill { 
      background: #f1f3f5; 
      border: none; 
      border-radius: 6px; 
      padding: 4px 12px; 
      font-size: 0.8rem; 
      color: #495057;
      transition: all 0.2s;
    }
    .btn-pill:hover { background: #e9ecef; }
    .btn-pill.active { background: #212529; color: white; }
    
    .search-container input:focus { box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important; }
    
    .nav-pills-container::-webkit-scrollbar { height: 0px; }
  `]
})
export class CommandHub {
  service = inject(CommandHubService);
  selectedTabId = signal<string | null>(null);
  data = signal<AppData | null>(null);
  loadingData = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');

  filteredSections = computed(() => {
    const currentData = this.data();
    if (!currentData) return [];
    
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return currentData.commandSections;

    return currentData.commandSections.map(section => {
      if (section.title.toLowerCase().includes(term)) return section;

      const filteredCommands = Object.entries(section.commands).reduce((acc, [name, val]) => {
        if (name.toLowerCase().includes(term) || val.toLowerCase().includes(term)) {
          acc[name] = val;
        }
        return acc;
      }, {} as Record<string, string>);

      if (Object.keys(filteredCommands).length > 0) {
        return { ...section, commands: filteredCommands };
      }
      return null;
    }).filter(s => s !== null) as CommandSection[];
  });

  constructor() {
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

import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TabConfig {
  id: string;
  label: string;
  dataFile: string;
}

export interface CommandSection {
  title: string;
  description?: string;
  commands: Record<string, string>;
}

export interface AppData {
  urlMap: Record<string, string>;
  commandSections: CommandSection[];
}

@Injectable({
  providedIn: 'root'
})
export class CommandHubService {
  private http = inject(HttpClient);
  private readonly GITHUB_RAW_BASE = environment.commandHubBaseUrl;

  tabs = signal<TabConfig[]>([]);
  loadingTabs = signal(true);

  constructor() {
    this.fetchTabs();
  }

  private fetchTabs() {
    this.http.get<{ tabs: TabConfig[] }>(`${this.GITHUB_RAW_BASE}/tabs.json`)
      .pipe(
        catchError(err => {
          console.warn('Failed to fetch tabs config, using defaults:', err);
          return of({
            tabs: [
              { id: 'kubernetes', label: 'Kubernetes', dataFile: 'kubernetes.json' },
              { id: 'docker', label: 'Docker', dataFile: 'docker.json' },
              { id: 'git', label: 'Git', dataFile: 'git.json' },
              { id: 'linux', label: 'Linux', dataFile: 'linux.json' },
            ]
          });
        })
      )
      .subscribe(data => {
        this.tabs.set(data.tabs);
        this.loadingTabs.set(false);
      });
  }

  getTabData(tabId: string): Observable<AppData> {
    return this.http.get<AppData>(`${this.GITHUB_RAW_BASE}/${tabId}.json`);
  }
}

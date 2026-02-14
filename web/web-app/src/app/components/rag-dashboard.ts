import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { RagService, RagDocument, Chunk, SearchResult, AskResponse } from '../services/rag.service';
import { BootstrapCard } from './common/bootstrap-card';
import { ChunkList } from './common/chunk-list';

@Component({
  selector: 'app-rag-dashboard',
  standalone: true,
  imports: [FormsModule, JsonPipe, BootstrapCard, ChunkList],
  templateUrl: './rag-dashboard.html',
  styleUrl: './rag-dashboard.scss',
})
export class RagDashboard {
  private ragService = inject(RagService);

  // Data Signals
  documents = signal<RagDocument[]>([]);
  allChunks = signal<Chunk[]>([]);
  searchResults = signal<SearchResult[]>([]);
  askResponse = signal<AskResponse | null>(null);

  // Form Signals
  searchQuery = signal('');
  topK = signal(5);
  selectedDocId = signal('');
  askQuestion = signal('');
  chunkFilter = signal('');

  // UI State Signals
  isUploading = signal(false);
  uploadStatus = signal('');
  isSearching = signal(false);
  isAsking = signal(false);
  showAllChunks = signal(false);

  // Computed
  filteredChunks = computed(() => {
    const q = this.chunkFilter().toLowerCase();
    const chunks = this.allChunks();
    if (!q) return chunks;
    return chunks.filter(c => (c.text || '').toLowerCase().includes(q));
  });

  displayedChunks = computed(() => {
    const chunks = this.filteredChunks();
    return this.showAllChunks() ? chunks : chunks.slice(0, 20);
  });

  constructor() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.ragService.getDocuments().subscribe({
      next: (docs) => this.documents.set(docs),
      error: () => console.error('Failed to load documents')
    });
  }

  async onUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.isUploading.set(true);
    this.uploadStatus.set('Uploading and streaming...');
    this.allChunks.set([]);

    try {
      await this.ragService.uploadAndStream(file, (chunk) => {
        this.allChunks.update(prev => [...prev, chunk]);
      });
      this.uploadStatus.set('✔ Streaming completed');
      this.loadDocuments();
    } catch (err) {
      this.uploadStatus.set('Failed to upload');
    } finally {
      this.isUploading.set(false);
    }
  }

  clearChunks() {
    this.allChunks.set([]);
    this.uploadStatus.set('Cleared.');
  }

  toggleShowAll() {
    this.showAllChunks.update(v => !v);
  }

  onSearch() {
    if (!this.searchQuery()) return;

    this.isSearching.set(true);
    this.ragService.search(this.searchQuery(), this.topK()).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      },
      error: () => {
        this.searchResults.set([]);
        this.isSearching.set(false);
      }
    });
  }

  onAsk() {
    if (!this.selectedDocId() || !this.askQuestion()) return;

    this.isAsking.set(true);
    this.ragService.askDocument(this.selectedDocId(), this.askQuestion()).subscribe({
      next: (res) => {
        this.askResponse.set(res);
        this.isAsking.set(false);
      },
      error: () => {
        this.askResponse.set(null);
        this.isAsking.set(false);
      }
    });
  }
}

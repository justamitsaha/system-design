import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RagDocument {
    id: string;
    fileName: string;
    documentType: string;
}

export interface Chunk {
    index?: number;
    text: string;
    score?: number;
    fileName?: string;
    documentId?: string;
    chunkIndex?: number;
    chunkText?: string;
}

export interface SearchResult {
    fileName: string;
    score: number;
    documentId: string;
    chunkIndex: number;
    chunkText: string;
}

export interface AskResponse {
    answer: string;
    sources: Chunk[];
}

@Injectable({ providedIn: 'root' })
export class RagService {
    private http = inject(HttpClient);
    private readonly BASE_URL = 'http://localhost:8081';

    getDocuments() {
        return this.http.get<RagDocument[]>(`${this.BASE_URL}/rag/documents`);
    }

    async uploadAndStream(file: File, onChunk: (chunk: any) => void): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.BASE_URL}/rag/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            buffer += text;

            const parts = buffer.split('\n\n');
            buffer = parts.pop() || ''; // Keep incomplete part

            for (const part of parts) {
                if (part.startsWith('data:')) {
                    const json = part.replace('data:', '').trim();
                    if (json) {
                        try {
                            onChunk(JSON.parse(json));
                        } catch (e) {
                            console.error('Parse error', e);
                        }
                    }
                }
            }
        }
    }

    search(query: string, topK: number) {
        return this.http.get<SearchResult[]>(`${this.BASE_URL}/rag/search`, {
            params: { q: query, topK: topK.toString() }
        });
    }

    askDocument(documentId: string, question: string) {
        return this.http.post<AskResponse>(`${this.BASE_URL}/rag/${documentId}/ask`, { question });
    }
}
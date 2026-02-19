import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerRetentionService {

  private baseUrl = 'http://localhost:8080';
  private reportingUrl = 'http://localhost:8081';

  constructor(private http: HttpClient) { }

  uploadFile(endpoint: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}${endpoint}`, formData, { responseType: 'text' });
  }

  uploadAndStream(endpoint: string, file: File, onChunk: (chunk: string) => void, onComplete: () => void, onError: (error: any) => void, useReportingUrl = false) {
    const formData = new FormData();
    formData.append('file', file);
    const url = useReportingUrl ? this.reportingUrl : this.baseUrl;

    fetch(`${url}${endpoint}`, {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');

        if (reader) {
          const read = () => {
            reader.read().then(({ value, done }) => {
              if (done) {
                onComplete();
                return;
              }
              const chunk = decoder.decode(value, { stream: true });
              onChunk(chunk);
              read();
            }).catch(error => {
              onError(error);
            });
          };
          read();
        }
      })
      .catch(error => {
        onError(error);
      });
  }

  analyzeRetention(customerId: string): Observable<any> {
    return this.http.get(`${this.reportingUrl}/retention/${customerId}/analyze`);
  }

  getCustomers(page: number, size: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/customerProfile/customers?page=${page}&size=${size}`, { responseType: 'text' })
      .pipe(
        map(res => this.handleFluxResponse(res)),
        catchError(err => {
          console.error('Error fetching customers:', err);
          throw err;
        })
      );
  }

  getChurnData(page: number, size: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/customerProfile/customersChurn?page=${page}&size=${size}`, { responseType: 'text' })
      .pipe(
        map(res => this.handleFluxResponse(res)),
        catchError(err => {
          console.error('Error fetching churn data:', err);
          throw err;
        })
      );
  }

  private handleFluxResponse(res: string): any {
    if (!res || res.trim() === '') {
      return { content: [], last: true, first: true, number: 0, totalPages: 0 };
    }

    // 1. Try standard JSON first
    try {
      const parsed = JSON.parse(res);
      if (parsed && typeof parsed === 'object' && 'content' in parsed) {
        return parsed;
      }
      if (Array.isArray(parsed)) {
        return {
          content: parsed,
          last: true,
          first: true,
          number: 0,
          totalPages: 1
        };
      }
      return { content: [parsed], last: true, first: true, number: 0, totalPages: 1 };
    } catch (e) {
      // 2. Try NDJSON or concatenated JSON
      const items: any[] = [];
      try {
        let braceCount = 0;
        let start = -1;
        for (let i = 0; i < res.length; i++) {
          if (res[i] === '{') {
            if (braceCount === 0) start = i;
            braceCount++;
          } else if (res[i] === '}') {
            braceCount--;
            if (braceCount === 0 && start !== -1) {
              try {
                items.push(JSON.parse(res.substring(start, i + 1)));
              } catch (parseErr) {
                // Ignore individual parse errors
              }
              start = -1;
            }
          }
        }

        if (items.length > 0) {
          return {
            content: items,
            last: true,
            first: true,
            number: 0,
            totalPages: 1
          };
        }
      } catch (e2) {
        console.error('Failed to parse response as JSON, NDJSON or concatenated JSON', e);
        throw e;
      }
    }
    return { content: [], last: true, first: true, number: 0, totalPages: 0 };
  }

  cleanup(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/customerProfile/cleanup`);
  }

  getCustomerProfile(customerId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/customerProfile/${customerId}`, { responseType: 'text' })
      .pipe(
        map(res => {
          const parsed = this.handleFluxResponse(res);
          return parsed.content && parsed.content.length > 0 ? parsed.content[0] : parsed;
        }),
        catchError(err => {
          console.error('Error fetching customer profile:', err);
          throw err;
        })
      );
  }

  uploadPolicyStream(file: File, onChunk: (chunk: string) => void, onComplete: () => void, onError: (error: any) => void) {
    this.uploadAndStream('/retention/policy', file, onChunk, onComplete, onError, true);
  }

  uploadPolicyFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.reportingUrl}/retention/policyUpload`, formData);
  }

  searchPolicy(query: string): Observable<any> {
    return this.http.get(`${this.reportingUrl}/retention/policySearch?query=${query}`);
  }

  analyzeRetentionWithRag(customerId: string): Observable<any> {
    return this.http.get(`${this.reportingUrl}/retention/${customerId}/analyze/rag`);
  }
}

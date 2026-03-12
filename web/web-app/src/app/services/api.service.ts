import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email?: string;
  created_at: string;
}

export interface Topic {
  id: number;
  name: string;
  parent_topic_id?: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface MCQOption {
  option_text: string;
  is_correct: boolean;
}

export interface AttemptSummary {
  count: number;
  last_score: number | null;
  last_is_correct?: boolean | null;
}

export interface Question {
  id: number;
  topic_id: number;
  question_text: string;
  type: 'MCQ' | 'OPEN';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options?: MCQOption[];
  tags?: Tag[];
  reference_answer?: string;
  attempt_summary?: AttemptSummary;
}

export interface Attempt {
  id: number;
  user_id: number;
  question_id: number;
  user_answer: string;
  score: number;
  is_correct: boolean;
  evaluation_json?: any;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000';

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users/`);
  }

  createUser(username: string, email?: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users/`, { username, email });
  }

  // Topics
  getTopics(): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.baseUrl}/topics/`);
  }

  createTopic(name: string, parent_topic_id?: number): Observable<Topic> {
    return this.http.post<Topic>(`${this.baseUrl}/topics/`, { name, parent_topic_id });
  }

  updateTopic(id: number, name: string, parent_topic_id?: number): Observable<Topic> {
    return this.http.put<Topic>(`${this.baseUrl}/topics/${id}`, { name, parent_topic_id });
  }

  deleteTopic(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/topics/${id}`);
  }

  // Questions
  generateQuestion(topic_id: number, type: string, difficulty: string, user_id?: number): Observable<Question> {
    let url = `${this.baseUrl}/questions/generate?`;
    if (user_id) url += `user_id=${user_id}`;
    return this.http.post<Question>(url, { topic_id, type, difficulty });
  }

  createManualQuestion(question: any): Observable<Question> {
    return this.http.post<Question>(`${this.baseUrl}/questions/`, question);
  }

  getRandomQuestion(topic_id?: number, difficulty?: string, tags?: string[], user_id?: number): Observable<Question> {
    let url = `${this.baseUrl}/questions/random/?`;
    if (topic_id) url += `topic_id=${topic_id}&`;
    if (difficulty) url += `difficulty=${difficulty}&`;
    if (user_id) url += `user_id=${user_id}&`;
    if (tags && tags.length > 0) {
      tags.forEach(t => url += `tags=${t}&`);
    }
    return this.http.get<Question>(url);
  }

  updateQuestionTags(question_id: number, tags: string[]): Observable<Question> {
    return this.http.post<Question>(`${this.baseUrl}/questions/${question_id}/tags`, { tags });
  }

  updateQuestionAnswer(question_id: number, reference_answer: string): Observable<Question> {
    return this.http.put<Question>(`${this.baseUrl}/questions/${question_id}/answer`, { reference_answer });
  }

  // Tags
  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.baseUrl}/tags/`);
  }

  // Attempts
  submitAttempt(user_id: number, question_id: number, user_answer: string, time_taken_seconds?: number, is_correct?: boolean): Observable<Attempt> {
    return this.http.post<Attempt>(`${this.baseUrl}/attempts/submit`, { user_id, question_id, user_answer, time_taken_seconds, is_correct });
  }

  // Analytics
  getPerformance(topic_id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/performance/${topic_id}`);
  }
}

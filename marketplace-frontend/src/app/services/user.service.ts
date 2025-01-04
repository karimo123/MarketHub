import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  registerUser(user: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.baseUrl}/register`, user, { headers });
  }

  getUserCredits(supabaseUserId: string): Observable<{ credits: number }> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<{ credits: number }>(`${this.baseUrl}/supabase/${supabaseUserId}/credits`, { headers });
  }

  getUserRole(supabaseUserId: string): Observable<{ role: string }> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<{ role: string }>(`${this.baseUrl}/supabase/${supabaseUserId}/role`, { headers });
  }

  getUserId(supabaseUserId: string): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(`${this.baseUrl}/supabase/${supabaseUserId}`, { headers });
  }
}

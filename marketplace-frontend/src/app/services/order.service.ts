import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private baseUrl = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) {}

  getOrdersForSeller(): Observable<any[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(`${this.baseUrl}/seller/orders`, { headers });
  }

  getOrdersForBuyer(): Observable<any[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(`${this.baseUrl}/buyer/orders`, { headers });
  }
}

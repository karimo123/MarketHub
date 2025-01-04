import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private baseUrl = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  createProduct(product: any): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(this.baseUrl, product, { headers });
  }

  getSellerProducts(): Observable<any[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any[]>(`${this.baseUrl}/seller`, { headers });
  }

  deleteProduct(productId: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(`${this.baseUrl}/${productId}`, { headers });
  }

  updateProduct(id: number, product: any): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(`${this.baseUrl}/${id}`, product, { headers });
  }

  filterProducts(search?: string): Observable<any[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any[]>(`${this.baseUrl}/filter`, { params });
  }

  sortProducts(sortBy: string, order: string): Observable<any[]> {
    const params = new HttpParams()
      .set('sortBy', sortBy)
      .set('order', order);
  
    return this.http.get<any[]>(`${this.baseUrl}/sort`, { params });
  }

  purchaseProduct(productId: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${this.baseUrl}/${productId}/purchase`, {}, { headers });
  }
  
}

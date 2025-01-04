import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private baseUrl = `${environment.apiBaseUrl}/cart`;

  constructor(private http: HttpClient) {}

  addToCart(productId: number, quantity: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    console.log("product id", productId);
    return this.http.post(this.baseUrl, { productId, quantity }, { headers });
  }

  getCartItems(userId: number): Observable<any[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any[]>(`${this.baseUrl}/${userId}`, { headers });
  }
  
  removeFromCart(cartItemId: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete(`${this.baseUrl}/${cartItemId}`, { headers });
  }

  checkoutCart(): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${this.baseUrl}/checkout`, {}, { headers });
  }

  updateCartQuantity(cartItemId: number, quantity: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    return this.http.put(`${this.baseUrl}/${cartItemId}`, quantity, { headers });
  }
}

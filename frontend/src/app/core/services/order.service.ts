// src/app/core/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, OrderRequest, OrderStatusUpdateRequest } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) { }

  // Get all orders (admin only)
  getAllOrders(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Get order by ID
  getOrderById(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }

  // Get orders by customer ID
  getOrdersByCustomerId(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customer`);
  }

  // // Get current user's orders
  // getMyOrders(): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}/my-orders`);
  // }

  // Get orders by restaurant ID
  getOrdersByRestaurantId(restaurantId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/restaurant/${restaurantId}`);
  }

  // Create a new order
  createOrder(orderRequest: OrderRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, orderRequest);
  }

  // Update order status (restaurant admin)
  updateOrderStatus(orderId: number, statusRequest: OrderStatusUpdateRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/status`, statusRequest);
  }

  // Cancel an order
  cancelOrder(orderId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/cancel`, {});
  }
}

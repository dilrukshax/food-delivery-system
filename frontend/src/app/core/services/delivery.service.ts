// src/app/core/services/delivery.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = `${environment.apiUrl}/api/deliveries`;
  private currentDeliverySubject = new BehaviorSubject<any>(null);
  public currentDelivery = this.currentDeliverySubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if there's any active delivery in localStorage
    const savedDelivery = localStorage.getItem('currentDelivery');
    if (savedDelivery) {
      this.currentDeliverySubject.next(JSON.parse(savedDelivery));
    }
  }

  // Get assigned deliveries for the driver (matches backend endpoint)
  getAssignedDeliveries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/driver/assigned`);
  }

  // Get deliveries by restaurant ID
  getDeliveriesByRestaurant(restaurantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/restaurant/${restaurantId}`);
  }

  // Get delivery by order ID
  getDeliveryByOrderId(orderId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/order/${orderId}`);
  }

  // Get active deliveries for customer
  getActiveDeliveriesForCustomer(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/customer/active`);
  }

  /// assign a delivery request
  assignDelivery(orderId: number, driverId: number, customerId: number, restaurantId: number, deliveryNotes: string = ''): Observable<any> {
    const payload = {
      orderId,
      driverId,
      customerId,
      restaurantId,
      deliveryNotes
    };

    console.log('Sending delivery payload:', payload);

    return this.http.post<any>(`${this.apiUrl}/assign`, payload)
  }

  // Mark order as picked up
  markOrderAsPickedUp(deliveryId: number, request: {
    deliveryStatus: string;
    currentLocation?: string;
    deliveryNotes?: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${deliveryId}/pickup`, request).pipe(
      tap(delivery => this.setCurrentDelivery(delivery))
    );
  }

  // Mark order as delivered
  markOrderAsDelivered(deliveryId: number, request: {
    deliveryStatus: string;
    currentLocation?: string;
    deliveryNotes?: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${deliveryId}/complete`, request).pipe(
      tap(delivery => {
        this.setCurrentDelivery(null);
        return delivery;
      })
    );
  }

  // Update delivery location with coordinates
  updateDeliveryLocation(deliveryId: number, request: {
    currentLocation: string;
    latitude: number;
    longitude: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${deliveryId}/location`, request);
  }

  // Get driver location for an order
  getDriverLocation(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/order/${orderId}/location`);
  }

  // Cancel delivery
  cancelDelivery(deliveryId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${deliveryId}/cancel`, {});
  }

  // Set current delivery in memory and localStorage
  setCurrentDelivery(delivery: any): void {
    this.currentDeliverySubject.next(delivery);
    if (delivery) {
      localStorage.setItem('currentDelivery', JSON.stringify(delivery));
    } else {
      localStorage.removeItem('currentDelivery');
    }
  }

  // Clear current delivery
  clearCurrentDelivery(): void {
    this.currentDeliverySubject.next(null);
    localStorage.removeItem('currentDelivery');
  }

  //get delivery by id
  getDeliveryById(deliveryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${deliveryId}`);
  }

  // Add to your delivery.service.ts
  getCompletedDeliveries(): Observable<any[]> {
    const url = `${this.apiUrl}/driver/complete`;
    return this.http.get<any[]>(url);
  }

}

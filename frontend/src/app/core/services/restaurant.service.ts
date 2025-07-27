// src/app/core/services/restaurant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models/restaurant.model';
import { MenuItem } from '../models/menu-item.model';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private apiUrl = `${environment.apiUrl}/api/restaurants`;

  constructor(private http: HttpClient) { }

  // Restaurant CRUD Operations
  getAllRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRestaurantById(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createRestaurant(restaurantData: any): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.apiUrl, restaurantData)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateRestaurant(id: number, restaurantData: any): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${this.apiUrl}/${id}`, restaurantData)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteRestaurant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Menu Item Operations
  getMenuItems(restaurantId: number): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}/${restaurantId}/menu-items`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getMenuItem(restaurantId: number, menuItemId: number): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createMenuItem(restaurantId: number, menuItemData: any): Observable<MenuItem> {
    return this.http.post<MenuItem>(
      `${this.apiUrl}/${restaurantId}/menu-items`,
      menuItemData
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateMenuItem(restaurantId: number, menuItemId: number, menuItemData: any): Observable<MenuItem> {
    return this.http.put<MenuItem>(
      `${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}`,
      menuItemData
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteMenuItem(restaurantId: number, menuItemId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Image Handling
  uploadRestaurantImage(restaurantId: number, file: File): Observable<Restaurant> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Restaurant>(
      `${this.apiUrl}/${restaurantId}/images`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteRestaurantImage(restaurantId: number, imageUrl: string): Observable<Restaurant> {
    const params = new HttpParams().set('imageUrl', imageUrl);
    return this.http.delete<Restaurant>(
      `${this.apiUrl}/${restaurantId}/images`,
      { params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  uploadMenuItemImage(restaurantId: number, menuItemId: number, file: File): Observable<MenuItem> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MenuItem>(
      `${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}/images`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteMenuItemImage(restaurantId: number, menuItemId: number, imageUrl: string): Observable<MenuItem> {
    const params = new HttpParams().set('imageUrl', imageUrl);
    return this.http.delete<MenuItem>(
      `${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}/images`,
      { params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error(
      error.error?.message || 'Server error occurred. Please try again later.'
    ));
  }
}

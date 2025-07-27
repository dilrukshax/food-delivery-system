// src/app/core/services/restaurant-admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RestaurantAdminService {
  private apiUrl = `${environment.apiUrl}/api/restaurants`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Restaurant endpoints
  getAllRestaurants(): Observable<any> {
    return this.http.get<any>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getRestaurantsByOwner(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/owner`)
      .pipe(catchError(this.handleError));
  }

  getRestaurantById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createRestaurant(restaurant: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, restaurant)
      .pipe(catchError(this.handleError));
  }

  updateRestaurant(id: number, restaurant: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, restaurant)
      .pipe(catchError(this.handleError));
  }

  deleteRestaurant(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Menu Item endpoints
  getMenuItems(restaurantId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${restaurantId}/menu-items`)
      .pipe(catchError(this.handleError));
  }

  getMenuItem(restaurantId: number, menuItemId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}`)
      .pipe(catchError(this.handleError));
  }

  createMenuItem(restaurantId: number, menuItem: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${restaurantId}/menu-items`, menuItem)
      .pipe(catchError(this.handleError));
  }

  updateMenuItem(restaurantId: number, menuItemId: number, menuItem: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}`, menuItem)
      .pipe(catchError(this.handleError));
  }

  deleteMenuItem(restaurantId: number, menuItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}`)
      .pipe(catchError(this.handleError));
  }

  // Image handling
  uploadRestaurantImage(restaurantId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/${restaurantId}/images`, formData)
      .pipe(catchError(this.handleError));
  }

  // deleteRestaurantImage(restaurantId: number, imageUrl: string): Observable<any> {
  //   return this.http.delete<any>(`${this.apiUrl}/${restaurantId}/images?imageUrl=${encodeURIComponent(imageUrl)}`)
  //     .pipe(catchError(this.handleError));
  // }

  uploadMenuItemImage(restaurantId: number, menuItemId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}/images`, formData)
      .pipe(catchError(this.handleError));
  }

// Update these methods to match your new backend endpoints
  deleteRestaurantImage(restaurantId: number, imageUrl: string): Observable<any> {
    // Convert imageUrl to ensure it's properly formatted for the path
    const encodedUrl = imageUrl.split('/').pop(); // Get just the filename
    return this.http.delete<any>(`${this.apiUrl}/${restaurantId}/images/${encodedUrl}`);
  }

  deleteMenuItemImage(restaurantId: number, menuItemId: number, imageUrl: string): Observable<any> {
    // Convert imageUrl to ensure it's properly formatted for the path
    const encodedUrl = imageUrl.split('/').pop(); // Get just the filename
    return this.http.delete<any>(`${this.apiUrl}/${restaurantId}/menu-items/${menuItemId}/images/${encodedUrl}`);
  }



  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => new Error(error.error?.message || 'Server error occurred'));
  }
}

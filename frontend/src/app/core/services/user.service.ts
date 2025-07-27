// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AzureStorageService } from './azure-storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(
    private http: HttpClient,
    private azureStorageService: AzureStorageService
  ) {}

  // Get current user profile
  getCurrentUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  // Update user profile
  updateUserProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData);
  }

  // Upload profile image
  uploadProfileImage(file: File): Observable<any> {
    return this.azureStorageService.uploadProfileImage(file);
  }

  // Get user addresses
  getUserAddresses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses`);
  }

  // Add new address
  addAddress(addressData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addresses`, addressData);
  }

  // Update address
  updateAddress(addressId: number, addressData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/addresses/${addressId}`, addressData);
  }

  // Delete address
  deleteAddress(addressId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/addresses/${addressId}`);
  }

  // Set default address
  setDefaultAddress(addressId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/addresses/${addressId}/default`, {});
  }

  // Get default address
  getDefaultAddress(): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses/default`);
  }

  //get all DELIVERY_DRIVER
  getAllDeliveryDrivers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/delivery-drivers`);
  }

  //get user address by addressid
  getUserAddressById(addressId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses/${addressId}`);
  }

  //get user by id
  getUserById(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }
}

// src/app/core/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) { }

  // Get all users with pagination
  getAllUsers(page: number = 0, size: number = 10, sortBy: string = 'id', direction: string = 'ASC'): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`);
  }

  // Get user by ID
  getUserById(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  // Get user by UUID
  getUserByUuid(uuid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/uuid/${uuid}`);
  }

  // Update user by admin
  updateUser(email: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${email}`, userData);
  }
}

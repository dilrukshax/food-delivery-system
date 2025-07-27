// src/app/core/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImageUrl: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiration: Date;
  restaurantId?: number; // Added restaurantId property
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<AuthUser | null>;
  public currentUser: Observable<AuthUser | null>;
  private refreshTokenTimeout: any;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<any>(`${environment.authApiUrl}/login`, { email, password })
      .pipe(
        map(response => {
          // Store user details and token in local storage
          const user = response.data;
          this.storeUserInStorage(user);
          this.currentUserSubject.next(user);
          this.startRefreshTokenTimer();
          return user;
        }),
        catchError(error => {
          return throwError(() => error?.error?.message || 'Login failed. Please try again.');
        })
      );
  }

  register(userDetails: any): Observable<AuthUser> {
    return this.http.post<any>(`${environment.authApiUrl}/register`, userDetails)
      .pipe(
        map(response => {
          // Store user details and token in local storage
          const user = response.data;
          this.storeUserInStorage(user);
          this.currentUserSubject.next(user);
          this.startRefreshTokenTimer();
          return user;
        }),
        catchError(error => {
          return throwError(() => error?.error?.message || 'Registration failed. Please try again.');
        })
      );
  }

  logout(): void {
    // Stop the token refresh timer
    this.stopRefreshTokenTimer();

    // If we have a refresh token, send it to the server to revoke it
    const refreshToken = this.currentUserValue?.refreshToken;
    if (refreshToken) {
      this.http.post<any>(`${environment.authApiUrl}/logout`, { refreshToken })
        .pipe(catchError(() => throwError(() => 'Logout failed')))
        .subscribe();
    }

    // Remove user from local storage
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.currentUserValue?.refreshToken;
    if (!refreshToken) {
      return throwError(() => 'No refresh token available');
    }

    return this.http.post<any>(`${environment.authApiUrl}/refresh-token`, { refreshToken })
      .pipe(
        map(response => {
          const user = response.data;
          this.storeUserInStorage(user);
          this.currentUserSubject.next(user);
          this.startRefreshTokenTimer();
          return user;
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  hasRole(roles: string[]): boolean {
    const userRole = this.currentUserValue?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  // New method to update restaurantId
  updateRestaurantId(restaurantId: number): void {
    if (!this.currentUserValue || !this.isBrowser) return;

    const updatedUser = {
      ...this.currentUserValue,
      restaurantId
    };

    this.storeUserInStorage(updatedUser);
    this.currentUserSubject.next(updatedUser);
  }

  private getUserFromStorage(): AuthUser | null {
    if (!this.isBrowser) {
      return null; // Return null when running on the server
    }

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Convert string date to Date object
      user.tokenExpiration = new Date(user.tokenExpiration);

      // If token is expired, remove from storage and return null
      if (user.tokenExpiration < new Date()) {
        localStorage.removeItem('currentUser');
        return null;
      }
      return user;
    }
    return null;
  }

  private storeUserInStorage(user: AuthUser): void {
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  private startRefreshTokenTimer(): void {
    if (!this.currentUserValue || !this.isBrowser) return;

    // Parse token expiration time
    const expires = new Date(this.currentUserValue.tokenExpiration);
    const timeout = expires.getTime() - Date.now() - (60 * 1000); // Refresh 1 minute before expiry

    if (timeout <= 0) {
      this.refreshToken().subscribe();
      return;
    }

    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken().subscribe();
    }, timeout);
  }

  private stopRefreshTokenTimer(): void {
    if (this.isBrowser) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  initialize(): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentUserValue) {
        resolve();
      } else {
        this.currentUserSubject.next(this.getUserFromStorage());
        resolve();
      }
    });
  }
}

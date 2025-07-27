// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Skip adding auth header for auth requests
  if (req.url.startsWith(`${environment.authApiUrl}/login`) ||
    req.url.startsWith(`${environment.authApiUrl}/register`) ||
    req.url.startsWith(`${environment.authApiUrl}/refresh-token`)) {
    return next(req);
  }

  // Add auth header if user is logged in
  const currentUser = authService.currentUserValue;
  if (currentUser?.accessToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${currentUser.accessToken}`
      }
    });
  }

  return next(req).pipe(
    catchError(error => {
      // Only attempt token refresh in browser environment
      if (isBrowser && error.status === 401 && !req.url.includes('/refresh-token')) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Update the request with the new token
            const newUser = authService.currentUserValue;
            if (newUser?.accessToken) {
              req = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newUser.accessToken}`
                }
              });
            }
            // Retry the original request
            return next(req);
          }),
          catchError(() => {
            // If refresh token fails, logout and go to login page
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

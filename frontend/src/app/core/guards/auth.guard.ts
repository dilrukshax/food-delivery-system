// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// src/app/core/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  if (route.data['roles'] && !authService.hasRole(route.data['roles'])) {
    router.navigate(['/restaurants']);
    return false;
  }

  // Check token expiration
  const user = authService.currentUserValue;
  if (user && new Date(user.tokenExpiration) < new Date()) {
    authService.logout();
    return false;
  }

  return true;
};


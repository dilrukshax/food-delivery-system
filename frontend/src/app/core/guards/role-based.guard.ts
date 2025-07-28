import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard for home page - only customers can access
export const customerHomeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserValue;

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Only customers can access home page
  if (user.role === 'CUSTOMER') {
    return true;
  }

  // Redirect other roles to their respective dashboards
  switch (user.role) {
    case 'RESTAURANT_ADMIN':
      router.navigate(['/restaurant-admin']);
      break;
    case 'DELIVERY_DRIVER':
      router.navigate(['/driver']);
      break;
    case 'SYSTEM_ADMIN':
      router.navigate(['/admin']);
      break;
    default:
      router.navigate(['/auth/login']);
  }

  return false;
};

// Guard for customer-only routes
export const customerOnlyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole(['CUSTOMER'])) {
    return true;
  }

  const user = authService.currentUserValue;
  if (user) {
    // Redirect to appropriate dashboard
    switch (user.role) {
      case 'RESTAURANT_ADMIN':
        router.navigate(['/restaurant-admin']);
        break;
      case 'DELIVERY_DRIVER':
        router.navigate(['/driver']);
        break;
      case 'SYSTEM_ADMIN':
        router.navigate(['/admin']);
        break;
      default:
        router.navigate(['/auth/login']);
    }
  } else {
    router.navigate(['/auth/login']);
  }

  return false;
};

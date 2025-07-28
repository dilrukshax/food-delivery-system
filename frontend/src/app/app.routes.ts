import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import {
  customerHomeGuard,
  customerOnlyGuard
} from './core/guards/role-based.guard';

export const routes: Routes = [
  // Home route - only for customers
  {
    path: '',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule),
    canActivate: [authGuard, customerHomeGuard]
  },

  // Customer-only routes
  {
    path: 'restaurants',
    loadChildren: () => import('./features/restaurant/restaurant.module').then(m => m.RestaurantModule),
    canActivate: [authGuard, customerOnlyGuard]
  },
  {
    path: 'orders',
    loadChildren: () => import('./features/order/order.module').then(m => m.OrderModule),
    canActivate: [authGuard, customerOnlyGuard]
  },
  {
    path: 'user',
    loadChildren: () => import('./features/user/user.module').then(m => m.UserModule),
    canActivate: [authGuard, customerOnlyGuard]
  },

  // Restaurant Admin routes - only for restaurant admins
  {
    path: 'restaurant-admin',
    loadChildren: () => import('./features/restaurant-admin/restaurant-admin.module').then(m => m.RestaurantAdminModule),
    canActivate: [authGuard],
    data: { roles: ['RESTAURANT_ADMIN'] }
  },

  // Delivery Driver routes
  {
    path: 'driver',
    loadChildren: () => import('./features/delivery-driver/delivery-driver.module').then(m => m.DeliveryDriverModule),
    canActivate: [authGuard],
    data: { roles: ['DELIVERY_DRIVER'] }
  },

  // System Admin routes
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [authGuard, adminGuard]
  },

  // Auth routes (accessible to all)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },

  // Catch all - redirect to login
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];

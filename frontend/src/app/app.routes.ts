// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';


export const routes: Routes = [
  // { path: '', redirectTo: '/restaurants', pathMatch: 'full' },
  {
    path: '',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'restaurants',
    loadChildren: () => import('./features/restaurant/restaurant.module').then(m => m.RestaurantModule)
  },
  {
    path: 'user',
    loadChildren: () => import('./features/user/user.module').then(m => m.UserModule),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'orders',
    loadChildren: () => import('./features/order/order.module').then(m => m.OrderModule),
    canActivate: [authGuard]
  },
  // {
  //   path: 'payments',
  //   loadChildren: () => import('./features/payment/payment.module').then(m => m.PaymentModule),
  //   canActivate: [authGuard]
  // },
  {
    path: 'restaurant-admin',
    loadChildren: () => import('./features/restaurant-admin/restaurant-admin.module').then(m => m.RestaurantAdminModule),
    canActivate: [authGuard],
    data: { roles: ['RESTAURANT_ADMIN'] }
  },
  {
    path: 'driver',
    loadChildren: () => import('./features/delivery-driver/delivery-driver.module').then(m => m.DeliveryDriverModule),
    canActivate: [authGuard],
    data: { roles: ['DELIVERY_DRIVER'] }
  },
  { path: '**', redirectTo: '/restaurants' }
];

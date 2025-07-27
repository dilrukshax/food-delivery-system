// src/app/features/restaurant-admin/restaurant-admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['RESTAURANT_ADMIN'] }
  },
  {
    path: 'restaurant/new',
    loadComponent: () => import('./restaurant-form/restaurant-form.component').then(c => c.RestaurantFormComponent),
    canActivate: [authGuard],
    data: { roles: ['RESTAURANT_ADMIN'] }
  },
  {
    path: 'restaurant/:id/edit',
    loadComponent: () => import('./restaurant-form/restaurant-form.component').then(c => c.RestaurantFormComponent),
    canActivate: [authGuard],
    data: { roles: ['RESTAURANT_ADMIN'] }
  },
  {
    path: 'restaurant/:id/menu',
    loadComponent: () => import('./menu-manage/menu-manage.component').then(c => c.MenuManageComponent),
    canActivate: [authGuard],
    data: { roles: ['RESTAURANT_ADMIN'] }
  },
  {
    path: 'restaurant/:restaurantId/menu/new',
    loadComponent: () => import('./menu-item-form/menu-item-form.component').then(c => c.MenuItemFormComponent),
    canActivate: [authGuard],
    data: { roles: ['RESTAURANT_ADMIN'] }
  },
  {
    path: 'restaurant/:restaurantId/menu/:id/edit',
    loadComponent: () => import('./menu-item-form/menu-item-form.component').then(c => c.MenuItemFormComponent),
    canActivate: [authGuard],
    data: { roles: ['RESTAURANT_ADMIN'] }
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./order-manage/order-manage.component').then(c => c.OrderManageComponent),
    canActivate: [authGuard],
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RestaurantAdminRoutingModule { }

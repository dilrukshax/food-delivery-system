// src/app/features/order/order-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CartComponent } from './cart/cart.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { OrderPlaceComponent } from './order-place/order-place.component';
import { OrderTrackComponent } from './order-track/order-track.component';
import { authGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  { path: 'cart', component: CartComponent },
  {
    path: 'history',
    component: OrderHistoryComponent,
    canActivate: [authGuard]
  },
  {
    path: 'place',
    component: OrderPlaceComponent,
    canActivate: [authGuard]
  },
  {
    path: 'track/:id',
    component: OrderTrackComponent,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: 'cart', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderRoutingModule { }

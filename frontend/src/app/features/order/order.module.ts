// src/app/features/order/order.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { OrderRoutingModule } from './order-routing.module';
import { CartComponent } from './cart/cart.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { OrderPlaceComponent } from './order-place/order-place.component';
import { OrderTrackComponent } from './order-track/order-track.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OrderRoutingModule,
    SharedModule,
    CartComponent,
    OrderHistoryComponent,
    OrderPlaceComponent,
    OrderTrackComponent
  ]
})
export class OrderModule { }

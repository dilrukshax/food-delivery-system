// src/app/features/restaurant/restaurant.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantRoutingModule } from './restaurant-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { RestaurantListComponent } from './restaurant-list/restaurant-list.component';
import { RestaurantDetailComponent } from './restaurant-detail/restaurant-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RestaurantRoutingModule,
    SharedModule,
    RestaurantListComponent,
    RestaurantDetailComponent
  ]
})
export class RestaurantModule { }

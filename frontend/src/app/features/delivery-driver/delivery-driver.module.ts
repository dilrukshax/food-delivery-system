// src/app/features/delivery-driver/delivery-driver.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DeliveryDriverRoutingModule } from './delivery-driver-routing.module';
import { CurrentDeliveryComponent } from './current-delivery/current-delivery.component';
import { DeliveryListComponent } from './delivery-list/delivery-list.component';

@NgModule({
  declarations: [
    // If not using standalone components, declare them here
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DeliveryDriverRoutingModule,
    // Import standalone components here
    CurrentDeliveryComponent,
    DeliveryListComponent
  ]
})
export class DeliveryDriverModule { }

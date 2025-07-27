// src/app/features/delivery-driver/delivery-driver-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeliveryListComponent } from './delivery-list/delivery-list.component';
import { CurrentDeliveryComponent } from './current-delivery/current-delivery.component';
import { authGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    data: { roles: ['DELIVERY_DRIVER'] },
    children: [
      { path: '', redirectTo: 'deliveries', pathMatch: 'full' },
      { path: 'deliveries', component: DeliveryListComponent },
      { path: 'current', component: CurrentDeliveryComponent },
      { path: 'current/:id', component: CurrentDeliveryComponent },
      { path: 'delivery/:id', component: CurrentDeliveryComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeliveryDriverRoutingModule { }

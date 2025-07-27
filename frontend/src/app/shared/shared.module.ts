import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { AlertComponent } from './components/alert/alert.component';

// src/app/shared/shared.module.ts
@NgModule({
  declarations: [
    // Leave this empty or remove it entirely
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    // Add standalone components here:
    HeaderComponent,
    FooterComponent,
    LoadingSpinnerComponent,
    AlertComponent
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    // You can still export them:
    HeaderComponent,
    FooterComponent,
    LoadingSpinnerComponent,
    AlertComponent
  ]
})
export class SharedModule { }

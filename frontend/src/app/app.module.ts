import { NgModule } from '@angular/core';
  import { BrowserModule } from '@angular/platform-browser';
  import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
  import { RouterModule } from '@angular/router';
  import { GoogleMapsModule } from '@angular/google-maps';
  import { AppComponent } from './app.component';
  import { CoreModule } from './core/core.module';
  import { SharedModule } from './shared/shared.module';
  import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';

  @NgModule({
    declarations: [
      // AppComponent is standalone, don't declare it here
    ],
    imports: [
      BrowserModule,
      BrowserAnimationsModule,
      RouterModule.forRoot([]), // Replace AppRoutingModule with basic RouterModule
      CoreModule,
      SharedModule,
      HttpClientModule,
      HttpClientJsonpModule,
      GoogleMapsModule,
      AppComponent // Import standalone component instead of declaring it
    ],
    providers: [],
    // bootstrap: [AppComponent] - Don't bootstrap here for standalone components
  })
  export class AppModule { }

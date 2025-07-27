// src/app/core/services/stripe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { loadStripe, Stripe } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise: Promise<Stripe | null>;
  private apiUrl = `${environment.apiUrl}/api/payments`;

  constructor(private http: HttpClient) {
    this.stripePromise = loadStripe(environment.stripePublicKey);
  }

  getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  createCheckoutSession(sessionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-checkout-session`, sessionData);
  }

  verifyPaymentSession(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-session/${sessionId}`);
  }
}

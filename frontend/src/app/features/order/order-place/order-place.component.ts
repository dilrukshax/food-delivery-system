// src/app/features/order/order-place/order-place.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UserService } from '../../../core/services/user.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { StripeService } from '../../../core/services/stripe.service';

@Component({
  selector: 'app-order-place',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './order-place.component.html',
  styleUrls: ['./order-place.component.css']
})
export class OrderPlaceComponent implements OnInit {
  orderForm: FormGroup;
  cartItems: CartItem[] = [];
  restaurant: any = null;
  userAddresses: any[] = [];
  loading = false;
  submitting = false;
  error = '';
  success = false;
  orderId: number | null = null;
  stripe: any;
  selectedAddressId: number | null = null; // Store the selected address ID

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private restaurantService: RestaurantService,
    private userService: UserService,
    private stripeService: StripeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.orderForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}(-[0-9]{4})?$')]],
      paymentMethod: ['card', Validators.required],
      savedAddress: ['']
    });
  }

  ngOnInit(): void {
    this.loadCartItems();
    this.loadUserAddresses();
    this.initializeStripe();

    // Check if returning from payment
    this.route.queryParams.subscribe(params => {
      if (params['session_id']) {
        this.verifyPaymentAndCreateOrder(params['session_id']);
      }
    });
  }

  async initializeStripe() {
    this.stripe = await this.stripeService.getStripe();
  }

  loadCartItems(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;

      if (this.cartItems.length === 0) {
        this.router.navigate(['/order/cart']);
        return;
      }

      const restaurantId = this.cartService.getRestaurantId();
      if (restaurantId) {
        this.loadRestaurant(restaurantId);
      }
    });
  }

  loadRestaurant(restaurantId: number): void {
    this.loading = true;
    this.restaurantService.getRestaurantById(restaurantId)
      .subscribe({
        next: (response) => {
          this.restaurant = response;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load restaurant details';
          this.loading = false;
        }
      });
  }

  loadUserAddresses(): void {
    this.userService.getUserAddresses()
      .subscribe({
        next: (response) => {
          this.userAddresses = response.data || [];

          // Pre-fill form with user profile info
          this.userService.getCurrentUserProfile()
            .subscribe({
              next: (profileResponse) => {
                const profile = profileResponse.data;
                this.orderForm.patchValue({
                  name: `${profile.firstName} ${profile.lastName}`,
                  email: profile.email,
                  phone: profile.phone || ''
                });
              },
              error: (err) => {
                console.error('Failed to load user profile:', err);
              }
            });
        },
        error: (err) => {
          console.error('Failed to load user addresses:', err);
        }
      });
  }

  onAddressChange(event: any): void {
    const addressId = event.target.value;
    if (!addressId) {
      this.selectedAddressId = null;
      return;
    }

    this.selectedAddressId = +addressId; // Store the selected address ID
    const selectedAddress = this.userAddresses.find(a => a.id === +addressId);
    if (selectedAddress) {
      this.orderForm.patchValue({
        address: selectedAddress.addressLine1 + (selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''),
        city: selectedAddress.city,
        zipCode: selectedAddress.postalCode
      });
    }
  }

  getSubtotal(): number {
    return this.cartService.getTotalPrice();
  }

  getTax(): number {
    return this.getSubtotal() * 0.1; // Assuming 10% tax
  }

  getDeliveryFee(): number {
    return 2.99; // Fixed delivery fee
  }

  getTotal(): number {
    return this.getSubtotal() + this.getTax() + this.getDeliveryFee();
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      return;
    }

    this.submitting = true;
    this.error = '';

    const formValues = this.orderForm.value;

    if (formValues.paymentMethod === 'card') {
      // For card payments, create a Stripe checkout session
      this.processStripeCheckout();
    } else {
      // For cash on delivery, create the order directly
      this.createOrder('cash', null);
    }
  }

  processStripeCheckout(): void {
    const formValues = this.orderForm.value;
    const deliveryAddress = `${formValues.address}, ${formValues.city}, ${formValues.zipCode}`;

    // Save order details for use after payment
    const orderDetails = {
      customerName: formValues.name,
      customerEmail: formValues.email,
      customerPhone: formValues.phone,
      deliveryAddress: deliveryAddress,
      restaurantId: this.restaurant?.id,
      customerAddressId: this.selectedAddressId, // Include the selected address ID
      orderItems: this.cartService.toOrderItemRequests()
    };

    // Store order details temporarily
    localStorage.setItem('pendingOrder', JSON.stringify(orderDetails));

    // Create checkout session data
    const sessionData = {
      amount: Math.round(this.getTotal() * 100), // Convert to cents
      currency: 'usd',
      customerEmail: formValues.email,
      customerName: formValues.name,
      successUrl: `${window.location.origin}/orders/place?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/orders/place?canceled=true`,
      orderItems: this.cartService.getCartItemsValue().map(item => ({
        name: item.menuItem.name,
        description: item.menuItem.description || '',
        quantity: item.quantity,
        price: item.menuItem.price * 100, // Convert to cents
      }))
    };

    this.stripeService.createCheckoutSession(sessionData).subscribe({
      next: (response) => {
        // Redirect to Stripe Checkout
        this.redirectToStripeCheckout(response.sessionId);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create payment session';
        this.submitting = false;
      }
    });
  }

  async redirectToStripeCheckout(sessionId: string): Promise<void> {
    if (!this.stripe) {
      this.error = 'Payment system is not initialized';
      this.submitting = false;
      return;
    }

    const { error } = await this.stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (error) {
      this.error = error.message || 'Payment could not be processed';
      this.submitting = false;
    }
  }

  verifyPaymentAndCreateOrder(sessionId: string): void {
    this.loading = true;

    this.stripeService.verifyPaymentSession(sessionId).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // Get stored order details
          const orderDetails = localStorage.getItem('pendingOrder');
          if (orderDetails) {
            const orderData = JSON.parse(orderDetails);
            // Create the order with payment info
            this.createOrder('card', sessionId, orderData);
          } else {
            this.error = 'Order details not found';
            this.loading = false;
          }
        } else {
          this.error = 'Payment was not successful';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to verify payment';
        this.loading = false;
      }
    });
  }

  createOrder(paymentMethod: string, sessionId: string | null, storedOrderData: any = null): void {
    const formValues = this.orderForm.value;
    const orderData = storedOrderData || {};

    // Create order request
    const orderRequest = {
      restaurantId: orderData.restaurantId || this.restaurant?.id,
      customerAddressId: orderData.customerAddressId || this.selectedAddressId, // Pass the selected address ID
      deliveryAddress: orderData.deliveryAddress ||
        `${formValues.address}, ${formValues.city}, ${formValues.zipCode}`,
      customerName: orderData.customerName || formValues.name,
      customerEmail: orderData.customerEmail || formValues.email,
      customerPhone: orderData.customerPhone || formValues.phone,
      paymentMethod: paymentMethod,
      paymentSessionId: sessionId,
      orderItems: orderData.orderItems || this.cartService.toOrderItemRequests()
    };

    this.orderService.createOrder(orderRequest)
      .subscribe({
        next: (response) => {
          this.success = true;
          this.submitting = false;
          this.loading = false;

          // Clear pending order data
          localStorage.removeItem('pendingOrder');

          // Store order ID and clear cart
          this.orderId = response.id;
          this.cartService.clearCart();

          // Redirect to order tracking page
          setTimeout(() => {
            if (this.orderId) {
              this.router.navigate(['/orders/track', this.orderId]);
            } else {
              this.error = 'Missing order ID. Cannot navigate to tracking page.';
            }
          }, 2000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to place order. Please try again.';
          this.submitting = false;
          this.loading = false;
        }
      });
  }

  goToCart(): void {
    this.router.navigate(['/order/cart']);
  }
}

// src/app/features/order/cart/cart.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RestaurantService } from '../../../core/services/restaurant.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  restaurant: any = null;
  loading = false;
  error = '';

  constructor(
    private cartService: CartService,
    private restaurantService: RestaurantService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('CartComponent initialized');
    this.loadCartItems();
  }

  loadCartItems(): void {
    this.cartService.getCartItems().subscribe(items => {
      console.log('Cart items loaded:', items);
      this.cartItems = items;

      const restaurantId = this.cartService.getRestaurantId();
      console.log('Restaurant ID from cart service:', restaurantId);

      if (restaurantId && this.cartItems.length > 0 && !this.restaurant) {
        this.loadRestaurant(restaurantId);
      }
    });
  }

  loadRestaurant(restaurantId: number): void {
    this.loading = true;
    this.restaurantService.getRestaurantById(restaurantId)
      .subscribe({
        next: (response) => {
          console.log('Restaurant loaded:', response);
          this.restaurant = response;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load restaurant details';
          console.error('Failed to load restaurant:', err);
          this.loading = false;
        }
      });
  }

  updateQuantity(itemId: number, newQuantity: number): void {
    console.log('Updating quantity for item', itemId, 'to', newQuantity);
    this.cartService.updateItemQuantity(itemId, newQuantity);
  }

  removeItem(itemId: number): void {
    console.log('Removing item', itemId);
    this.cartService.removeFromCart(itemId);
  }

  clearCart(): void {
    console.log('Clearing cart');
    this.cartService.clearCart();
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


  proceedToCheckout(): void {
    console.log('Proceeding to checkout');

    if (this.cartItems.length === 0) {
      this.error = 'Your cart is empty. Please add items before checkout.';
      return;
    }

    // Use the correct path that matches your route configuration
    this.router.navigate(['/orders/place'])
      .then(success => {
        if (!success) {
          console.error('Navigation failed:', success);
          this.error = 'Unable to navigate to checkout. Please try again.';
        }
      })
      .catch(err => {
        console.error('Navigation error:', err);
        this.error = 'Error during navigation: ' + err.message;
      });
  }


  continueShopping(): void {
    if (this.restaurant) {
      console.log('Continuing shopping at restaurant', this.restaurant.id);
      this.router.navigate(['/restaurants', this.restaurant.id]);
    } else {
      console.log('Continuing shopping (general)');
      this.router.navigate(['/restaurants']);
    }
  }
}

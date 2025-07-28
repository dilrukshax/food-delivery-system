// src/app/core/services/cart.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { MenuItem } from '../models/menu-item.model';
import { OrderItemRequest } from '../models/order.model';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private restaurantId: number | null = null;
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Only load cart if we're in browser environment
    if (this.isBrowser) {
      this.loadCart();
    }
  }

  private loadCart(): void {
    // Only proceed if we're in browser environment
    if (!this.isBrowser) {
      return;
    }

    try {
      const savedCart = localStorage.getItem('cart');
      const savedRestaurantId = localStorage.getItem('cartRestaurantId');

      if (savedCart) {
        this.cartItems = JSON.parse(savedCart);
        this.cartItemsSubject.next([...this.cartItems]);
      }

      if (savedRestaurantId) {
        this.restaurantId = JSON.parse(savedRestaurantId);
      }

      console.log('Cart loaded from localStorage:', this.cartItems);
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Reset cart if there's an error
      this.cartItems = [];
      this.restaurantId = null;
      if (this.isBrowser) {
        localStorage.removeItem('cart');
        localStorage.removeItem('cartRestaurantId');
      }
      this.cartItemsSubject.next([]);
    }
  }

  private saveCart(): void {
    // Only proceed if we're in browser environment
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem('cart', JSON.stringify(this.cartItems));

      if (this.restaurantId) {
        localStorage.setItem('cartRestaurantId', JSON.stringify(this.restaurantId));
      } else {
        localStorage.removeItem('cartRestaurantId');
      }

      this.cartItemsSubject.next([...this.cartItems]);
      console.log('Cart saved to localStorage:', this.cartItems);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItemsSubject.asObservable();
  }

  getCartItemsValue(): CartItem[] {
    return [...this.cartItems];
  }

  getRestaurantId(): number | null {
    return this.restaurantId;
  }

  addToCart(menuItem: MenuItem, quantity: number = 1): boolean {
    console.log('CartService: Adding to cart:', menuItem, 'quantity:', quantity);

    // If cart is empty, set the restaurant ID
    if (this.cartItems.length === 0) {
      this.restaurantId = menuItem.restaurantId;
      console.log('CartService: Setting restaurantId to', this.restaurantId);
    }

    // If trying to add item from different restaurant, return false
    if (this.restaurantId !== menuItem.restaurantId) {
      console.log('CartService: Cannot add item from different restaurant');
      return false;
    }

    // Check if item already exists in cart
    const existingItemIndex = this.cartItems.findIndex(item => item.menuItem.id === menuItem.id);

    if (existingItemIndex !== -1) {
      this.cartItems[existingItemIndex].quantity += quantity;
      console.log('CartService: Updated existing item quantity to', this.cartItems[existingItemIndex].quantity);
    } else {
      this.cartItems.push({ menuItem, quantity });
      console.log('CartService: Added new item to cart');
    }

    this.saveCart();
    return true;
  }

  updateItemQuantity(menuItemId: number, quantity: number): void {
    const itemIndex = this.cartItems.findIndex(item => item.menuItem.id === menuItemId);

    if (itemIndex !== -1) {
      if (quantity <= 0) {
        this.removeFromCart(menuItemId);
      } else {
        this.cartItems[itemIndex].quantity = quantity;
        this.saveCart();
      }
    }
  }

  removeFromCart(menuItemId: number): void {
    this.cartItems = this.cartItems.filter(item => item.menuItem.id !== menuItemId);

    if (this.cartItems.length === 0) {
      this.restaurantId = null;
    }

    this.saveCart();
  }

  clearCart(): void {
    this.cartItems = [];
    this.restaurantId = null;

    if (this.isBrowser) {
      localStorage.removeItem('cart');
      localStorage.removeItem('cartRestaurantId');
    }

    this.cartItemsSubject.next([]);
    console.log('CartService: Cart cleared');
  }

  getItemCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  }

  toOrderItemRequests(): OrderItemRequest[] {
    return this.cartItems.map(item => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity,
      unitPrice: item.menuItem.price
    }));
  }
}

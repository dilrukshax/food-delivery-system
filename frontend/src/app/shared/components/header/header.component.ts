import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  userRole = '';
  isMenuOpen = false;
  cartItemCount = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.subscriptions.push(
      this.authService.currentUser.subscribe(user => {
        this.isLoggedIn = !!user;
        if (user) {
          this.userName = `${user.firstName} ${user.lastName}`;
          this.userRole = user.role;
        } else {
          this.userName = '';
          this.userRole = '';
        }
      })
    );

    // Subscribe to cart changes (only for customers)
    this.subscriptions.push(
      this.authService.currentUser.subscribe(user => {
        if (user && user.role === 'CUSTOMER') {
          this.subscriptions.push(
            this.cartService.getCartItems().subscribe(items => {
              this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
            })
          );
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getLogoRoute(): string {
    return this.authService.getDashboardRoute();
  }

  getUserInitial(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : 'U';
  }

  getRoleDisplayName(): string {
    switch (this.userRole) {
      case 'CUSTOMER':
        return 'Customer';
      case 'RESTAURANT_ADMIN':
        return 'Restaurant Admin';
      case 'DELIVERY_DRIVER':
        return 'Delivery Driver';
      case 'SYSTEM_ADMIN':
        return 'System Admin';
      default:
        return 'User';
    }
  }

  logout(): void {
    this.authService.logout();
    this.isMenuOpen = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}

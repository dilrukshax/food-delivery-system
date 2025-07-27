// src/app/features/restaurant-admin/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RestaurantAdminService } from '../../../core/services/restaurant-admin.service';
import { OrderService } from '../../../core/services/order.service';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  restaurants: any[] = [];
  filteredRestaurants: any[] = [];
  loading = true;
  error = '';

  // Filter and sort properties
  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'name';

  // Statistics
  pendingOrders = 0;
  monthlyRevenue = '0.00';
  menuItemCounts: Map<number, number> = new Map();
  orderCounts: Map<number, number> = new Map();
  totalMenuItems = 0;
  statsLoading = false;

  constructor(
    private restaurantService: RestaurantAdminService,
    private orderService: OrderService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.loading = true;
    this.error = '';

    this.restaurantService.getRestaurantsByOwner().subscribe({
      next: (response) => {
        this.restaurants = response;
        this.initializeFilters();
        if (this.restaurants.length > 0) {
          this.loadStatistics();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading restaurants:', err);
        this.error = err.message || 'Failed to load restaurants';
        this.loading = false;
      }
    });
  }

  loadStatistics(): void {
    this.statsLoading = true;
    this.pendingOrders = 0;
    this.totalMenuItems = 0;
    let totalRevenue = 0;

    // Create observables array for menu items and orders for each restaurant
    const observables = [];

    for (const restaurant of this.restaurants) {
      // Add observable for menu items
      observables.push(
        this.restaurantService.getMenuItems(restaurant.id).pipe(
          catchError(error => {
            console.error(`Error fetching menu items for restaurant ${restaurant.id}:`, error);
            return of([]);
          })
        )
      );

      // Add observable for orders
      observables.push(
        this.orderService.getOrdersByRestaurantId(restaurant.id).pipe(
          catchError(error => {
            console.error(`Error fetching orders for restaurant ${restaurant.id}:`, error);
            return of([]);
          })
        )
      );
    }

    // Execute all requests in parallel
    forkJoin(observables).pipe(
      finalize(() => {
        this.loading = false;
        this.statsLoading = false;
      })
    ).subscribe({
      next: (results) => {
        // Process results - every odd index is orders, every even is menu items
        for (let i = 0; i < this.restaurants.length; i++) {
          const menuItemsIndex = i * 2;
          const ordersIndex = menuItemsIndex + 1;
          const restaurantId = this.restaurants[i].id;

          // Handle menu items
          const menuItems = results[menuItemsIndex] || [];
          this.menuItemCounts.set(restaurantId, menuItems.length);
          this.totalMenuItems += menuItems.length;

          // Handle orders
          const orders = results[ordersIndex] || [];
          this.orderCounts.set(restaurantId, orders.length);

          // Count pending orders
          const pendingOrdersCount = orders.filter((order: any) =>
            (order?.status?.toUpperCase() === 'PENDING' || order?.orderStatus?.toUpperCase() === 'PENDING') &&
            order != null
          ).length;
          this.pendingOrders += pendingOrdersCount;

          // Calculate revenue (assuming each order has a totalAmount property)
          orders.forEach((order: any) => {
            if (order.totalAmount &&
              order.createdAt &&
              this.isWithinCurrentMonth(new Date(order.createdAt))) {
              totalRevenue += order.totalAmount;
            }
          });
        }

        // Update monthly revenue
        this.monthlyRevenue = totalRevenue.toFixed(2);
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.error = 'Failed to load some statistics. Please try again.';
      }
    });
  }

  isWithinCurrentMonth(date: Date): boolean {
    const now = new Date();
    return date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  }

  initializeFilters(): void {
    this.filteredRestaurants = [...this.restaurants];
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredRestaurants = this.restaurants.filter(restaurant => {
      // Status filter
      if (this.statusFilter === 'active' && !restaurant.active) return false;
      if (this.statusFilter === 'inactive' && restaurant.active) return false;

      // Search term filter
      if (this.searchTerm && !restaurant.name.toLowerCase().includes(this.searchTerm.toLowerCase())) return false;

      return true;
    });

    // Apply sorting
    this.filteredRestaurants = this.filteredRestaurants.sort((a, b) => {
      if (this.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (this.sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (this.sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return 0;
    });
  }

  createRestaurant(): void {
    this.router.navigate(['/restaurant-admin/restaurant/new']);
  }

  editRestaurant(id: number): void {
    this.router.navigate([`/restaurant-admin/restaurant/${id}/edit`]);
  }

  manageMenu(id: number): void {
    this.router.navigate([`/restaurant-admin/restaurant/${id}/menu`]);
  }

  viewOrders(id: number): void {
    this.router.navigate([`/restaurant-admin/orders/${id}`]);
  }

  deleteRestaurant(id: number): void {
    if (confirm('Are you sure you want to delete this restaurant?')) {
      this.loading = true;
      this.restaurantService.deleteRestaurant(id).subscribe({
        next: () => {
          this.restaurants = this.restaurants.filter(r => r.id !== id);
          this.menuItemCounts.delete(id);
          this.orderCounts.delete(id);
          this.loadStatistics(); // Reload statistics after deletion
          this.initializeFilters();
        },
        error: (err) => {
          this.error = 'Failed to delete restaurant';
          this.loading = false;
          console.error('Error deleting restaurant:', err);
        }
      });
    }
  }

  // Stats utility methods
  getActiveCount(): number {
    return this.restaurants.filter(r => r.active).length;
  }

  getActivePercentage(): number {
    if (this.restaurants.length === 0) return 0;
    return Math.round((this.getActiveCount() / this.restaurants.length) * 100);
  }

  getTotalMenuItems(): number {
    return this.totalMenuItems;
  }

  getMenuItemCount(restaurantId: number): number {
    return this.menuItemCounts.get(restaurantId) || 0;
  }

  getOrderCount(restaurantId: number): number {
    return this.orderCounts.get(restaurantId) || 0;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  reloadData(): void {
    this.loadRestaurants();
  }
}

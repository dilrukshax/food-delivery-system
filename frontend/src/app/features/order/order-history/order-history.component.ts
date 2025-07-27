// src/app/features/order/order-history/order-history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {
  orders: any[] = [];
  restaurants: Map<number, any> = new Map();
  loading = true;
  error = '';
  OrderStatus = OrderStatus;
  activeTab: 'all' | 'active' | 'completed' = 'all';

  constructor(
    private orderService: OrderService,
    private restaurantService: RestaurantService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;

    this.orderService.getOrdersByCustomerId()
      .subscribe({
        next: (response: { data: any; }) => {
          // Handle different response formats
          const orders = response.data || response;
          this.orders = orders;

          // Fetch restaurant details for each order
          this.fetchRestaurantDetails();

          // Sort orders by date (most recent first)
          this.orders.sort((a, b) => {
            const dateA = new Date(b.orderDate || b.createdAt).getTime();
            const dateB = new Date(a.orderDate || a.createdAt).getTime();
            return dateA - dateB;
          });

          this.loading = false;
        },
        error: (err: { error: { message: string; }; }) => {
          this.error = err.error?.message || 'Failed to load orders';
          this.loading = false;
        }
      });
  }

  fetchRestaurantDetails(): void {
    // Get unique restaurant IDs
    const restaurantIds = [...new Set(this.orders.map(order => order.restaurantId))];

    // Create an array of restaurant fetch requests
    const requests = restaurantIds.map(id =>
      this.restaurantService.getRestaurantById(id).pipe(
        catchError(() => of({ id, name: `Restaurant #${id}` }))
      )
    );

    if (requests.length > 0) {
      forkJoin(requests).subscribe(restaurants => {
        // Store restaurants in a map for easy lookup
        restaurants.forEach(restaurant => {
          if (restaurant) {
            this.restaurants.set(restaurant.id, restaurant);
          }
        });
      });
    }
  }

  getRestaurantName(restaurantId: number): string {
    return this.restaurants.get(restaurantId)?.name || `Restaurant #${restaurantId}`;
  }

  getStatus(order: any): string {
    return order.orderStatus || order.status || 'Unknown';
  }

  getStatusClass(status: string): string {
    // Convert status to uppercase to match enum values
    const upperStatus = status.toUpperCase();

    switch (upperStatus) {
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.PREPARING:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.READY_FOR_PICKUP:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'bg-orange-100 text-orange-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBackgroundClass(status: string): string {
    // This returns background classes for the status icon
    const upperStatus = status.toUpperCase();

    switch (upperStatus) {
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-700';
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-700';
      case OrderStatus.PREPARING:
        return 'bg-indigo-100 text-indigo-700';
      case OrderStatus.READY_FOR_PICKUP:
        return 'bg-purple-100 text-purple-700';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'bg-orange-100 text-orange-700';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (e) {
      return dateString;
    }
  }

  isOrderCancellable(order: any): boolean {
    const status = (order.orderStatus || order.status || '').toUpperCase();
    return status === 'PENDING' || status === 'CONFIRMED';
  }

  cancelOrder(orderId: number): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(orderId)
        .subscribe({
          next: () => {
            // Find and update the order in our list
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
              // Update based on which property exists
              if (order.hasOwnProperty('orderStatus')) {
                order.orderStatus = OrderStatus.CANCELLED;
              } else if (order.hasOwnProperty('status')) {
                order.status = OrderStatus.CANCELLED;
              }
            }
          },
          error: (err) => {
            alert('Failed to cancel order: ' + (err.error?.message || 'Unknown error'));
          }
        });
    }
  }

  getOrderItems(order: any): any[] {
    return order.orderItems || order.items || [];
  }

  getItemName(item: any): string {
    return item.name || item.menuItem?.name || `Item #${item.menuItemId}`;
  }

  getItemPrice(item: any): number {
    return item.price || item.unitPrice || 0;
  }

  // Tab functionality for filtering orders
  getFilteredOrders(): any[] {
    if (this.activeTab === 'all') {
      return this.orders;
    } else if (this.activeTab === 'active') {
      return this.getActiveOrders();
    } else {
      return this.getCompletedOrders();
    }
  }

  getActiveOrders(): any[] {
    return this.orders.filter(order => {
      const status = (order.orderStatus || order.status || '').toUpperCase();
      return [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.OUT_FOR_DELIVERY
      ].includes(status as OrderStatus);
    });
  }

  getCompletedOrders(): any[] {
    return this.orders.filter(order => {
      const status = (order.orderStatus || order.status || '').toUpperCase();
      return status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;
    });
  }
}

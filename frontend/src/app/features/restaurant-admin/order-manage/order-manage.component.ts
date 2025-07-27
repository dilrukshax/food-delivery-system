import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { RestaurantAdminService } from '../../../core/services/restaurant-admin.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { OrderStatus } from '../../../core/models/order.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-order-manage',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './order-manage.component.html',
  styleUrls: ['./order-manage.component.css']
})
export class OrderManageComponent implements OnInit {
  restaurantId: number | null = null;
  restaurant: any = null;
  orders: any[] = [];
  loading = false;
  error = '';
  success = '';
  orderStatuses = Object.values(OrderStatus);

  // Available delivery drivers
  availableDrivers: any[] = [];

  // For filtering
  statusFilter: string = '';
  dateFilter: string = '';

  // Menu item name cache: { [menuItemId]: menuItem }
  menuItems: Map<number, any> = new Map();

  constructor(
    private orderService: OrderService,
    private restaurantAdminService: RestaurantAdminService,
    private restaurantService: RestaurantService,
    private authService: AuthService,
    private deliveryService: DeliveryService,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && !isNaN(+id)) {
        this.restaurantId = +id;
        this.loadRestaurantDetails();
        this.loadOrders();
        this.loadDeliveryDrivers();
      } else {
        this.error = 'Invalid restaurant ID';
      }
    });
  }

  loadRestaurantDetails(): void {
    if (!this.restaurantId) return;
    this.loading = true;
    this.restaurantAdminService.getRestaurantById(this.restaurantId)
      .subscribe({
        next: (response) => {
          this.restaurant = response.data || response;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load restaurant details';
          this.loading = false;
        }
      });
  }

  loadOrders(): void {
    if (!this.restaurantId) return;
    this.loading = true;
    this.orderService.getOrdersByRestaurantId(this.restaurantId)
      .subscribe({
        next: (response) => {
          // Accept both {data: [...]}, or just [...]
          const orders = response.data || response;
          this.orders = orders.map((order: any) => ({
            ...order,
            status: order.orderStatus?.toUpperCase() || order.status?.toUpperCase() || 'UNKNOWN',
            createdAt: order.orderDate || order.createdAt,
            items: [], // Will be filled after fetching menu items
            selectedDriverId: null // For driver assignment
          }));
          this.fetchMenuItemsForOrders();
        },
        error: (err) => {
          this.error = err.message || 'Failed to load orders';
          this.loading = false;
        }
      });
  }

  // Load available delivery drivers using the delivery service
  loadDeliveryDrivers(): void {
    this.loading = true;
    this.userService.getAllDeliveryDrivers()
      .subscribe({
        next: (response) => {
          if (response.statusCode === 200) {
            console.log('Available drivers:', response.data);
            this.availableDrivers = response.data.map((driver: any) => ({
              id: driver.id,
              firstName: driver.firstName || 'Unknown',
              lastName: driver.lastName || 'Driver'
            }));
          } else {
            console.error('Unexpected response:', response);
            this.error = 'Failed to load available drivers';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load drivers:', err);
          this.error = 'Failed to load available drivers';
          this.loading = false;
        }
      });
  }

  fetchMenuItemsForOrders(): void {
    // Collect all unique menuItemIds from all orders
    const menuItemIds = Array.from(
      new Set(
        this.orders.flatMap(order =>
          (order.orderItems || []).map((item: any) => item.menuItemId)
        )
      )
    );
    // Fetch all menu items for this restaurant in one request
    if (!this.restaurantId) return;
    this.restaurantService.getMenuItems(this.restaurantId)
      .pipe(catchError(() => of([])))
      .subscribe((menuItems: any[]) => {
        // Cache menu items by id
        menuItems.forEach(item => this.menuItems.set(item.id, item));
        // Map orderItems to items with name and price
        this.orders.forEach(order => {
          order.items = (order.orderItems || []).map((item: any) => ({
            ...item,
            name: this.menuItems.get(item.menuItemId)?.name || `Item #${item.menuItemId}`,
            price: item.unitPrice
          }));
        });
        // Sort orders by date (most recent first)
        this.orders.sort((a, b) => {
          const dateA = new Date(b.createdAt).getTime();
          const dateB = new Date(a.createdAt).getTime();
          return dateA - dateB;
        });
        this.loading = false;
      });
  }

  updateOrderStatus(order: any, newStatus: string): void {
    this.loading = true;
    this.success = '';
    this.error = '';
    const statusRequest = { orderStatus: newStatus };
    this.orderService.updateOrderStatus(order.id, statusRequest)
      .subscribe({
        next: () => {
          order.status = newStatus;
          order.orderStatus = newStatus;
          this.success = `Order #${order.id} status updated to ${newStatus}`;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to update order status';
          this.loading = false;
        }
      });
  }

  // Assign a delivery driver to an order using DeliveryService
  assignDriver(order: any): void {
    if (!order.selectedDriverId) {
      this.error = 'Please select a driver to assign';
      return;
    }

    this.loading = true;
    this.success = '';
    this.error = '';

    // Call the delivery service to assign the driver
    this.deliveryService.assignDelivery(order.id, order.selectedDriverId, order.customerId, this.restaurantId || 0)
      .subscribe({
        next: (response) => {
          console.log('Delivery accepted:', response);
          const driver = this.availableDrivers.find(d => d.id === order.selectedDriverId);
          if (driver) {
            order.driverId = order.selectedDriverId;
            order.driverName = `${driver.firstName} ${driver.lastName}`;

            // Update the order status to OUT_FOR_DELIVERY
            this.updateOrderStatus(order, OrderStatus.OUT_FOR_DELIVERY);

            this.success = `Driver ${driver.firstName} ${driver.lastName} assigned to Order #${order.id}`;
          } else {
            this.error = 'Invalid driver selected';
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to assign driver';
          this.loading = false;
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  }

  getStatusClass(status: string): string {
    const upperStatus = (status || '').toUpperCase();
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

  getFilteredOrders(): any[] {
    return this.orders.filter(order => {
      if (this.statusFilter && order.status !== this.statusFilter) return false;
      if (this.dateFilter) {
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        const filterDate = new Date(this.dateFilter).toLocaleDateString();
        if (orderDate !== filterDate) return false;
      }
      return true;
    });
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.dateFilter = '';
  }
}

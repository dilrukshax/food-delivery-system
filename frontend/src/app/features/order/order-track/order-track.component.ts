import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { OrderService } from '../../../core/services/order.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { UserService } from '../../../core/services/user.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-track',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './order-track.component.html',
  styleUrls: ['./order-track.component.css']
})
export class OrderTrackComponent implements OnInit {
  orderId: number | null = null;
  order: any = null;
  loading = true;
  error = '';
  customerAddress: any = null;
  customerProfile: any = null;
  statusSteps = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED
  ];

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private restaurantService: RestaurantService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    console.log('OrderTrackComponent initialized');
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId = +id;
        this.loadOrderWithDetails();
      } else {
        this.error = 'Order ID not provided';
        this.loading = false;
      }
    });
  }

  loadOrderWithDetails(): void {
    if (!this.orderId) return;

    this.loading = true;
    this.orderService.getOrderById(this.orderId)
      .pipe(
        switchMap(response => {
          this.order = response.data || response;
          console.log('Full order response:', this.order);

          if (!this.order || !this.order.restaurantId) return of(null);

          const requests = [];

          const menuItemRequests = (this.order.orderItems || []).map((item: any) =>
            this.restaurantService.getMenuItem(this.order.restaurantId, item.menuItemId)
              .pipe(catchError(() => of(null)))
          );

          requests.push(menuItemRequests.length > 0 ? forkJoin(menuItemRequests) : of([]));

          requests.push(
            this.userService.getUserAddresses().pipe(
              tap((res: any) => console.log('User addresses fetched:', res)),
              catchError(err => {
                console.error('Error fetching addresses:', err);
                return of({ data: [] });
              })
            )
          );

          requests.push(
            this.userService.getCurrentUserProfile().pipe(
              catchError(err => {
                console.error('Error fetching user profile:', err);
                return of({ data: null });
              })
            )
          );

          return forkJoin(requests);
        }),
        catchError(err => {
          this.error = err.error?.message || 'Failed to load order';
          this.loading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (results) => {
          if (!results) {
            this.loading = false;
            return;
          }

          const [menuItems, addressesResponse, profileResponse] = results;

          if (menuItems && Array.isArray(menuItems) && this.order?.orderItems) {
            this.order.orderItems.forEach((orderItem: any, index: number) => {
              const menuItem = menuItems[index];
              if (menuItem) {
                orderItem.menuItemName = menuItem.name;
                orderItem.menuItemImage =
                  Array.isArray(menuItem.imageUrls) && menuItem.imageUrls.length > 0
                    ? menuItem.imageUrls[0]
                    : null;
              }
            });
          }

          if (addressesResponse?.data?.length > 0) {
            const addresses = addressesResponse.data;
            this.customerAddress = addresses.find((addr: any) => +addr.id === +this.order.customerAddressId);
            if (this.customerAddress) {
              console.log('Found matching address:', this.customerAddress);
            } else {
              console.warn('No matching address found for ID:', this.order.customerAddressId);
            }
          }

          if (profileResponse?.data) {
            this.customerProfile = profileResponse.data;
            console.log('Customer profile:', this.customerProfile);
          }

          this.loading = false;
          console.log('Order loaded:', this.order);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load order';
          this.loading = false;
        }
      });
  }

  getFormattedAddress(): string {
    if (this.customerAddress) {
      const parts = [
        this.customerAddress.addressLine1,
        this.customerAddress.addressLine2,
        this.customerAddress.city,
        this.customerAddress.state,
        this.customerAddress.postalCode,
        this.customerAddress.country
      ];
      return parts.filter(part => part).join(', ');
    }

    return this.order?.deliveryAddress || 'Not available';
  }

  normalizeStatus(status: string): string {
    return status?.toUpperCase() || '';
  }

  getStatusIndex(status: string): number {
    return this.statusSteps.indexOf(this.normalizeStatus(status) as OrderStatus);
  }

  isStepCompleted(step: string): boolean {
    const orderStatus = this.order?.status || this.order?.orderStatus;
    return this.getStatusIndex(orderStatus) >= this.getStatusIndex(step);
  }

  isStepCurrent(step: string): boolean {
    const orderStatus = this.order?.status || this.order?.orderStatus;
    return this.normalizeStatus(orderStatus) === step;
  }

  isOrderCancelled(): boolean {
    const orderStatus = this.order?.status || this.order?.orderStatus;
    return this.normalizeStatus(orderStatus) === OrderStatus.CANCELLED;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  formatStatusLabel(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getStatusDescription(status: string): string {
    switch (this.normalizeStatus(status)) {
      case OrderStatus.PENDING: return 'Your order has been received and is awaiting confirmation.';
      case OrderStatus.CONFIRMED: return 'The restaurant has confirmed your order.';
      case OrderStatus.PREPARING: return 'The restaurant is preparing your order.';
      case OrderStatus.READY_FOR_PICKUP: return 'Your order is ready for pickup by the delivery driver.';
      case OrderStatus.OUT_FOR_DELIVERY: return 'Your order is on the way to you.';
      case OrderStatus.DELIVERED: return 'Your order has been delivered.';
      case OrderStatus.CANCELLED: return 'Your order has been cancelled.';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (this.normalizeStatus(status)) {
      case OrderStatus.PENDING: return 'receipt';
      case OrderStatus.CONFIRMED: return 'check_circle';
      case OrderStatus.PREPARING: return 'restaurant';
      case OrderStatus.READY_FOR_PICKUP: return 'inventory';
      case OrderStatus.OUT_FOR_DELIVERY: return 'local_shipping';
      case OrderStatus.DELIVERED: return 'home';
      case OrderStatus.CANCELLED: return 'cancel';
      default: return 'receipt';
    }
  }

  getEstimatedTime(): string {
    switch (this.normalizeStatus(this.order?.status || this.order?.orderStatus)) {
      case OrderStatus.PENDING:
      case OrderStatus.CONFIRMED: return '30-45 minutes';
      case OrderStatus.PREPARING: return '20-30 minutes';
      case OrderStatus.READY_FOR_PICKUP: return '15-20 minutes';
      case OrderStatus.OUT_FOR_DELIVERY: return '5-10 minutes';
      case OrderStatus.DELIVERED: return 'Delivered';
      case OrderStatus.CANCELLED: return 'Cancelled';
      default: return '30-45 minutes';
    }
  }
}

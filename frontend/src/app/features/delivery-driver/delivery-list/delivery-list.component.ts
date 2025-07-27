import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { OrderService } from '../../../core/services/order.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { UserService } from '../../../core/services/user.service';
import { HttpClient } from '@angular/common/http';
import { Delivery, DeliveryStatus } from '../../../core/models/delivery.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './delivery-list.component.html',
  styleUrls: ['./delivery-list.component.css']
})
export class DeliveryListComponent implements OnInit {
  assignedDeliveries: any[] = [];
  completedDeliveries: any[] = []; // New property for completed deliveries
  currentDelivery: any = null;
  loading = false;
  error = '';
  success = '';
  deliveryDetails: Map<number, any> = new Map(); // Store additional delivery details
  private apiKey = 'AIzaSyAY3ZE_EyKuRv52zTehGjN-4RorJOuE5g8';

  activeTab = 'assigned'; // Track active tab: 'assigned' or 'completed'

  constructor(
    private deliveryService: DeliveryService,
    private orderService: OrderService,
    private restaurantService: RestaurantService,
    private userService: UserService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCurrentDelivery();
    this.loadAssignedDeliveries();
  }

  // Method to switch between tabs
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'assigned' && this.assignedDeliveries.length === 0) {
      this.loadAssignedDeliveries();
    } else if (tab === 'completed' && this.completedDeliveries.length === 0) {
      this.loadCompletedDeliveries();
    }
  }

  loadCurrentDelivery(): void {
    this.deliveryService.currentDelivery.subscribe(delivery => {
      this.currentDelivery = delivery;
    });
  }

  loadAssignedDeliveries(): void {
    this.loading = true;
    this.error = '';

    this.deliveryService.getAssignedDeliveries().subscribe({
      next: (deliveries) => {
        this.assignedDeliveries = deliveries;

        // Load additional details for each delivery
        if (deliveries.length > 0) {
          this.loadDeliveryDetails(deliveries);
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load assigned deliveries';
        this.loading = false;
      }
    });
  }

  // New method to load completed deliveries
  loadCompletedDeliveries(): void {
    this.loading = true;
    this.error = '';

    this.deliveryService.getCompletedDeliveries().subscribe({
      next: (deliveries) => {
        this.completedDeliveries = deliveries;

        // Load additional details for each completed delivery
        if (deliveries.length > 0) {
          this.loadDeliveryDetails(deliveries);
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load completed deliveries';
        this.loading = false;
      }
    });
  }

  loadDeliveryDetails(deliveries: any[]): void {
    const requests = deliveries.map(delivery => {
      // Get order details to access customer address
      return this.orderService.getOrderById(delivery.orderId).pipe(
        switchMap(orderResponse => {
          // Extract order data from response
          const order = orderResponse;

          // Store basic order and delivery details
          const details: any = {
            orderId: delivery.orderId,
            customerName: order.customerName || 'Customer',
            customerPhone: order.customerPhone || 'N/A',
            customerEmail: order.customerEmail || 'N/A',
            customerId: order.customerId,
            customerAddressId: order.customerAddressId,
            deliveryAddress: order.deliveryAddress || 'Address not available',
            restaurantId: delivery.restaurantId,
            restaurantAddress: delivery.pickupAddress || 'Address not available'
          };

          // Create array of observables for parallel requests
          const parallelRequests = [];

          // 1. Get customer address details if ID is available
          if (order.customerAddressId) {
            parallelRequests.push(
              this.userService.getUserAddressById(order.customerAddressId).pipe(
                map(addressResponse => {
                  // Handle different response structures
                  const address = addressResponse.data || addressResponse;
                  if (address) {
                    details.customerAddress = address;
                    details.formattedCustomerAddress = this.formatAddress(address);
                  }
                  return address;
                }),
                catchError(error => {
                  console.error('Error fetching customer address:', error);
                  return of(null);
                })
              )
            );
          } else {
            parallelRequests.push(of(null));
          }

          // 2. Get restaurant details
          if (delivery.restaurantId) {
            parallelRequests.push(
              this.restaurantService.getRestaurantById(delivery.restaurantId).pipe(
                map(restaurant => {
                  if (restaurant) {
                    details.restaurant = restaurant;
                    details.restaurantName = restaurant.name;
                    details.formattedRestaurantAddress = this.formatRestaurantAddress(restaurant);
                  }
                  return restaurant;
                }),
                catchError(error => {
                  console.error('Error fetching restaurant:', error);
                  return of(null);
                })
              )
            );
          } else {
            parallelRequests.push(of(null));
          }

          // 3. Get customer details if ID is available
          if (order.customerId) {
            parallelRequests.push(
              this.userService.getUserById(order.customerId).pipe(
                map(customerResponse => {
                  const customer = customerResponse.data || customerResponse;
                  if (customer) {
                    details.customer = customer;
                    if (customer.firstName && customer.lastName) {
                      details.customerFullName = `${customer.firstName} ${customer.lastName}`;
                    }
                    if (customer.phone) {
                      details.customerPhone = customer.phone;
                    }
                    if (customer.email) {
                      details.customerEmail = customer.email;
                    }
                  }
                  return customer;
                }),
                catchError(error => {
                  console.error('Error fetching customer details:', error);
                  return of(null);
                })
              )
            );
          } else {
            parallelRequests.push(of(null));
          }

          // 4. Calculate distance using API if coordinates are available
          if (delivery.restaurantLatitude && delivery.restaurantLongitude &&
            delivery.customerLatitude && delivery.customerLongitude) {
            parallelRequests.push(
              this.getDistanceFromAPI(
                delivery.restaurantLatitude,
                delivery.restaurantLongitude,
                delivery.customerLatitude,
                delivery.customerLongitude
              ).pipe(
                map(distance => {
                  details.distance = distance;
                  return distance;
                }),
                catchError(error => {
                  console.error('Error calculating distance:', error);
                  // Fallback to approximate calculation
                  details.distance = this.calculateApproximateDistance(
                    delivery.restaurantLatitude,
                    delivery.restaurantLongitude,
                    delivery.customerLatitude,
                    delivery.customerLongitude
                  );
                  return of(null);
                })
              )
            );
          } else {
            details.distance = 'Unknown';
            parallelRequests.push(of(null));
          }

          // Execute parallel requests
          return forkJoin(parallelRequests).pipe(
            map(() => {
              this.deliveryDetails.set(delivery.id, details);
              return details;
            })
          );
        }),
        catchError(error => {
          console.error(`Error loading details for delivery ${delivery.id}:`, error);
          return of(null);
        })
      );
    });

    // Wait for all requests to complete
    if (requests.length) {
      forkJoin(requests).subscribe({
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  // Get distance using Google Distance Matrix API
  getDistanceFromAPI(originLat: number, originLng: number, destLat: number, destLng: number) {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&key=${this.apiKey}`;

    return this.http.get(url).pipe(
      map((response: any) => {
        if (response.status === 'OK' &&
          response.rows &&
          response.rows[0].elements &&
          response.rows[0].elements[0].status === 'OK') {

          const element = response.rows[0].elements[0];
          // Return distance in kilometers
          return (element.distance.value / 1000).toFixed(1) + ' km';
        }
        throw new Error('Invalid response from Distance Matrix API');
      })
    );
  }

  // Fallback distance calculation using Haversine formula
  calculateApproximateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return parseFloat(distance.toFixed(1)) + ' km';
  }

  toRad(value: number): number {
    return value * Math.PI / 180;
  }

  // Format customer address from address object
  formatAddress(address: any): string {
    if (!address) return 'Address not available';

    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ];
    return parts.filter(part => part).join(', ');
  }

  // Format restaurant address
  formatRestaurantAddress(restaurant: any): string {
    if (!restaurant) return 'Restaurant address not available';

    return restaurant.address || 'Address not available';
  }

  // Get formatted customer address for a delivery
  getCustomerAddress(deliveryId: number): string {
    const details = this.getDeliveryDetails(deliveryId);
    return details.formattedCustomerAddress || details.deliveryAddress || 'Address not available';
  }

  // Get formatted restaurant address for a delivery
  getRestaurantAddress(deliveryId: number): string {
    const details = this.getDeliveryDetails(deliveryId);
    return details.formattedRestaurantAddress || details.restaurantAddress || 'Address not available';
  }

  // Get restaurant name
  getRestaurantName(deliveryId: number): string {
    const details = this.getDeliveryDetails(deliveryId);
    return details.restaurantName || 'Restaurant';
  }

  // Get customer info
  getCustomerInfo(deliveryId: number): any {
    const details = this.getDeliveryDetails(deliveryId);
    const customer = details.customer || {};

    return {
      name: details.customerFullName ||
        (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : details.customerName) ||
        'Customer',
      phone: customer.phone || details.customerPhone || 'N/A',
      email: customer.email || details.customerEmail || 'N/A'
    };
  }

  // Get delivery details for a specific delivery
  getDeliveryDetails(deliveryId: number): any {
    return this.deliveryDetails.get(deliveryId) || {};
  }

  // Navigate to the current delivery details
  continueDelivery(): void {
    if (this.currentDelivery && this.currentDelivery.id) {
      console.log('Navigating to delivery ID:', this.currentDelivery.id);
      this.router.navigate(['/driver/current', this.currentDelivery.id]);
    } else {
      this.error = 'Cannot access delivery details. Please refresh and try again.';
      console.error('Navigation failed: Current delivery data is invalid', this.currentDelivery);
    }
  }

  // Pick up a delivery
  pickupDelivery(delivery: any): void {
    if (this.currentDelivery) {
      this.error = 'You already have an active delivery. Please complete it first.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    // Mark the delivery as picked up
    this.deliveryService.markOrderAsPickedUp(delivery.id, {
      deliveryStatus: 'PICKED_UP',
      currentLocation: 'Driver location'
    }).subscribe({
      next: (updatedDelivery) => {
        this.success = 'Delivery picked up successfully!';
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/driver/current', updatedDelivery.id]);
        }, 1000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to pick up delivery';
        this.loading = false;
      }
    });
  }

  // Get a CSS class for the delivery status display
  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Refresh the deliveries list
  refreshDeliveries(): void {
    this.deliveryDetails.clear();
    if (this.activeTab === 'assigned') {
      this.loadAssignedDeliveries();
    } else if (this.activeTab === 'completed') {
      this.loadCompletedDeliveries();
    }
  }
}

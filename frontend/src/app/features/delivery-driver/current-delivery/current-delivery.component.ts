import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

// Declare Google Maps variables
declare const google: any;

@Component({
  selector: 'app-current-delivery',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './current-delivery.component.html',
  styleUrls: ['./current-delivery.component.css']
})
export class CurrentDeliveryComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapElement') mapElement!: ElementRef;

  deliveryId: number | null = null;
  delivery: any = null;
  loading = true;
  error = '';
  successMessage = '';

  // Map related properties
  map: any;
  directionsService: any;
  directionsRenderer: any;
  driverMarker: any;
  customerMarker: any;
  restaurantMarker: any;

  // Location tracking
  driverPosition: { lat: number, lng: number } | null = null;
  customerPosition: { lat: number, lng: number } | null = null;
  restaurantPosition: { lat: number, lng: number } | null = null;
  locationWatchId: number | null = null;

  // Distance and time
  distance: string = '';
  duration: string = '';

  private locationInterval: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam && !isNaN(+idParam)) {
        this.deliveryId = +idParam;
        this.loadDelivery(this.deliveryId);
      } else {
        this.deliveryService.currentDelivery.subscribe(delivery => {
          if (delivery) {
            this.delivery = delivery;
            this.deliveryId = delivery.id;
            this.loading = false;
            this.startLocationTracking();
            this.setPositionsFromDelivery();
          } else {
            this.error = 'No active delivery found';
            this.loading = false;
            setTimeout(() => this.router.navigate(['/driver/deliveries']), 3000);
          }
        });
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.mapElement) {
      this.initMap();
    }
  }

  ngOnDestroy(): void {
    this.stopLocationTracking();
  }

  initMap(): void {
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#4F46E5',
        strokeWeight: 5
      }
    });

    const center = { lat: 37.7749, lng: -122.4194 }; // Default center

    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 13,
      center: center,
      mapTypeControl: false,
      streetViewControl: false
    });

    this.directionsRenderer.setMap(this.map);

    if (this.driverPosition || this.customerPosition || this.restaurantPosition) {
      this.updateMapMarkers();
      this.calculateAndDisplayRoute();
    }
  }

  loadDelivery(deliveryId: number): void {
    this.loading = true;
    this.deliveryService.getDeliveryById(deliveryId).subscribe({
      next: (delivery) => {
        this.delivery = delivery;
        this.deliveryService.setCurrentDelivery(delivery);
        this.loading = false;
        this.startLocationTracking();
        this.setPositionsFromDelivery();

        if (!this.map && this.mapElement) {
          this.initMap();
        } else if (this.map) {
          this.updateMapMarkers();
          this.calculateAndDisplayRoute();
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load delivery';
        this.loading = false;
      }
    });
  }

  setPositionsFromDelivery(): void {
    if (this.delivery) {
      if (this.delivery.customerLatitude && this.delivery.customerLongitude) {
        this.customerPosition = {
          lat: this.delivery.customerLatitude,
          lng: this.delivery.customerLongitude
        };
      }

      if (this.delivery.restaurantLatitude && this.delivery.restaurantLongitude) {
        this.restaurantPosition = {
          lat: this.delivery.restaurantLatitude,
          lng: this.delivery.restaurantLongitude
        };
      }
    }
  }

  startLocationTracking(): void {
    if (!navigator.geolocation) {
      this.error = 'Geolocation is not supported by your browser';
      return;
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.driverPosition = { lat: latitude, lng: longitude };
        this.updateLocation(latitude, longitude);

        if (this.map) {
          this.updateMapMarkers();
          this.calculateAndDisplayRoute();
        }
      },
      (err) => {
        console.error('Error getting location:', err);
        this.error = 'Unable to get your current location. Please check permissions.';
      },
      { enableHighAccuracy: true }
    );

    this.locationInterval = interval(30000).subscribe(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.driverPosition = { lat: latitude, lng: longitude };
          this.updateLocation(latitude, longitude);

          if (this.map) {
            this.updateMapMarkers();
            this.calculateAndDisplayRoute();
          }
        },
        (err) => console.error('Error getting location:', err)
      );
    });
  }

  stopLocationTracking(): void {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }

    if (this.locationInterval) {
      this.locationInterval.unsubscribe();
      this.locationInterval = null;
    }
  }

  updateLocation(latitude: number, longitude: number): void {
    if (!this.deliveryId) return;

    const request = {
      currentLocation: `${latitude},${longitude}`,
      latitude: latitude,
      longitude: longitude
    };

    this.deliveryService.updateDeliveryLocation(this.deliveryId, request).subscribe({
      error: (err) => console.error('Failed to update location:', err)
    });
  }

  updateMapMarkers(): void {
    if (!this.map) return;

    if (this.driverMarker) this.driverMarker.setMap(null);
    if (this.customerMarker) this.customerMarker.setMap(null);
    if (this.restaurantMarker) this.restaurantMarker.setMap(null);

    if (this.driverPosition) {
      this.driverMarker = new google.maps.Marker({
        position: this.driverPosition,
        map: this.map,
        icon: {
          url: 'assets/images/driver-marker.png',
          scaledSize: new google.maps.Size(32, 32)
        },
        title: 'Your Location'
      });

      if (!this.customerPosition && !this.restaurantPosition) {
        this.map.setCenter(this.driverPosition);
      }
    }

    if (this.customerPosition) {
      this.customerMarker = new google.maps.Marker({
        position: this.customerPosition,
        map: this.map,
        icon: {
          url: 'assets/images/customer-marker.png',
          scaledSize: new google.maps.Size(32, 32)
        },
        title: 'Customer Location'
      });
    }

    if (this.restaurantPosition) {
      this.restaurantMarker = new google.maps.Marker({
        position: this.restaurantPosition,
        map: this.map,
        icon: {
          url: 'assets/images/restaurant-marker.png',
          scaledSize: new google.maps.Size(32, 32)
        },
        title: 'Restaurant Location'
      });
    }
  }

  calculateAndDisplayRoute(): void {
    if (!this.map || !this.directionsService || !this.directionsRenderer || !this.driverPosition) return;

    let destination;

    if (this.delivery.deliveryStatus === 'PICKED_UP' && this.customerPosition) {
      destination = this.customerPosition;
    } else if (this.restaurantPosition) {
      destination = this.restaurantPosition;
    } else {
      return;
    }

    this.directionsService.route(
      {
        origin: this.driverPosition,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response: any, status: string) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(response);

          const route = response.routes[0];
          if (route && route.legs && route.legs.length > 0) {
            this.distance = route.legs[0].distance.text;
            this.duration = route.legs[0].duration.text;
          }
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  }

  markOrderAsPickedUp(): void {
    if (!this.deliveryId) return;

    this.loading = true;
    this.successMessage = '';
    this.error = '';

    const request = {
      deliveryStatus: 'PICKED_UP',
      currentLocation: this.driverPosition ?
        `${this.driverPosition.lat},${this.driverPosition.lng}` : undefined
    };

    this.deliveryService.markOrderAsPickedUp(this.deliveryId, request).subscribe({
      next: (response) => {
        this.delivery = response;
        this.successMessage = 'Order has been picked up successfully';
        this.loading = false;
        this.calculateAndDisplayRoute();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to mark order as picked up';
        this.loading = false;
      }
    });
  }

  markOrderAsDelivered(): void {
    if (!this.deliveryId) return;

    this.loading = true;
    this.successMessage = '';
    this.error = '';

    const request = {
      deliveryStatus: 'DELIVERED',
      currentLocation: this.driverPosition ?
        `${this.driverPosition.lat},${this.driverPosition.lng}` : undefined
    };

    this.deliveryService.markOrderAsDelivered(this.deliveryId, request).subscribe({
      next: (response) => {
        this.delivery = response;
        this.successMessage = 'Order has been delivered successfully';
        this.loading = false;

        setTimeout(() => {
          this.deliveryService.clearCurrentDelivery();
          this.router.navigate(['/driver/deliveries']);
        }, 5000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to mark order as delivered';
        this.loading = false;
      }
    });
  }

  cancelDelivery(): void {
    if (!this.deliveryId || !confirm('Are you sure you want to cancel this delivery?')) return;

    this.loading = true;
    this.successMessage = '';
    this.error = '';

    this.deliveryService.cancelDelivery(this.deliveryId).subscribe({
      next: () => {
        this.successMessage = 'Delivery has been cancelled';
        this.loading = false;

        setTimeout(() => {
          this.deliveryService.clearCurrentDelivery();
          this.router.navigate(['/driver/deliveries']);
        }, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to cancel delivery';
        this.loading = false;
      }
    });
  }

  canPickUp(): boolean {
    return this.delivery?.deliveryStatus === 'ASSIGNED';
  }

  canDeliver(): boolean {
    return this.delivery?.deliveryStatus === 'PICKED_UP';
  }

  canCancel(): boolean {
    return ['ASSIGNED', 'PENDING'].includes(this.delivery?.deliveryStatus);
  }

  getNextStepAction(): string {
    if (this.delivery?.deliveryStatus === 'ASSIGNED') {
      return 'Pick Up Order';
    } else if (this.delivery?.deliveryStatus === 'PICKED_UP') {
      return 'Deliver Order';
    }
    return '';
  }

  executeNextStep(): void {
    if (this.delivery?.deliveryStatus === 'ASSIGNED') {
      this.markOrderAsPickedUp();
    } else if (this.delivery?.deliveryStatus === 'PICKED_UP') {
      this.markOrderAsDelivered();
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

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
}

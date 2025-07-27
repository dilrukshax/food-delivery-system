import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RestaurantAdminService } from '../../../core/services/restaurant-admin.service';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-restaurant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, GoogleMapsModule],
  templateUrl: './restaurant-form.component.html',
  styleUrls: ['./restaurant-form.component.css']
})
export class RestaurantFormComponent implements OnInit {
  @ViewChild('addressInput') addressInput!: ElementRef;

  restaurantForm!: FormGroup;
  isEditMode = false;
  loading = false;
  error = '';
  success = '';
  restaurantId?: number;
  submitting = false;

  // For image upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadingImage = false;
  currentImages: string[] = [];

  // Google Maps properties
  mapsLoaded = false;
  center: google.maps.LatLngLiteral = {lat: 40.7128, lng: -74.0060}; // Default to NYC
  zoom = 12;
  markerPosition: google.maps.LatLngLiteral;
  markerOptions: google.maps.MarkerOptions = {draggable: true};
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    maxZoom: 20,
    minZoom: 4,
  };

  // Location loading indicator
  locationLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    protected router: Router,
    private restaurantService: RestaurantAdminService,
    private ngZone: NgZone
  ) {
    this.markerPosition = this.center;
    this.checkGoogleMapsLoaded();
  }

  checkGoogleMapsLoaded() {
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
      this.mapsLoaded = true;
    } else {
      console.error('Google Maps API not loaded!');
      // Set a timeout to check again in case it loads later
      setTimeout(() => this.checkGoogleMapsLoaded(), 1000);
    }
  }

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.restaurantId = +id;
      this.loadRestaurant(+id);
    } else {
      // Try to get user's current location
      this.getCurrentLocation();
    }
  }

  ngAfterViewInit(): void {
    // Delay initialization to ensure the API has time to load
    setTimeout(() => {
      if (this.mapsLoaded) {
        this.initPlacesAutocomplete();
      }
    }, 1000);
  }

  initForm(): void {
    this.restaurantForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', Validators.pattern('^[0-9]{10}$')],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required]
    });
  }

  initPlacesAutocomplete(): void {
    if (!this.addressInput || !this.addressInput.nativeElement || !this.mapsLoaded) {
      return;
    }

    try {
      const autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement);

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            this.error = 'Selected place has no location data.';
            return;
          }

          // Update map
          this.center = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          this.markerPosition = this.center;
          this.zoom = 15;

          // Update form
          this.restaurantForm.patchValue({
            address: place.formatted_address || '',
            latitude: this.center.lat,
            longitude: this.center.lng
          });
        });
      });
    } catch (error) {
      console.error('Error initializing Places autocomplete:', error);
    }
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.error = 'Geolocation is not supported by your browser';
      return;
    }

    this.locationLoading = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.markerPosition = this.center;
          this.zoom = 15;

          this.restaurantForm.patchValue({
            latitude: this.center.lat,
            longitude: this.center.lng
          });

          // Get address from coordinates if Maps API is loaded
          if (this.mapsLoaded) {
            this.getAddressFromCoordinates(this.center.lat, this.center.lng);
          }

          this.locationLoading = false;
        });
      },
      (error) => {
        this.ngZone.run(() => {
          let errorMsg = 'Unknown error occurred while retrieving location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'User denied the request for geolocation';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMsg = 'The request to get user location timed out';
              break;
          }

          this.error = errorMsg;
          this.locationLoading = false;
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  loadRestaurant(id: number): void {
    this.loading = true;
    this.restaurantService.getRestaurantById(id).subscribe({
      next: (response) => {
        this.restaurantForm.patchValue({
          name: response.name,
          address: response.address,
          phone: response.phone,
          latitude: response.latitude || this.center.lat,
          longitude: response.longitude || this.center.lng
        });

        // Update map
        if (response.latitude && response.longitude) {
          this.center = {
            lat: response.latitude,
            lng: response.longitude
          };
          this.markerPosition = this.center;
          this.zoom = 15;
        }

        this.currentImages = response.imageUrls || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading restaurant';
        this.loading = false;
      }
    });
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      this.markerPosition = { lat, lng };

      this.restaurantForm.patchValue({
        latitude: lat,
        longitude: lng
      });

      if (this.mapsLoaded) {
        this.getAddressFromCoordinates(lat, lng);
      }
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent): void {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      this.restaurantForm.patchValue({
        latitude: lat,
        longitude: lng
      });

      if (this.mapsLoaded) {
        this.getAddressFromCoordinates(lat, lng);
      }
    }
  }

  getAddressFromCoordinates(lat: number, lng: number): void {
    if (!this.mapsLoaded) return;

    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            this.ngZone.run(() => {
              this.restaurantForm.patchValue({
                address: results[0].formatted_address
              });
            });
          }
        }
      );
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }

  onSubmit(): void {
    if (this.restaurantForm.invalid) return;

    this.submitting = true;
    const restaurantData = {
      name: this.restaurantForm.value.name,
      address: this.restaurantForm.value.address,
      phone: this.restaurantForm.value.phone,
      latitude: this.restaurantForm.value.latitude,
      longitude: this.restaurantForm.value.longitude
    };

    if (this.isEditMode && this.restaurantId) {
      this.restaurantService.updateRestaurant(this.restaurantId, restaurantData).subscribe({
        next: () => {
          this.success = 'Restaurant updated successfully';
          this.submitting = false;
          setTimeout(() => this.router.navigate(['/restaurant-admin']), 1500);
        },
        error: (err) => {
          this.error = 'Update failed';
          this.submitting = false;
        }
      });
    } else {
      this.restaurantService.createRestaurant(restaurantData).subscribe({
        next: (response) => {
          this.success = 'Restaurant created successfully';
          this.submitting = false;
          setTimeout(() => this.router.navigate(['/restaurant-admin']), 1500);
        },
        error: (err) => {
          this.error = 'Creation failed';
          this.submitting = false;
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.previewImage();
    }
  }

  previewImage(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  uploadImage(): void {
    if (!this.restaurantId || !this.selectedFile) return;

    this.uploadingImage = true;
    this.restaurantService.uploadRestaurantImage(this.restaurantId, this.selectedFile).subscribe({
      next: (response) => {
        this.currentImages = response.imageUrls || [];
        this.uploadingImage = false;
        this.selectedFile = null;
        this.imagePreview = null;
      },
      error: (err) => {
        this.error = 'Failed to upload image';
        this.uploadingImage = false;
      }
    });
  }

  deleteImage(imageUrl: string): void {
    if (!this.restaurantId) return;

    if (confirm('Are you sure you want to delete this image?')) {
      this.restaurantService.deleteRestaurantImage(this.restaurantId, imageUrl).subscribe({
        next: (response) => {
          this.currentImages = response.imageUrls || [];
        },
        error: (err) => {
          this.error = 'Failed to delete image';
        }
      });
    }
  }

  cancelUpload(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }
}

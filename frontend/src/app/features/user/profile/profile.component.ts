import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { NgIf } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, GoogleMapsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild('addressInput') addressInput!: ElementRef;

  // Profile form
  profileForm!: FormGroup;
  userProfile: any = null;
  loading = true;
  error = '';

  // Address form and management
  addressForm!: FormGroup;
  addresses: any[] = [];
  defaultAddress: any = null;
  editingAddressId: number | null = null;
  showAddressForm = false;
  addressLoading = false;
  addressError = '';

  // Image upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  uploadError = '';

  // Google Maps properties
  center: google.maps.LatLngLiteral = { lat: 6.9271, lng: 79.8612 }; // Default to Colombo, Sri Lanka
  zoom = 12;
  markerPosition: google.maps.LatLngLiteral;
  markerOptions: google.maps.MarkerOptions = { draggable: true };
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 20,
    minZoom: 4
  };
  mapLoading = false;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private ngZone: NgZone
  ) {
    this.markerPosition = this.center;
    this.initForms();
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadAddresses();
  }

  private initForms(): void {
    // Initialize profile form
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      city: ['']
    });

    // Initialize address form with latitude and longitude fields
    this.addressForm = this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: [''],
      country: ['', Validators.required],
      postalCode: ['', Validators.required],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required],
      isDefault: [false]
    });
  }

  loadUserProfile(): void {
    this.loading = true;
    this.userService.getCurrentUserProfile().subscribe({
      next: (response) => {
        this.userProfile = response.data;
        this.populateProfileForm();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  populateProfileForm(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        phone: this.userProfile.phone || '',
        city: this.userProfile.city || ''
      });
    }
  }

  loadAddresses(): void {
    this.userService.getUserAddresses().subscribe({
      next: (response) => {
        this.addresses = response.data;
        this.findDefaultAddress();
      },
      error: (err) => {
        console.error('Failed to load addresses:', err);
      }
    });
  }

  findDefaultAddress(): void {
    this.defaultAddress = this.addresses.find(addr => addr.isDefault) || null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.createImagePreview();
    }
  }

  createImagePreview(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadError = '';

    this.userService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        this.userProfile = response.data;
        this.isUploading = false;
        this.selectedFile = null;
        this.imagePreview = null;
      },
      error: (err) => {
        this.uploadError = err.error?.message || 'Failed to upload image';
        this.isUploading = false;
      }
    });
  }

  cancelUpload(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onProfileSubmit(): void {
    if (this.profileForm.invalid) return;

    const profileData = this.profileForm.value;
    this.userService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        this.userProfile = response.data;
        alert('Profile updated successfully');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update profile');
      }
    });
  }

  // Address management methods
  showNewAddressForm(): void {
    this.editingAddressId = null;
    this.addressForm.reset({
      isDefault: false
    });
    this.showAddressForm = true;

    // Get user's current location when adding a new address
    this.getUserCurrentLocation();
  }

  editAddress(address: any): void {
    this.editingAddressId = address.id;

    // Set map center and marker to address coordinates if available
    if (address.latitude && address.longitude) {
      this.center = {
        lat: address.latitude,
        lng: address.longitude
      };
      this.markerPosition = this.center;
      this.zoom = 15;
    }

    this.addressForm.patchValue({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state || '',
      country: address.country,
      postalCode: address.postalCode,
      latitude: address.latitude || '',
      longitude: address.longitude || '',
      isDefault: address.isDefault
    });

    this.showAddressForm = true;
  }

  cancelAddressEdit(): void {
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.addressForm.reset();
  }

  onAddressSubmit(): void {
    if (this.addressForm.invalid) return;

    this.addressLoading = true;
    this.addressError = '';

    const addressData = this.addressForm.value;

    if (this.editingAddressId) {
      // Update existing address
      this.userService.updateAddress(this.editingAddressId, addressData).subscribe({
        next: (response) => {
          this.handleAddressSuccess('Address updated successfully');
        },
        error: (err) => {
          this.addressError = err.error?.message || 'Failed to update address';
          this.addressLoading = false;
        }
      });
    } else {
      // Add new address
      this.userService.addAddress(addressData).subscribe({
        next: (response) => {
          this.handleAddressSuccess('Address added successfully');
        },
        error: (err) => {
          this.addressError = err.error?.message || 'Failed to add address';
          this.addressLoading = false;
        }
      });
    }
  }

  handleAddressSuccess(message: string): void {
    alert(message);
    this.addressLoading = false;
    this.showAddressForm = false;
    this.loadAddresses();
  }

  deleteAddress(addressId: number): void {
    if (confirm('Are you sure you want to delete this address?')) {
      this.userService.deleteAddress(addressId).subscribe({
        next: () => {
          this.loadAddresses();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete address');
        }
      });
    }
  }

  setAsDefault(addressId: number): void {
    this.userService.setDefaultAddress(addressId).subscribe({
      next: () => {
        this.loadAddresses();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to set default address');
      }
    });
  }

  // Google Maps methods
  getUserCurrentLocation(): void {
    this.mapLoading = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.ngZone.run(() => {
            this.center = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.markerPosition = this.center;
            this.zoom = 15;

            // Update form with coordinates
            this.addressForm.patchValue({
              latitude: this.center.lat,
              longitude: this.center.lng
            });

            // Get address details from coordinates
            this.getAddressFromCoordinates(this.center.lat, this.center.lng);
            this.mapLoading = false;
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your browser permissions.');
          this.mapLoading = false;
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      this.mapLoading = false;
    }
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      this.markerPosition = { lat, lng };

      // Update form with coordinates
      this.addressForm.patchValue({
        latitude: lat,
        longitude: lng
      });

      // Get address details from coordinates
      this.getAddressFromCoordinates(lat, lng);
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent): void {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // Update form with coordinates
      this.addressForm.patchValue({
        latitude: lat,
        longitude: lng
      });

      // Get address details from coordinates
      this.getAddressFromCoordinates(lat, lng);
    }
  }

  getAddressFromCoordinates(lat: number, lng: number): void {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          // Get the most detailed result (first one)
          const place = results[0];

          // Get formatted address directly for Address Line 1
          const formattedAddress = place.formatted_address;
          let addressLine1 = '';
          let streetNumber = '';
          let route = '';
          let city = '';
          let state = '';
          let country = '';
          let postalCode = '';

          // Parse address components for specific fields
          for (const component of place.address_components) {
            const types = component.types;

            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              route = component.long_name;
            } else if (types.includes('locality') || types.includes('postal_town')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (types.includes('country')) {
              country = component.long_name;
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name;
            } else if (types.includes('sublocality_level_1')) {
              // Handle areas like Brooklyn in NYC
              if (!city) city = component.long_name;
            }
          }

          // Construct Address Line 1 with street number and route
          if (streetNumber && route) {
            addressLine1 = `${streetNumber} ${route}`;
          } else if (route) {
            addressLine1 = route;
          } else {
            // If no detailed street info, use part of formatted address
            const parts = formattedAddress.split(',');
            if (parts.length > 0) {
              addressLine1 = parts[0].trim();
            }
          }

          // Update form with address details
          this.ngZone.run(() => {
            this.addressForm.patchValue({
              addressLine1: addressLine1,
              city: city || this.addressForm.value.city,
              state: state || this.addressForm.value.state,
              country: country || this.addressForm.value.country,
              postalCode: postalCode || this.addressForm.value.postalCode
            });
          });
        }
      }
    );
  }


  searchAddress(address: string): void {
    if (!address.trim()) return;

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
      { address: address },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const location = results[0].geometry.location;

          this.ngZone.run(() => {
            this.center = {
              lat: location.lat(),
              lng: location.lng()
            };

            this.markerPosition = this.center;
            this.zoom = 15;

            // Update form with coordinates
            this.addressForm.patchValue({
              latitude: location.lat(),
              longitude: location.lng()
            });

            // Get complete address details
            this.getAddressFromCoordinates(location.lat(), location.lng());
          });
        } else {
          alert('Address not found. Please try a different address.');
        }
      }
    );
  }
}

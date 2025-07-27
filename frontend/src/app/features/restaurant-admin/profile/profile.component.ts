// src/app/features/restaurant-admin/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantAdminService } from '../../../core/services/restaurant-admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  restaurantForm!: FormGroup;
  restaurant: any = null;
  restaurantId: number | null = null;
  loading = true;
  submitting = false;
  error = '';
  success = '';

  // Image upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  uploadError = '';

  constructor(
    private fb: FormBuilder,
    private restaurantAdminService: RestaurantAdminService,
    private authService: AuthService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Fixed to use currentUserValue instead of getCurrentUserValue
    this.restaurantId = this.authService.currentUserValue?.restaurantId || null;
    if (this.restaurantId) {
      this.loadRestaurant(this.restaurantId);
    } else {
      this.loading = false;
    }
  }

  initForm(): void {
    this.restaurantForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', Validators.pattern('^[0-9]{10}$')]
    });
  }

  loadRestaurant(restaurantId: number): void {
    this.loading = true;
    this.restaurantAdminService.getRestaurantsByOwner().subscribe({
      next: (response: { data: any; }) => {
        this.restaurant = response.data || response;
        this.populateForm();
        this.loading = false;
      },
      error: (err: { error: { message: string; }; }) => {
        this.error = err.error?.message || 'Failed to load restaurant';
        this.loading = false;
      }
    });
  }

  populateForm(): void {
    if (this.restaurant) {
      this.restaurantForm.patchValue({
        name: this.restaurant.name || '',
        address: this.restaurant.address || '',
        phone: this.restaurant.phone || ''
      });
    }
  }

  onSubmit(): void {
    if (this.restaurantForm.invalid) return;

    this.submitting = true;
    this.error = '';
    this.success = '';

    const restaurantData = this.restaurantForm.value;

    if (this.restaurantId) {
      // Update existing restaurant
      this.restaurantAdminService.updateRestaurant(this.restaurantId, restaurantData).subscribe({
        next: (response) => {
          this.restaurant = response.data || response;
          this.success = 'Restaurant updated successfully';
          this.submitting = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update restaurant';
          this.submitting = false;
        }
      });
    } else {
      // Create new restaurant
      this.restaurantAdminService.createRestaurant(restaurantData).subscribe({
        next: (response) => {
          this.restaurant = response.data || response;
          this.restaurantId = this.restaurant.id;
          this.success = 'Restaurant created successfully';
          this.submitting = false;

          // Update user's restaurantId in AuthService
         if (this.restaurantId !== null) {
            this.authService.updateRestaurantId(this.restaurantId);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create restaurant';
          this.submitting = false;
        }
      });
    }
  }

  // Image upload methods
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
    if (!this.selectedFile || !this.restaurantId) return;

    this.isUploading = true;
    this.uploadError = '';

    this.restaurantAdminService.uploadRestaurantImage(this.restaurantId, this.selectedFile).subscribe({
      next: (response) => {
        this.restaurant = response.data || response;
        this.isUploading = false;
        this.selectedFile = null;
        this.imagePreview = null;
        this.success = 'Image uploaded successfully';
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

  removeImage(imageUrl: string): void {
    if (!this.restaurantId) return;

    if (confirm('Are you sure you want to remove this image?')) {
      this.restaurantAdminService.deleteRestaurantImage(this.restaurantId, imageUrl).subscribe({
        next: (response) => {
          this.restaurant = response.data || response;
          this.success = 'Image removed successfully';
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to remove image';
        }
      });
    }
  }
}

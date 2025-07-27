// src/app/features/restaurant-admin/menu-item-form/menu-item-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RestaurantAdminService } from '../../../core/services/restaurant-admin.service';

@Component({
  selector: 'app-menu-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './menu-item-form.component.html',
  styleUrls: ['./menu-item-form.component.css']
})
export class MenuItemFormComponent implements OnInit {
  menuItemForm: FormGroup;
  restaurantId?: number;
  menuItemId?: number;
  isEditMode = false;
  loading = false;
  error = '';
  success = '';

  // Image upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadingImage = false;
  currentImages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    protected router: Router,
    private restaurantService: RestaurantAdminService
  ) {
    this.menuItemForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0.01)]],
      category: [''],
      isAvailable: [true]
    });
  }

  ngOnInit(): void {
    const restaurantId = this.route.snapshot.paramMap.get('restaurantId') ||
      this.route.snapshot.paramMap.get('id');
    if (restaurantId) {
      this.restaurantId = +restaurantId;
    }

    const menuItemId = this.route.snapshot.paramMap.get('id');
    if (menuItemId && menuItemId !== 'new') {
      this.menuItemId = +menuItemId;
      this.isEditMode = true;
      this.loadMenuItem();
    }
  }

  loadMenuItem(): void {
    if (!this.restaurantId || !this.menuItemId) return;

    this.loading = true;
    this.restaurantService.getMenuItem(this.restaurantId, this.menuItemId).subscribe({
      next: (response) => {
        this.menuItemForm.patchValue({
          name: response.name,
          description: response.description,
          price: response.price,
          category: response.category,
          isAvailable: response.isAvailable
        });
        this.currentImages = response.imageUrls || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load menu item details';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.menuItemForm.invalid || !this.restaurantId) return;

    this.loading = true;
    const menuItemData = this.menuItemForm.value;

    if (this.isEditMode && this.menuItemId) {
      this.restaurantService.updateMenuItem(this.restaurantId, this.menuItemId, menuItemData).subscribe({
        next: () => {
          this.success = 'Menu item updated successfully';
          this.loading = false;
          setTimeout(() => this.navigateBack(), 1500);
        },
        error: (err) => {
          this.error = 'Failed to update menu item';
          this.loading = false;
        }
      });
    } else {
      this.restaurantService.createMenuItem(this.restaurantId, menuItemData).subscribe({
        next: (response) => {
          this.success = 'Menu item created successfully';
          this.loading = false;
          setTimeout(() => this.navigateBack(), 1500);
        },
        error: (err) => {
          this.error = 'Failed to create menu item';
          this.loading = false;
        }
      });
    }
  }

  navigateBack(): void {
    if (this.restaurantId) {
      this.router.navigate([`/restaurant-admin/restaurant/${this.restaurantId}/menu`]);
    } else {
      this.router.navigate(['/restaurant-admin']);
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
    if (!this.restaurantId || !this.menuItemId || !this.selectedFile) return;

    this.uploadingImage = true;
    this.restaurantService.uploadMenuItemImage(this.restaurantId, this.menuItemId, this.selectedFile).subscribe({
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
    if (!this.restaurantId || !this.menuItemId) return;

    if (confirm('Are you sure you want to delete this image?')) {
      this.restaurantService.deleteMenuItemImage(this.restaurantId, this.menuItemId, imageUrl).subscribe({
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

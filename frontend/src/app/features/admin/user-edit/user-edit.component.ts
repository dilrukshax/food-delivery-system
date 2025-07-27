// src/app/features/admin/user-edit/user-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css']
})
export class UserEditComponent implements OnInit {
  userId: number | null = null;
  user: any = null;
  userForm!: FormGroup;
  loading = true;
  submitting = false;
  error = '';
  successMessage = '';

  // Role options
  userRoles = ['CUSTOMER', 'RESTAURANT_ADMIN', 'DELIVERY_DRIVER', 'SYSTEM_ADMIN'];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (idParam && idParam !== 'undefined' && !isNaN(+idParam)) {
        this.userId = +idParam;
        this.loadUser(this.userId);
      } else {
        this.error = 'Invalid user ID provided';
        this.loading = false;
        // Redirect back to user list after a delay
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 3000);
      }
    });
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      city: [''],
      role: ['', Validators.required]
    });
  }

  loadUser(userId: number): void {
    this.loading = true;
    this.adminService.getUserById(userId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.user = response.data;
          this.populateForm();
          this.loading = false;
        } else {
          this.error = 'No user data found';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/admin/users']);
          }, 3000);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load user details';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 3000);
      }
    });
  }

  populateForm(): void {
    if (this.user) {
      this.userForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        phone: this.user.phone || '',
        city: this.user.city || '',
        role: this.user.role || 'CUSTOMER'
      });
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid || !this.user || !this.user.email) {
      return;
    }

    this.submitting = true;
    this.error = '';
    this.successMessage = '';

    const userData = this.userForm.value;
    this.adminService.updateUser(this.user.email, userData).subscribe({
      next: (response) => {
        this.user = response.data;
        this.successMessage = 'User updated successfully';
        this.submitting = false;

        // Navigate back to user details after short delay
        setTimeout(() => {
          if (this.userId) {
            this.router.navigate(['/admin/users', this.userId]);
          } else {
            this.router.navigate(['/admin/users']);
          }
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update user';
        this.submitting = false;
      }
    });
  }

  getRoleDisplayName(role: string): string {
    switch(role) {
      case 'CUSTOMER': return 'Customer';
      case 'RESTAURANT_ADMIN': return 'Restaurant Administrator';
      case 'DELIVERY_DRIVER': return 'Delivery Driver';
      case 'SYSTEM_ADMIN': return 'System Administrator';
      default: return role;
    }
  }

  getRoleDescription(role: string): string {
    switch(role) {
      case 'CUSTOMER':
        return 'Standard user account with ability to place orders, view restaurants, and manage personal profile.';
      case 'RESTAURANT_ADMIN':
        return 'Allows management of restaurant profiles, menus, and order fulfillment. Cannot access system administration features.';
      case 'DELIVERY_DRIVER':
        return 'Account for delivery personnel who can pick up and deliver orders. Limited to delivery management features.';
      case 'SYSTEM_ADMIN':
        return 'Full administrative access to all platform features including user management, system settings, and analytics.';
      default:
        return '';
    }
  }
}

// src/app/features/admin/add-user/add-user.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {
  userForm!: FormGroup;
  submitting = false;
  error = '';
  successMessage = '';
  showPassword = false;

  // Role options
  userRoles = [
    { value: 'CUSTOMER', label: 'Customer', description: 'Standard user account with ability to place orders and manage profile.' },
    { value: 'RESTAURANT_ADMIN', label: 'Restaurant Administrator', description: 'Manage restaurant profiles, menus, and order fulfillment.' },
    { value: 'DELIVERY_DRIVER', label: 'Delivery Driver', description: 'Account for delivery personnel to pick up and deliver orders.' },
    { value: 'SYSTEM_ADMIN', label: 'System Administrator', description: 'Full administrative access to all platform features.' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Component initialization if needed
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      city: [''],
      role: ['CUSTOMER', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = '';
    this.successMessage = '';

    const userData = this.userForm.value;
    
    this.adminService.createUser(userData).subscribe({
      next: (response) => {
        this.successMessage = 'User created successfully!';
        this.submitting = false;
        
        // Reset form
        this.userForm.reset();
        this.userForm.patchValue({ role: 'CUSTOMER' });
        
        // Navigate back to user list after short delay
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create user. Please try again.';
        this.submitting = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  generatePassword(): void {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    this.userForm.patchValue({ password });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required.`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address.';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters.`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid 10-digit phone number.';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      password: 'Password',
      phone: 'Phone',
      city: 'City',
      role: 'Role'
    };
    return displayNames[fieldName] || fieldName;
  }

  getRoleDescription(role: string): string {
    const roleObj = this.userRoles.find(r => r.value === role);
    return roleObj ? roleObj.description : '';
  }

  cancelAction(): void {
    this.router.navigate(['/admin/users']);
  }
}

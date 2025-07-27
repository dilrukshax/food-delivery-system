// src/app/features/admin/user-list/user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  totalItems = 0;
  currentPage = 0;
  pageSize = 10;
  sortBy = 'id';
  direction = 'ASC';
  loading = false;
  error = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers(this.currentPage, this.pageSize, this.sortBy, this.direction)
      .subscribe({
        next: (response) => {
          this.users = response.data.content;
          this.totalItems = response.data.totalElements;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load users';
          this.loading = false;
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.direction = this.direction === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = sortBy;
      this.direction = 'ASC';
    }
    this.loadUsers();
  }

  // Add this method to safely navigate to user details
  navigateToUser(userId: number): boolean {
    return userId !== undefined && userId !== null;
  }

  protected readonly Math = Math;
}

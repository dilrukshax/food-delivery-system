// src/app/features/admin/user-details/user-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
  user: any = null;
  loading = true;
  error = '';
  userId: number | null = null;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (idParam && idParam !== 'undefined' && !isNaN(+idParam)) {
        this.userId = +idParam;
        this.loadUser(this.userId);
      } else {
        this.error = 'Invalid user ID provided';
        this.loading = false;
        // Optionally redirect back to user list after a delay
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 3000);
      }
    });
  }

  loadUser(userId: number): void {
    this.loading = true;
    this.adminService.getUserById(userId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.user = response.data;
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
        // Optionally redirect back to user list after a delay on error
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 3000);
      }
    });
  }
}

// src/app/features/restaurant-admin/menu-manage/menu-manage.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RestaurantAdminService } from '../../../core/services/restaurant-admin.service';

@Component({
  selector: 'app-menu-manage',
  standalone: true,
  imports: [CommonModule, NgClass, RouterModule],
  templateUrl: './menu-manage.component.html',
  styleUrls: ['./menu-manage.component.css']
})
export class MenuManageComponent implements OnInit {
  restaurantId!: number;
  restaurant: any = null;
  menuItems: any[] = [];
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantAdminService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.restaurantId = +params['id'];
      this.loadRestaurantInfo();
      this.loadMenuItems();
    });
  }

  loadRestaurantInfo(): void {
    this.restaurantService.getRestaurantById(this.restaurantId).subscribe({
      next: (response) => {
        this.restaurant = response;
      },
      error: (err) => {
        this.error = 'Failed to load restaurant details';
      }
    });
  }

  loadMenuItems(): void {
    this.loading = true;
    this.restaurantService.getMenuItems(this.restaurantId).subscribe({
      next: (response) => {
        this.menuItems = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load menu items';
        this.loading = false;
      }
    });
  }

  createMenuItem(): void {
    this.router.navigate([`/restaurant-admin/restaurant/${this.restaurantId}/menu/new`]);
  }

  editMenuItem(menuItemId: number): void {
    this.router.navigate([`/restaurant-admin/restaurant/${this.restaurantId}/menu/${menuItemId}/edit`]);
  }

  deleteMenuItem(menuItemId: number): void {
    if (confirm('Are you sure you want to delete this menu item?')) {
      this.restaurantService.deleteMenuItem(this.restaurantId, menuItemId).subscribe({
        next: () => {
          this.menuItems = this.menuItems.filter(item => item.id !== menuItemId);
        },
        error: (err) => this.error = 'Delete failed'
      });
    }
  }

  toggleAvailability(item: any): void {
    const updatedItem = {
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: !item.available
    };

    this.restaurantService.updateMenuItem(this.restaurantId, item.id, updatedItem).subscribe({
      next: (response) => {
        const index = this.menuItems.findIndex(mi => mi.id === item.id);
        if (index !== -1) {
          this.menuItems[index] = response;
        }
      },
      error: (err) => {
        this.error = 'Failed to update menu item availability';
      }
    });
  }
}

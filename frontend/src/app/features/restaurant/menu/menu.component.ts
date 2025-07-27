// src/app/features/restaurant/menu/menu.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MenuItem } from '../../../core/models/menu-item.model';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { CartService } from '../../../core/services/cart.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  restaurantId!: number;
  restaurantName: string = '';
  menuItems: MenuItem[] = [];
  loading = true;
  error = '';

  categoryFilter: string = '';
  categories: string[] = [];
  searchTerm: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.restaurantId = +id;
        this.loadRestaurantInfo();
        this.loadMenuItems();
      }
    });
  }

  loadRestaurantInfo(): void {
    this.restaurantService.getRestaurantById(this.restaurantId)
      .subscribe({
        next: (response) => {
          if (response?.name) {
            this.restaurantName = response.name;
          } else {
            console.error('Invalid response format: Missing restaurant name');
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load restaurant info';
          console.error('Failed to load restaurant info:', err);
        }
      });
  }

  loadMenuItems(): void {
    this.loading = true;
    this.restaurantService.getMenuItems(this.restaurantId)
      .subscribe({
        next: (response) => {
          if (response && Array.isArray(response)) {
            // Map API response to ensure consistency with MenuItem model
            this.menuItems = response.map(item => ({
              id: item.id,
              restaurantId: item.restaurantId,
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              createdAt: item.createdAt,
              imageUrls: item.imageUrls || [],
              available: item.available !== false // Treat as available unless explicitly false
            }));

            console.log('Menu items loaded:', this.menuItems);
            this.extractCategories();
          } else {
            console.error('Invalid response format: Expected an array');
            this.error = 'Invalid data format received from the server.';
            this.menuItems = [];
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load menu items';
          console.error('Failed to load menu items:', err);
          this.menuItems = [];
          this.loading = false;
        }
      });
  }

  extractCategories(): void {
    const categorySet = new Set<string>();
    this.menuItems.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    this.categories = Array.from(categorySet);
  }

  setCategory(category: string): void {
    this.categoryFilter = this.categoryFilter === category ? '' : category;
  }

  get filteredItems(): MenuItem[] {
    return this.menuItems.filter(item => {
      const categoryMatch = !this.categoryFilter || item.category === this.categoryFilter;
      const search = this.searchTerm.toLowerCase();
      const searchMatch = !search ||
        item.name.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search));
      return categoryMatch && searchMatch;
    });
  }

  addToCart(item: MenuItem): void {
    // Log the item details to help debugging
    console.log('Attempting to add to cart:', item);

    // Only reject if explicitly set to false
    if (item.available === false) {
      console.log('Item is not available');
      return;
    }

    const success = this.cartService.addToCart(item, 1);
    console.log('Add to cart success:', success);

    if (!success) {
      if (confirm('Your cart contains items from another restaurant. Would you like to clear your cart and add this item?')) {
        this.cartService.clearCart();
        this.cartService.addToCart(item, 1);
      }
    } else {
      // Show feedback that item was added
      alert('Item added to cart!');

      // Optionally, navigate to cart
      if (confirm('Item added to cart. Do you want to view your cart?')) {
        this.router.navigate(['/order/cart']);
      }
    }
  }
}

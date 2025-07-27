// src/app/features/restaurant/restaurant-detail/restaurant-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import {MenuItem} from '../../../core/models/menu-item.model';
import { CartService } from '../../../core/services/cart.service';


@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css']
})
export class RestaurantDetailComponent implements OnInit {
  restaurantId!: number;
  restaurant: any = null;
  menuItems: any[] = [];
  menuCategories: {[key: string]: any[]} = {};
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private restaurantService: RestaurantService,
    private cartService: CartService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.restaurantId = +id;
        this.loadRestaurant();
      }
    });
  }

  loadRestaurant(): void {
    this.loading = true;
    this.restaurantService.getRestaurantById(this.restaurantId)
      .subscribe({
        next: (response) => {
          this.restaurant = response;
          this.loadMenuItems();
        },
        error: (err) => {
          this.error = err.message || 'Failed to load restaurant details';
          this.loading = false;
        }
      });
  }

  loadMenuItems(): void {
    this.restaurantService.getMenuItems(this.restaurantId)
      .subscribe({
        next: (response) => {
          this.menuItems = response || [];
          this.groupMenuItemsByCategory();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load menu items';
          this.loading = false;
        }
      });
  }

  groupMenuItemsByCategory(): void {
    this.menuCategories = {};

    this.menuItems.forEach(item => {
      const category = item.category || 'Uncategorized';

      if (!this.menuCategories[category]) {
        this.menuCategories[category] = [];
      }

      this.menuCategories[category].push(item);
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

  get objectKeys() {
    return Object.keys;
  }


  // Add this to your restaurant-detail.component.ts
  activeCategory: string = '';

  scrollToCategory(category: string) {
    this.activeCategory = category;
    const element = document.getElementById('category-' + category);
    if (element) {
      const yOffset = -100; // Adjust based on your sticky header height
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  }

// You may need to handle scroll events to update the active category
// Add this to initialize the first category
  ngAfterViewInit() {
    if (this.objectKeys(this.menuCategories).length > 0) {
      this.activeCategory = this.objectKeys(this.menuCategories)[0];
    }
  }

}

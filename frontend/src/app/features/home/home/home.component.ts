import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { Restaurant } from '../../../core/models/restaurant.model';
import { MenuItem } from '../../../core/models/menu-item.model';
import { CartService } from '../../../core/services/cart.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  // Hero slider
  heroSlides = [
    {
      imageUrl: 'assets/images/hero-1.jpg',
      title: 'Delicious Food Delivered',
      description: 'Order from the best local restaurants with easy, on-demand delivery.',
      alt: 'Food delivery'
    },
    {
      imageUrl: 'assets/images/hero-2.jpg',
      title: 'Discover New Flavors',
      description: 'Explore restaurants and cuisines you\'ve never tried before.',
      alt: 'Restaurant dishes'
    },
    {
      imageUrl: 'assets/images/hero-3.jpg',
      title: 'Enjoy Special Offers',
      description: 'Find deals and discounts from restaurants in your area.',
      alt: 'Special offers'
    }
  ];
  currentSlide = 0;
  sliderInterval: Subscription | null = null;

  // Restaurants
  restaurants: Restaurant[] = [];
  currentPage = 0;
  pageSize = 8;
  hasMoreRestaurants = true;
  loading = false;

  // Featured menu items
  featuredMenuItems: any[] = [];

  // All menu items with pagination
  allMenuItems: MenuItem[] = [];
  menuItemCurrentPage = 0;
  menuItemPageSize = 8;
  hasMoreMenuItems = true;
  loadingMenuItems = false;
  allMenuItemsTotal: MenuItem[] = [];

  constructor(
    private restaurantService: RestaurantService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadRestaurants();
    this.loadFeaturedMenuItems();
    this.loadAllMenuItems();
    this.startSliderInterval();
  }

  ngOnDestroy(): void {
    if (this.sliderInterval) {
      this.sliderInterval.unsubscribe();
    }
  }

  startSliderInterval(): void {
    this.sliderInterval = interval(5000).subscribe(() => {
      this.nextSlide();
    });
  }

  prevSlide(): void {
    if (this.sliderInterval) {
      this.sliderInterval.unsubscribe();
      this.startSliderInterval();
    }
    this.currentSlide = (this.currentSlide === 0) ? this.heroSlides.length - 1 : this.currentSlide - 1;
  }

  nextSlide(): void {
    if (this.sliderInterval) {
      this.sliderInterval.unsubscribe();
      this.startSliderInterval();
    }
    this.currentSlide = (this.currentSlide === this.heroSlides.length - 1) ? 0 : this.currentSlide + 1;
  }

  goToSlide(index: number): void {
    if (this.sliderInterval) {
      this.sliderInterval.unsubscribe();
      this.startSliderInterval();
    }
    this.currentSlide = index;
  }

  loadRestaurants(): void {
    this.loading = true;
    this.restaurantService.getAllRestaurants().subscribe({
      next: (restaurants) => {
        const startIndex = this.currentPage * this.pageSize;
        const newRestaurants = restaurants.slice(startIndex, startIndex + this.pageSize);

        if (this.currentPage === 0) {
          this.restaurants = newRestaurants;
        } else {
          this.restaurants = [...this.restaurants, ...newRestaurants];
        }

        this.hasMoreRestaurants = restaurants.length > (this.currentPage + 1) * this.pageSize;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load restaurants:', error);
        this.loading = false;
      }
    });
  }

  loadMoreRestaurants(): void {
    if (this.loading) return;
    this.currentPage++;
    this.loadRestaurants();
  }

  loadFeaturedMenuItems(): void {
    this.restaurantService.getAllRestaurants().subscribe({
      next: (restaurants) => {
        this.featuredMenuItems = [];

        // Get menu items from each restaurant (limited to keep the featured list manageable)
        for (const restaurant of restaurants.slice(0, 3)) {
          this.restaurantService.getMenuItems(restaurant.id).subscribe({
            next: (menuItems) => {
              // Add restaurant name to each menu item for display
              const itemsWithRestaurantName = menuItems.slice(0, 2).map(item => ({
                ...item,
                restaurantName: restaurant.name
              }));

              this.featuredMenuItems.push(...itemsWithRestaurantName);
            }
          });
        }
      }
    });
  }

  loadAllMenuItems(): void {
    this.loadingMenuItems = true;
    this.restaurantService.getAllRestaurants().subscribe({
      next: (restaurants) => {
        if (restaurants.length === 0) {
          this.loadingMenuItems = false;
          return;
        }

        let loadedCount = 0;
        const tempAllItems: MenuItem[] = [];

        // Get all menu items from all restaurants
        restaurants.forEach((restaurant, index) => {
          this.restaurantService.getMenuItems(restaurant.id).subscribe({
            next: (menuItems) => {
              // Add restaurant name to each menu item for display
              const itemsWithRestaurantName = menuItems.map(item => ({
                ...item,
                restaurantName: restaurant.name
              }));

              tempAllItems.push(...itemsWithRestaurantName);
              loadedCount++;

              // When all restaurants have been processed
              if (loadedCount === restaurants.length) {
                this.allMenuItemsTotal = tempAllItems;

                // Apply pagination
                const startIndex = this.menuItemCurrentPage * this.menuItemPageSize;
                const newItems = this.allMenuItemsTotal.slice(startIndex, startIndex + this.menuItemPageSize);

                if (this.menuItemCurrentPage === 0) {
                  this.allMenuItems = newItems;
                } else {
                  this.allMenuItems = [...this.allMenuItems, ...newItems];
                }

                this.hasMoreMenuItems = this.allMenuItemsTotal.length > (this.menuItemCurrentPage + 1) * this.menuItemPageSize;
                this.loadingMenuItems = false;
              }
            },
            error: (error) => {
              console.error(`Failed to load menu items for restaurant ${restaurant.id}:`, error);
              loadedCount++;

              // Even if there's an error, continue with what we have
              if (loadedCount === restaurants.length) {
                this.loadingMenuItems = false;
              }
            }
          });
        });
      },
      error: (error) => {
        console.error('Failed to load restaurants for menu items:', error);
        this.loadingMenuItems = false;
      }
    });
  }

  loadMoreMenuItems(): void {
    if (this.loadingMenuItems) return;

    this.loadingMenuItems = true;
    this.menuItemCurrentPage++;

    const startIndex = this.menuItemCurrentPage * this.menuItemPageSize;
    const newItems = this.allMenuItemsTotal.slice(startIndex, startIndex + this.menuItemPageSize);

    this.allMenuItems = [...this.allMenuItems, ...newItems];
    this.hasMoreMenuItems = this.allMenuItemsTotal.length > (this.menuItemCurrentPage + 1) * this.menuItemPageSize;
    this.loadingMenuItems = false;
  }

  addToCart(menuItem: MenuItem): void {
    const added = this.cartService.addToCart(menuItem, 1);
    if (!added) {
      // Handle case where items from different restaurants can't be added
      alert('Items from different restaurants cannot be added to the cart at the same time. Please clear your cart first.');
    }
  }
}

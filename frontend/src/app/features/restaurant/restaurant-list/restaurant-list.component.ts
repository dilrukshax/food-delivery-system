// src/app/features/restaurant/restaurant-list/restaurant-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.css']
})
export class RestaurantListComponent implements OnInit {
  restaurants: any[] = [];
  filteredRestaurants: any[] = [];
  loading = true;
  error = '';
  searchTerm = '';

  constructor(private restaurantService: RestaurantService) { }

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.loading = true;
    this.restaurantService.getAllRestaurants()
      .subscribe({
        next: (response) => {
          this.restaurants = response || [];
          this.filteredRestaurants = [...this.restaurants];
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load restaurants';
          this.restaurants = [];
          this.filteredRestaurants = [];
          this.loading = false;
        }
      });
  }

  filterRestaurants(): void {
    if (!this.searchTerm) {
      this.filteredRestaurants = [...this.restaurants];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredRestaurants = this.restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(term) ||
      (restaurant.address && restaurant.address.toLowerCase().includes(term))
    );
  }
}

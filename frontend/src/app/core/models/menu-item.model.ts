// src/app/core/models/menu-item.model.ts
export interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  category: string;
  createdAt: string;
  imageUrls: string[];
  available: boolean; // Change from isAvailable to available
}

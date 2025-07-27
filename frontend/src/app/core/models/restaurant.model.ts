// src/app/core/models/restaurant.model.ts
import { MenuItem } from './menu-item.model';

export interface Restaurant {
  id: number;
  name: string;
  ownerId: number;
  address: string;
  phone: string;
  active: boolean;
  createdAt: string;
  imageUrls: string[];
  menuItems?: MenuItem[];
  longitude?: number;
  latitude?: number;
}

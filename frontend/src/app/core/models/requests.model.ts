export interface RestaurantRequest {
  name: string;
  address: string;
  phone: string;
}

export interface MenuItemRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

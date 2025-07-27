export interface Delivery {
  id: number;
  orderId: number;
  driverId: number;
  customerId: number;
  restaurantId: number;
  pickupTime: string;
  deliveryTime: string;
  assignedTime: string;
  estimatedDeliveryTime: string;
  deliveryStatus: DeliveryStatus;
  currentLocation: string;
  deliveryNotes: string;
  driverName: string;
  latitude: number;
  longitude: number;
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface UpdateLocationRequest {
  currentLocation: string;
  latitude: number;
  longitude: number;
}

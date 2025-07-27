// src/app/core/models/order.model.ts
export interface Order {
  id: number;
  restaurantId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  totalAmount: number;
  items: OrderItem[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

// Updated to include customerAddressId for the backend
export interface OrderRequest {
  restaurantId: number;
  customerAddressId?: number; // Added field for selected address ID
  deliveryAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod?: string;
  paymentSessionId?: string | null;
  orderItems: OrderItemRequest[];
}

// Updated with unitPrice field
export interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  unitPrice: number;
}

export interface OrderStatusUpdateRequest {
  orderStatus: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

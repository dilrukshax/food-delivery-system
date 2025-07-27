// src/app/core/models/address.model.ts
export interface Address {
  id: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

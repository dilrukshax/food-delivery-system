// src/app/core/models/user-profile.model.ts
import {Address} from 'node:cluster';

export interface UserProfile {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  profileImageUrl: string;
  isActive: boolean;
  createdAt: string;
  addresses: Address[];
}

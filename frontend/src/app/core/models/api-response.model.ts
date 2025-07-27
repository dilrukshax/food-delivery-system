// src/app/core/models/api-response.model.ts
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// src/app/app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Change parameterized routes to use SSR instead of prerendering
  {
    path: 'restaurants/:id',
    renderMode: RenderMode.Server // Use SSR for dynamic routes
  },
  {
    path: 'admin/users/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'orders/track/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'restaurant-admin/restaurant/:id/edit',
    renderMode: RenderMode.Server
  },
  {
    path: 'restaurant-admin/restaurant/:restaurantId/menu/new',
    renderMode: RenderMode.Server
  },
  {
    path: 'restaurant-admin/restaurant/:restaurantId/menu/:id/edit',
    renderMode: RenderMode.Server
  },
  {
    path: 'driver/current/:id',
    renderMode: RenderMode.Server
  },

  // Optionally, you can use client-side rendering for some routes
  // {
  //   path: 'admin/users/:id',
  //   renderMode: RenderMode.ClientSideRendered // Use CSR for admin routes
  // },

  // Static routes can still use prerendering
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'restaurants',
    renderMode: RenderMode.Prerender
  },

  // Default fallback for other routes
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];

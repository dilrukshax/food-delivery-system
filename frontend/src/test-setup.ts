// src/test-setup.ts
// This file provides common test configuration for Angular components

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

// Common test providers for components that need HttpClient
export const commonTestProviders = [
  {
    provide: ActivatedRoute,
    useValue: {
      params: of({}),
      queryParams: of({}),
      snapshot: {
        params: {},
        queryParams: {},
        paramMap: {
          get: () => null,
          has: () => false
        }
      }
    }
  }
];

// Common test imports for most components
export const commonTestImports = [
  HttpClientTestingModule,
  RouterTestingModule
];

// Example usage in spec files:
/*
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [
      ComponentUnderTest,
      ...commonTestImports
    ],
    providers: [
      ...commonTestProviders
    ]
  }).compileComponents();
});
*/

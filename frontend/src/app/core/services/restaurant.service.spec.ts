// src/app/core/services/restaurant.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RestaurantService } from './restaurant.service';
import { environment } from '../../../environments/environment';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RestaurantService]
    });
    service = TestBed.inject(RestaurantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all restaurants', () => {
    const mockRestaurants = [{ id: 1, name: 'Restaurant 1' }, { id: 2, name: 'Restaurant 2' }];
    const mockResponse = { data: mockRestaurants };



    const req = httpMock.expectOne(`${environment.apiUrl}/api/restaurants`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get a restaurant by id', () => {
    const mockRestaurant = { id: 1, name: 'Restaurant 1' };
    const mockResponse = { data: mockRestaurant };



    const req = httpMock.expectOne(`${environment.apiUrl}/api/restaurants/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});

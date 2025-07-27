import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderPlaceComponent } from './order-place.component';

describe('OrderPlaceComponent', () => {
  let component: OrderPlaceComponent;
  let fixture: ComponentFixture<OrderPlaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderPlaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderPlaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

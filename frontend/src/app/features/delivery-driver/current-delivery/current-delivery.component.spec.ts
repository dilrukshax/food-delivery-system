import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentDeliveryComponent } from './current-delivery.component';

describe('CurrentDeliveryComponent', () => {
  let component: CurrentDeliveryComponent;
  let fixture: ComponentFixture<CurrentDeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentDeliveryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

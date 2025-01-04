import { TestBed } from '@angular/core/testing';

import { CreditserviceService } from './creditservice.service';

describe('CreditserviceService', () => {
  let service: CreditserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreditserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

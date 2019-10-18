import { TestBed } from '@angular/core/testing';

import { CircuitService } from './circuit.service';

describe('CircuitService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CircuitService = TestBed.get(CircuitService);
    expect(service).toBeTruthy();
  });
});

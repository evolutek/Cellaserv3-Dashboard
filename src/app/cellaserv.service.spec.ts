import {TestBed} from '@angular/core/testing';

import {CellaservService} from './cellaserv.service';

describe('CellaservService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CellaservService = TestBed.get(CellaservService);
    expect(service).toBeTruthy();
  });
});

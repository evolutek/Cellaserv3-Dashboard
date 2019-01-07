import { Component } from '@angular/core';

import { Service } from '../cellaserv_api';
import { CellaservService } from '../cellaserv.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent {
  constructor(public cs: CellaservService) { }

  serviceHelp(service: Service) {
    // TODO(halfr)
    console.log(service); // console
  }
}

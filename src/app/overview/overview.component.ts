import {
  Component,
  Input,
  OnInit,
} from '@angular/core';

import { CellaservService } from '../cellaserv.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
  constructor(public cs: CellaservService) { }

  ngOnInit() { }
}

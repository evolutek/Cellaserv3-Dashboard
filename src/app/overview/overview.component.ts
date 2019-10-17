import {Component} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {CellaservService} from '../cellaserv.service';
import {Service} from '../cellaserv_api';

@Component({
  selector : 'app-overview',
  templateUrl : './overview.component.html',
  styleUrls : [ './overview.component.scss' ],
})
export class OverviewComponent {
  constructor(public cs: CellaservService, public snackBar: MatSnackBar) {}

  serviceHelp(service: Service) {
    this.cs.request<any>(service.name, 'help')
        .pipe(catchError(error => {
          this.snackBar.open(error.error, 'Dismiss', {duration : 2000});
          return throwError(error);
        }))
        .subscribe(rep => {
          // TODO(halfr): display
          console.log(rep);
        });
  }
}

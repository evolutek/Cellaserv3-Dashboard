import {Component} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {CellaservService, Service} from '../cellaserv.service';
import {CellaservApiService} from '../cellaserv_api';

@Component({
  selector : 'app-overview',
  templateUrl : './overview.component.html',
  styleUrls : [ './overview.component.scss' ],
})
export class OverviewComponent {
  constructor(public broker: CellaservService, public cs: CellaservApiService,
              public snackBar: MatSnackBar) {}

  serviceHelp(service: Service) {
    this.cs.request<any>(service.name, 'help')
        .pipe(catchError(error => {
          this.snackBar.open(error.error, 'Close', {duration : 2000});
          return throwError(error);
        }))
        .subscribe(rep => {
          this.snackBar.open("TODO(halfr). View dev console.", 'Close');
          console.log(rep);
        });
  }
}

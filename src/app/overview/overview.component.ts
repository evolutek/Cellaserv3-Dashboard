import {Component, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {CellaservService} from '../cellaserv.service';
import {CellaservApiService, Service} from '../cellaserv_api';

@Component({
  selector : 'app-overview',
  templateUrl : './overview.component.html',
  styleUrls : [ './overview.component.scss' ],
})
export class OverviewComponent implements OnInit {
  constructor(public broker: CellaservService, public cs: CellaservApiService,
              public snackBar: MatSnackBar) {}

  ngOnInit() { this.broker.cellaservSetup(); }

  serviceHelp(service: Service) {
    this.cs.request<any>(service.name, 'help')
        .pipe(catchError(error => {
          this.snackBar.open(error.error, 'Dismiss', {duration : 2000});
          return throwError(error);
        }))
        .subscribe(rep => {
          this.snackBar.open("TODO(halfr). View dev console.");
          console.log(rep);
        });
  }
}

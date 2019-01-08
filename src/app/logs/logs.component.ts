import { Component } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';

import { CellaservService } from '../cellaserv.service';
import { Publish } from '../cellaserv_api';

@Pipe({
  name: 'logsFilter',
  pure: false
})
export class LogsFilterPipe implements PipeTransform {
  transform(logs: Publish<any>[], filterLogName: string, filterLogText: string) {
    // No filter, exist early
    if (filterLogName === '' && filterLogText === '') {
      return logs.reverse();
    }
    return logs.filter(log => {
      return (filterLogName === '' || log.name.indexOf(filterLogName) !== -1)
	&& (filterLogText === '' || JSON.stringify(log.data).indexOf(filterLogText) !== -1);
    }).reverse();
  }
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent {
  filterLogName = '';
  filterLogText = '';

  constructor(public cs: CellaservService) { }
}

import { Component } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';

import { CellaservService } from '../cellaserv.service';

@Pipe({
  name: 'logsFilter',
  pure: false
})
export class LogsFilterPipe implements PipeTransform {
  transform(logs: any[], filterLogName: string, filterLogText: string) {
    if (filterLogName == '' && filterLogText == '') {
      return logs;
    }
    return logs.filter(log => filterLogText == '' || log.data.indexOf(filterLogText) !== -1);
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

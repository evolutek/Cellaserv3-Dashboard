import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ConfigComponent} from './config/config.component';
import {LogsComponent} from './logs/logs.component';
import {OverviewComponent} from './overview/overview.component';

const routes: Routes = [
  {path : '', redirectTo : '/overview', pathMatch : 'full'},
  {path : 'overview', component : OverviewComponent},
  {path : 'logs', component : LogsComponent},
  {path : 'config', component : ConfigComponent},
];

@NgModule(
    {imports : [ RouterModule.forRoot(routes) ], exports : [ RouterModule ]})
export class AppRoutingModule {
}

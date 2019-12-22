// Angular
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
// https://material.angular.io/
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatNativeDateModule} from '@angular/material/core';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppRoutingModule} from './app-routing.module';
// The app
import {AppComponent} from './app.component';
import {ClientNamePipe, JSONStringifyPipe} from './cellaserv.service';
import {ConfigComponent} from './config/config.component';
import {LogsComponent, LogsFilterPipe} from './logs/logs.component';
import {OverviewComponent} from './overview/overview.component';

@NgModule({
  declarations : [
    AppComponent,
    ClientNamePipe,
    ConfigComponent,
    JSONStringifyPipe,
    LogsComponent,
    LogsFilterPipe,
    OverviewComponent,
  ],
  imports : [
    AppRoutingModule,  BrowserAnimationsModule, BrowserModule,
    FlexLayoutModule,  HttpClientModule,        FormsModule,
    MatButtonModule,   MatExpansionModule,      MatCardModule,
    MatGridListModule, MatIconModule,           MatInputModule,
    MatCheckboxModule, MatListModule,           MatSidenavModule,
    MatTableModule,    MatToolbarModule,        MatTooltipModule,
    MatSnackBarModule, MatSlideToggleModule,
  ],
  providers : [],
  bootstrap : [ AppComponent ]
})
export class AppModule {
}

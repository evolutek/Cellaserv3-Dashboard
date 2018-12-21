import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Client } from './client';
import { Service } from './service';
import { Subscribers } from './subscribers';

@Injectable({
  providedIn: 'root'
})
export class CellaservService {
  // TODO(halfr): make cs url configurable
  private csUrl = 'http://localhost:4280';

  clients: Client[] = [];
  services: Service[] = [];
  events: Subscribers[] = [];

  constructor(private http: HttpClient) {
    // TODO(halfr): add error handling
    this.http.get<Client[]>(this.csUrl + '/api/v1/request/cellaserv/list_clients')
      .subscribe(clients => this.clients = clients);
    this.http.get<Service[]>(this.csUrl + '/api/v1/request/cellaserv/list_services')
      .subscribe(services => this.services = services);
    this.http.get<Subscribers[]>(this.csUrl + '/api/v1/request/cellaserv/list_events')
      .subscribe(events => this.events = events);
  }

  // TODO(halfr): add request()
}

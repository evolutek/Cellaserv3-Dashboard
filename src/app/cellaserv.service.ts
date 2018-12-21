import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Client } from './client';
import { Service } from './service';
import { Subscribers } from './subscribers';

  // TODO(halfr): make cs url configurable
const CELLASERV_URL = 'http://localhost:4280';

@Injectable({
  providedIn: 'root'
})
export class CellaservService {
  clients: Client[] = [];
  services: Service[] = [];
  events: Subscribers[] = [];

  constructor(private http: HttpClient) {
    // TODO(halfr): add error handling
    this.request<Client[]>('cellaserv', 'list_clients')
      .subscribe(clients => this.clients = clients);
    this.request<Service[]>('cellaserv', 'list_services')
      .subscribe(services => this.services = services);
    this.request<Subscribers[]>('cellaserv', 'list_events')
      .subscribe(events => this.events = events);
  }

  request<T>(service: string, method: string): Observable<T>{
    const url = `${CELLASERV_URL}/api/v1/request/${service}/${method}`;
    return this.http.get<T>(url);
  }
}

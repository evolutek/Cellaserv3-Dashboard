import * as deepEqual from "deep-equal";

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';


import { Client } from './client';
import { Service } from './service';
import { Subscribers } from './subscribers';

// TODO(halfr): make cs url configurable
const CELLASERV_URL = 'localhost:4280';

class NewSubscriber {
  event: string;
  client: string;
}

@Injectable({
  providedIn: 'root'
})
export class CellaservService {
  clients: Client[] = [];
  services: Service[] = [];
  events: Subscribers[] = [];

  constructor(private http: HttpClient) {
    // Bootstrap
    this.request<Client[]>('cellaserv', 'list_clients')
    .subscribe(clients => this.clients = clients);
    this.request<Service[]>('cellaserv', 'list_services')
    .subscribe(services => this.services = services);
    this.request<Subscribers[]>('cellaserv', 'list_events')
    .subscribe(events => this.events = events);

    // Live updates
    this.liveUpdate<Client>("client")
    this.liveUpdate<Service>("service")
    // Live updates: events
    this.subscribe<NewSubscriber>(`log.cellaserv.new-subscriber`)
      .subscribe(newElt => {
	for (let sub of this.events) {
	  if (sub.event == newElt.event) {
	    sub.subscribers.push(newElt.client);
	    return;
	  }
	}
	// Did not return early, this is a new event
	let newSub: Subscribers = {
	  event: newElt.event,
	  subscribers: [newElt.client],
	};
	this.events.push(newSub);
      });
    this.subscribe<NewSubscriber>(`log.cellaserv.lost-subscriber`)
      .subscribe(removedElt => {
	for (let event of this.events) {
	  if (event.event == removedElt.event) {
	    let index = event.subscribers.indexOf(removedElt.client);
	    event.subscribers.splice(index, 1);
	    break;
	  }
	}
      });
  };

  liveUpdate<T>(what: string) {
    const attr = what + "s";
    this.subscribe<T>(`log.cellaserv.new-${what}`)
      .subscribe(newElt => this[attr].push(newElt));
    this.subscribe<T>(`log.cellaserv.lost-${what}`)
      .subscribe(removedElt => this[attr]= this[attr].filter(elt => !deepEqual(elt, removedElt)));
  }

  // TODO(halfr): add overload for making request with data
  request<T>(service: string, method: string): Observable<T>{
    // TODO(halfr): add error handling
    const url = `http://${CELLASERV_URL}/api/v1/request/${service}/${method}`;
      return this.http.get<T>(url);
  }

  subscribe<T>(event: string): WebSocketSubject<T>{
    const url = `ws://${CELLASERV_URL}/api/v1/subscribe/${event}`;
      return webSocket<T>(url);
  }
}

import * as deepEqual from 'deep-equal';

import { Injectable } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material';

import { Observable, throwError } from 'rxjs';
import { filter, map, catchError } from 'rxjs/operators';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';

import { Client, Service, Publish, Subscribers, NewSubscriber } from './cellaserv_api';

// TODO(halfr): make cs url configurable
const CELLASERV_ADDR = 'localhost:4280';

@Injectable({ providedIn: 'root' })
export class CellaservService {
  // Connection
  cellaservAddr = CELLASERV_ADDR;
  errorMsg = '';

  // Broker status
  clients: Client[] = [];
  services: Service[] = [];
  events: Subscribers[] = [];

  // Helpers
  clientsMap = new Map<string, Client>();

  // Logs
  logNames: string[] = [];
  logsByName = new Map<string, any[]>();
  logs: any[] = [];

  constructor(private http: HttpClient) {
    // First, check that we can query cellaserv, then do the setup
    this.request('cellaserv', 'version')
    .subscribe(_ => this.cellaservSetup(),
	       error => this.errorMsg = error.message);
  }

  cellaservSetup = () => {
    // Live updates, subscribe before sending seeding request to avoid race
    this.subscribe<NewSubscriber>(`log.cellaserv.new-subscriber`)
    .subscribe(this.onNewSubscriber);
    this.subscribe<NewSubscriber>(`log.cellaserv.lost-subscriber`)
    .subscribe(this.onLostSubscriber);
    this.liveUpdate<Client>('client');
    this.liveUpdate<Service>('service');

    // Bootstrap cellaserv status with list requests
    this.request<Client[]>('cellaserv', 'list_clients')
    .subscribe(clients => {
      this.clients = clients;
      for (const client of clients) {
	this.clientsMap.set(client.id, client);
      }
    });
    this.request<Service[]>('cellaserv', 'list_services')
    .subscribe(services => this.services = services);
    this.request<Subscribers[]>('cellaserv', 'list_events')
    .subscribe(events => {
      // Store subscribers
      events.forEach(event => event.subscribers.forEach(client => {
	const newSub: NewSubscriber = {event: event.event, client: client};
	this.onNewSubscriber(newSub);
      }));

      // Seed list of logs
      for (const event of events) {
	// Skip non-logs events
	if (!event.event.startsWith('log.')) {
	  continue;
	}
	this.addLogName(event.event);
      }
    });

    // Logs component
    this.subscribePattern<any>('log.*')
    .subscribe(logEvent => {
      this.addLogName(logEvent.name);
      this.addLog(logEvent);
    });
  }

  liveUpdate<T>(what: string) {
    const attr = what + 's';
    this.subscribe<T>(`log.cellaserv.new-${what}`)
    .subscribe(newElt => { if (!this[attr].includes(newElt)) { this[attr].push(newElt); }});
    this.subscribe<T>(`log.cellaserv.lost-${what}`)
    .subscribe(removedElt => this[attr] = this[attr].filter(elt => !deepEqual(elt, removedElt)));
  }

  onNewSubscriber = (newSub: NewSubscriber) => {
    for (const sub of this.events) {
      if (sub.event === newSub.event) {
	sub.subscribers.push(newSub.client);
      }
    }
    // Did not return early, this is a new event
    const newSubs: Subscribers = {
      event: newSub.event,
      subscribers: [newSub.client],
    };
    this.events.push(newSubs);
  }

  onLostSubscriber = (removedSub: NewSubscriber) => {
    for (const event of this.events) {
      if (event.event == removedSub.event) {
	const index = event.subscribers.indexOf(removedSub.client);
	event.subscribers.splice(index, 1);
	break;
      }
    }
  }

  addLogName(logName: string) {
    if (this.logNames.indexOf(logName) === -1) {
      // Add new log name, discard data
      this.logNames.push(logName);
      this.logNames.sort();
    }
  }

  addLog(log: Publish<any>) {
    let events = this.logsByName.get(log.name);
    if (events === undefined) {
      events = [];
      this.logsByName.set(log.name, events);
    }
    events.push(log);
    this.logs.push(log);
  }

  // Template utilities
  public isServicePresent(service: string): boolean {
    return this.services.some(srvc => srvc.name === service);
  }

  // Request without data
  request<RepT>(serice: string, method: string): Observable<RepT>;
  // Request with data
  request<ReqT, RepT>(service: string, method: string, reqData?: ReqT): Observable<RepT> {
    const url = `http://${CELLASERV_ADDR}/api/v1/request/${service}/${method}`;
      if (reqData === undefined) {
      return this.http.get<RepT>(url);
    } else {
      return this.http.post<RepT>(url, reqData);
    }
  }

  subscribePattern<T>(event: string): Observable<Publish<T>> {
    const url = `ws://${CELLASERV_ADDR}/api/v1/subscribe/${event}`;
      return webSocket<Publish<string>>(url).pipe(catchError(
	error => {
	  if (error instanceof CloseEvent) {
	    this.errorMsg = 'Connection to cellaserv was closed';
	  } else {
	    this.errorMsg = error;
	  }
	  return throwError(error);
	}))
	.pipe(map(publish => {
	  const parsedData: T = JSON.parse(publish.data);
	  const ret: Publish<T> = {name: publish.name, data: parsedData};
	  return ret;
	}));
  }

  subscribe<T>(event: string): Observable<T> {
    return this.subscribePattern<T>(event)
    .pipe(map(publish => publish.data));
  }

}

@Pipe({
  name: 'clientName',
  pure: false
})
export class ClientNamePipe implements PipeTransform {
  constructor(private cs: CellaservService) { }

  transform(clientId: string) {
    const client = this.cs.clientsMap.get(clientId);
    if (client === undefined) {
      return clientId;
    }
    return client.name;
  }
}

@Pipe({
  name: 'JSONStringify'
})
export class JSONStringifyPipe implements PipeTransform {
  transform(jsonPipe: string) {
    return JSON.stringify(JSON.parse(jsonPipe), null, 2);
  }
}

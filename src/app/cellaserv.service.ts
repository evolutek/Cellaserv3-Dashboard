import * as deepEqual from "deep-equal";

import { Injectable } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material';

import { Observable, throwError } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';

// TODO(halfr): move to cellaserv_api
import { Client } from './client';
import { Service } from './service';
import { Subscribers, NewSubscriber } from './subscribers';

class SubscribePattern<T> {
  name: string;
  data: T;
}

// TODO(halfr): make cs url configurable
const CELLASERV_ADDR = 'localhost:4280';

@Injectable({ providedIn: 'root' })
export class CellaservService {
  // Connection
  cellaservAddr = CELLASERV_ADDR;
  errorMsg: string = "";

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
  };

  cellaservSetup = () => {
    // Live updates, subscribe before sending seeding request to avoid race
    this.liveUpdate<Client>("client")
    this.liveUpdate<Service>("service")
    // Live updates: events
    this.subscribe<NewSubscriber>(`log.cellaserv.new-subscriber`)
      .subscribe(this.onNewSubscriber);
    this.subscribe<NewSubscriber>(`log.cellaserv.lost-subscriber`)
      .subscribe(this.onLostSubscriber);

    // Bootstrap cellaserv status with list requests
    this.request<Client[]>('cellaserv', 'list_clients')
      .subscribe(clients => {
	this.clients = clients;
	for (let client of clients) {
	  this.clientsMap.set(client.id, client);
	}
      });
    this.request<Service[]>('cellaserv', 'list_services')
      .subscribe(services => this.services = services);
    this.request<Subscribers[]>('cellaserv', 'list_events')
      .subscribe(subscribers => {
	// Store subscribers
	this.events = subscribers;

	// Seed list of logs
	for (let sub of subscribers) {
	  // Skip subscribers to non-logs
	  if (!sub.event.startsWith("log.")) {
	    continue;
	  }
	  this.addLogName(sub.event);
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
    const attr = what + "s";
    this.subscribe<T>(`log.cellaserv.new-${what}`)
      .subscribe(newElt => this[attr].push(newElt));
    this.subscribe<T>(`log.cellaserv.lost-${what}`)
      .subscribe(removedElt => this[attr]= this[attr].filter(elt => !deepEqual(elt, removedElt)));
  }

  onNewSubscriber = (newSub: NewSubscriber) => {
    for (let sub of this.events) {
      if (sub.event == newSub.event) {
	sub.subscribers.push(newSub.client);
	return;
      }
    }
    // Did not return early, this is a new event
    let newSubs: Subscribers = {
      event: newSub.event,
      subscribers: [newSub.client],
    };
    this.events.push(newSubs);
  }

  onLostSubscriber = (removedSub: NewSubscriber) => {
    for (let event of this.events) {
      if (event.event == removedSub.event) {
	let index = event.subscribers.indexOf(removedSub.client);
	event.subscribers.splice(index, 1);
	break;
      }
    }
  }

  // TODO(halfr): add overload for making request with data
  request<T>(service: string, method: string): Observable<T>{
    // TODO(halfr): add error handling
    const url = `http://${CELLASERV_ADDR}/api/v1/request/${service}/${method}`;
    return this.http.get<T>(url);
  }

  subscribePattern<T>(event: string): WebSocketSubject<SubscribePattern<T>>{
    const url = `ws://${CELLASERV_ADDR}/api/v1/subscribe/${event}`;
    return webSocket<SubscribePattern<T>>(url);
  }

  subscribe<T>(event: string): Observable<T>{
    return this.subscribePattern<T>(event)
      .pipe(map(log => log.data));
  }

  addLogName(logName: string) {
    if (this.logNames.indexOf(logName) == -1) {
      // Add new log name, discard data
      this.logNames.push(logName);
      this.logNames.sort();
    }
  }

  // Add log 
  addLog(log: SubscribePattern<any>) {
    let events = this.logsByName.get(log.name);
    if (events === undefined) {
      events = [];
      this.logsByName.set(log.name, events);
    }
    events.push(log);
    this.logs.push(log);
  }

  // Utility
  public isServicePresent(service: string): boolean {
    return this.services.some(srvc => srvc.name == service);
  }
}

@Pipe({
  name: 'clientName',
  pure: false
})
export class ClientNamePipe implements PipeTransform {
  constructor(private cs: CellaservService) { }

  transform(clientId: string) {
    let client = this.cs.clientsMap.get(clientId);
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

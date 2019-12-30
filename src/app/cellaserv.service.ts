import {Injectable, OnInit} from '@angular/core';
import {Pipe, PipeTransform} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import * as deepEqual from 'deep-equal';
import {Observable, throwError} from 'rxjs';
import {catchError, filter, map} from 'rxjs/operators';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

import {
  CellaservApiService,
  Client,
  NewSubscriber,
  Publish,
  Service,
  Subscribers
} from './cellaserv_api';

@Injectable({providedIn : 'root'})
export class CellaservService implements OnInit {
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
  logs: Publish<any>[] = [];

  constructor(private cs: CellaservApiService) {}

  ngOnInit() {
    console.log("Init");
    // First, check that we can query cellaserv, then do the setup
    this.cs.request('cellaserv', 'version')
        .subscribe(_ => this.cellaservSetup(),
                   error => this.errorMsg = error.message);
  }

  cellaservSetup =
      () => {
        // Live updates, subscribe before sending seeding request to avoid race
        this.cs.subscribe<NewSubscriber>(`log.cellaserv.new-subscriber`)
            .subscribe(this.onNewSubscriber);
        this.cs.subscribe<NewSubscriber>(`log.cellaserv.lost-subscriber`)
            .subscribe(this.onLostSubscriber);
        this.liveUpdate<Client>('client');
        this.liveUpdate<Service>('service');

        // Bootstrap cellaserv status with list requests
        this.cs.request<Client[]>('cellaserv', 'list_clients')
            .subscribe(clients => {
              this.clients = clients;
              for (const client of clients) {
                this.clientsMap.set(client.id, client);
              }
            });
        this.cs.request<Service[]>('cellaserv', 'list_services')
            .subscribe(services => this.services = services);
        this.cs.request<Subscribers[]>('cellaserv', 'list_events')
            .subscribe(events => {
              // Store subscribers
              events.forEach(event => event.subscribers.forEach(client => {
                const newSub:
                    NewSubscriber = {event : event.event, client : client};
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
        this.cs.subscribePattern<any>('log.*').subscribe(logEvent => {
          this.addLogName(logEvent.name);
          this.addLog(logEvent);
        });
      }

  liveUpdate<T>(what: string) {
    const attr = what + 's';
    console.log(this[attr]);
    this.cs.subscribe<T>(`log.cellaserv.new-${what}`).subscribe(newElt => {
      if (!this[attr].includes(newElt)) {
        this[attr].push(newElt);
      }
    });
    this.cs.subscribe<T>(`log.cellaserv.lost-${what}`)
        .subscribe(removedElt => this[attr] =
                       this[attr].filter(elt => !deepEqual(elt, removedElt)));
  }

  onNewSubscriber =
      (newSub: NewSubscriber) => {
        for (const sub of this.events) {
          if (sub.event === newSub.event) {
            sub.subscribers.push(newSub.client);
            return;
          }
        }
        // Did not return early, this is a new event
        const newSubs: Subscribers = {
          event : newSub.event,
          subscribers : [ newSub.client ],
        };
        this.events.push(newSubs);
      }

  onLostSubscriber =
      (removedSub: NewSubscriber) => {
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
      // New log name
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
}

@Pipe({name : 'clientName', pure : false})
export class ClientNamePipe implements PipeTransform {
  constructor(private cs: CellaservService) {}

  transform(clientId: string) {
    const client = this.cs.clientsMap.get(clientId);
    return (client === undefined) ? clientId : client.name;
  }
}

@Pipe({name : 'JSONStringify'})
export class JSONStringifyPipe implements PipeTransform {
  transform(jsonPipe: string) { return JSON.stringify(jsonPipe, null, 2); }
}

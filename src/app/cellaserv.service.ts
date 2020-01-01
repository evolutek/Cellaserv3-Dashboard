import {Injectable} from '@angular/core';
import {Pipe, PipeTransform} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import * as deepEqual from 'deep-equal';
import {from, Observable, of, throwError} from 'rxjs';
import {catchError, filter, map, switchMap, tap} from 'rxjs/operators';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

import {
  CellaservApiService,
  Publish,
} from './cellaserv_api';

class Client {
  id: string;
  name: string;
}

interface ApiService {
  client: string;
  name: string;
  identification: string;
}

type ListServiceResponseItem = ApiService;
type NewServicePublish = ApiService;

export class Service {
  client: string;
  name: string;
  identification: string;
  status: string;
  variables: {[name: string]: any};

  fqName() {
    let ret = this.name;
    if (this.identification) {
      ret += "." + this.identification;
    }
    return ret;
  }
}

class Subscribers {
  event: string;
  subscribers: string[];
}

class NewSubscriber {
  event: string;
  client: string;
}

class ServiceVariables {
  [name: string]: any
}

@Injectable({providedIn : 'root'})
export class CellaservService {
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

  constructor(private cs: CellaservApiService) {
    // First, check that we can query cellaserv, then do the setup
    this.cs.request('cellaserv', 'version')
        .subscribe(_ => this.cellaservSetup(),
                   error => this.errorMsg = error.message);
  }

  cellaservSetup =
      () => {
        this.setupPubsub();
        this.setupClients();
        this.setupServices();
      }

  setupPubsub() {
    this.cs.subscribe<NewSubscriber>(`log.cellaserv.new-subscriber`)
        .subscribe(this.onNewSubscriber);
    this.cs.subscribe<NewSubscriber>(`log.cellaserv.lost-subscriber`)
        .subscribe(this.onLostSubscriber);

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

  setupClients() {
    // Add
    this.cs.subscribe<Client>(`log.cellaserv.new-client`)
        .subscribe(newClient => {
          if (!this.clients.includes(newClient)) {
            this.clients.push(newClient);
          }
        });
    // Remove
    this.cs.subscribe<Client>(`log.cellaserv.lost-client`)
        .subscribe(removedClient => this.clients =
                       this.clients.filter(elt => elt.id != removedClient.id));

    // Seed
    this.cs.request<Client[]>('cellaserv', 'list_clients')
        .subscribe(clients => {
          for (const client of clients) {
            this.clientsMap.set(client.id, client);
          }

          this.clients = clients;
        });
  }

  setupServices() {
    // Add
    this.cs.subscribe<ListServiceResponseItem>(`log.cellaserv.new-service`)
        .pipe(map(data => Object.assign(new Service(), data) as Service))
        .subscribe(this.onNewService);

    // Remove
    this.cs.subscribe<Service>(`log.cellaserv.lost-service`)
        .subscribe(
            removedElt => this.services = this.services.filter(
                elt => !(elt.name == removedElt.name &&
                         elt.identification == removedElt.identification)));

    // Seed
    this.cs.request<ListServiceResponseItem[]>('cellaserv', 'list_services')
        .pipe(
            // unpack
            switchMap(from),
            // type cast
            map(data => Object.assign(new Service(), data) as Service))

        .subscribe(this.onNewService);
  }

  onNewService =
      (service: Service) => {
        this.cs
            .request<ServiceVariables>(service.name, "list_variables")
            // Catch error if service does not implement list_variables
            .pipe(catchError(error => of({} as ServiceVariables)))
            .subscribe(variables => {
              service.variables = variables;
              // Lookup status variable
              const statusVarName = service.fqName() + ".status"
              for (const var_name of Object.keys(variables)) {
                if (var_name == statusVarName) {
                  service.status = variables[var_name];
                  // Subscribe to updates
                  this.cs.subscribe<{[value: string] : any}>(statusVarName)
                      .subscribe(update => service.status = update.value);
                }
              }
              // Add to service list
              this.services.push(service);
            });
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

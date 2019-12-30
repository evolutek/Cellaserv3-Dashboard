import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable, OnInit} from '@angular/core';
import * as deepEqual from 'deep-equal';
import {Observable, throwError} from 'rxjs';
import {catchError, filter, map} from 'rxjs/operators';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

export class Client {
  id: string;
  name: string;
}

export class Service {
  client: string;
  name: string;
  identification: string;
}

export class Publish<T> {
  name: string;
  data: T;
}

export class Subscribers {
  event: string;
  subscribers: string[];
}

export class NewSubscriber {
  event: string;
  client: string;
}

@Injectable({providedIn : 'root'})
export class CellaservApiService {
  cellaservAddr: string = 'localhost:4280';
  errorMsg: string = '';

  constructor(private http: HttpClient) {}

  // Request without data
  public request<RepT>(service: string, method: string,
                       reqData?: any): Observable<RepT>;
  // Request with data
  public request<RepT>(service: string, method: string,
                       reqData: any): Observable<RepT> {
    const url =
        `http://${this.cellaservAddr}/api/v1/request/${service}/${method}`;
    console.log(url);
    if (reqData === undefined) {
      return this.http.get<RepT>(url);
    } else {
      return this.http.post<RepT>(url, reqData);
    }
  }

  subscribePattern<T>(event: string): Observable<Publish<T>> {
    const url = `ws://${this.cellaservAddr}/api/v1/subscribe/${event}`;
    return webSocket<Publish<string>>(url)
        .pipe(catchError(error => {
          if (error instanceof CloseEvent) {
            this.errorMsg = "Connection closed.";
            console.log('Connection to cellaserv was closed');
          } else {
            this.errorMsg = error;
            console.log(error);
          }
          return throwError(error);
        }))
        .pipe(map(publish => {
          const parsedData: T = JSON.parse(publish.data);
          const ret: Publish<T> = {name : publish.name, data : parsedData};
          return ret;
        }));
  }

  subscribe<T>(event: string): Observable<T> {
    return this.subscribePattern<T>(event).pipe(map(publish => publish.data));
  }
}

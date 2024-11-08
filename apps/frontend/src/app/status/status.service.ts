/* eslint-disable @typescript-eslint/no-explicit-any */
// progress.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { filter, map, Observable } from 'rxjs';
import { LedsStatus } from '@xmas-leds/api-interfaces';

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  private socket: Socket;

  constructor() {
    this.socket = io('/', { path: '/api/socket.io' }); // Use exact path as configured in NestJS gateway
  }

  // Observable for all messages
  private onMessage(): Observable<{ type: string; data: any }> {
    return new Observable((observer) => {
      this.socket.on('message', (message: { type: string; data: any }) => {
        observer.next(message);
      });
    });
  }

  // Observable for progress messages only
  onProgress(): Observable<number> {
    return this.onMessage().pipe(
      filter((message) => message.type === 'progress'),
      map((message) => message.data)
    );
  }

  // Observable for status messages only
  onStatus(): Observable<LedsStatus> {
    return this.onMessage().pipe(
      filter((message) => message.type === 'status'),
      map((message) => message.data)
    );
  }

  // Observable for success messages only
  onSuccess(): Observable<string> {
    return this.onMessage().pipe(
      filter((message) => message.type === 'success'),
      map((message) => message.data)
    );
  }

  // Observable for error messages only
  onError(): Observable<string> {
    return this.onMessage().pipe(
      filter((message) => message.type === 'error'),
      map((message) => message.data)
    );
  }
}

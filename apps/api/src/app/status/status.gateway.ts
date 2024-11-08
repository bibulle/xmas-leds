/* eslint-disable @typescript-eslint/no-explicit-any */
// progress.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { LedsStatus } from '@xmas-leds/api-interfaces';
import { Server } from 'socket.io';

@WebSocketGateway({
  path: '/api/socket.io', // Set the exact path for WebSocket connection, bypassing the global prefix
})
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: any) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected:', client.id);
  }

  // Méthode interne pour émettre un message avec un type et des données
  private emitMessage(type: string, data: any) {
    this.server.emit('message', { type, data });
  }

  // Méthode pour envoyer une mise à jour de la progression
  sendProgress(progress: number) {
    this.emitMessage('progress', progress);
  }

  // Méthode pour envoyer un statut
  sendStatus(status: LedsStatus) {
    this.emitMessage('status', status);
  }
  // Méthode pour envoyer un statut
  sendSuccess(success: string) {
    this.emitMessage('success', success);
  }

  // Méthode pour envoyer une erreur
  sendError(error: string) {
    this.emitMessage('error', error);
  }
}

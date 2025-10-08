import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*', // Permitir todas as origens
    credentials: false,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedClientsCount = 0;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Quando um cliente se conecta (SEM autenticação)
   */
  async handleConnection(socket: Socket) {
    this.connectedClientsCount++;
    this.logger.log(`New client connected (socket: ${socket.id})`);
    this.logger.log(`Total connected clients: ${this.connectedClientsCount}`);

    socket.emit('connected', { 
      message: 'Successfully connected to notifications',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Quando um cliente se desconecta
   */
  handleDisconnect(socket: Socket) {
    this.connectedClientsCount--;
    this.logger.log(`Client disconnected (socket: ${socket.id})`);
    this.logger.log(`Total connected clients: ${this.connectedClientsCount}`);
  }

  /**
   * Broadcast notificação para TODOS os clientes conectados
   */
  broadcastNotification(notification: any) {
    // Só enviar se houver clientes conectados
    if (this.connectedClientsCount === 0) {
      this.logger.debug(`⏭️  No clients connected, skipping notification broadcast`);
      return;
    }

    const connectedSockets = this.server?.sockets?.sockets?.size || 0;
    
    this.logger.log(`📢 Broadcasting notification to all clients`, {
      type: notification.type,
      message: notification.message,
      totalClients: this.connectedClientsCount,
      actualSockets: connectedSockets,
    });
    
    // Emitir para todos no namespace
    this.server.emit('notification', notification);
    
    this.logger.log(`✅ Notification broadcasted to ${connectedSockets} sockets`);
  }

  /**
   * Handler para ping/pong (manter conexão ativa)
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: Socket) {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  }

  /**
   * Obter estatísticas de conexões
   */
  getConnectionStats() {
    return {
      totalClients: this.connectedClientsCount,
    };
  }
}

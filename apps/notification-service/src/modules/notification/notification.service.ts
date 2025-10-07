import { Injectable, Logger } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

export interface NotificationPayload {
  type: string;
  message: string;
  taskId?: string;
  excludeUserId?: string; // ID do usuário que gerou a ação (frontend filtra)
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly notificationGateway: NotificationGateway) {}

  /**
   * Broadcast notificação para TODAS as aplicações conectadas
   */
  broadcast(notification: NotificationPayload): void {
    this.logger.log(`Broadcasting notification: ${notification.type}`);
    this.notificationGateway.broadcastNotification(notification);
  }
}

import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from '../notification/notification.service';
import {
  NotificationEventType,
  TaskCreatedEventDto,
  TaskUpdatedEventDto,
  TaskDeletedEventDto,
  TaskAssignedEventDto,
  CommentCreatedEventDto,
} from '@taskscore/types';

@Controller()
export class EventsConsumer {
  private readonly logger = new Logger(EventsConsumer.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Evento: Tarefa criada
   * Broadcast para TODAS as aplicações
   */
  @EventPattern(NotificationEventType.TaskCreated)
  async handleTaskCreated(@Payload() data: TaskCreatedEventDto) {
    this.logger.log(`Processing task.created event: ${data.taskId}`);

    try {
      this.notificationService.broadcast({
        type: 'TASK_CREATED',
        message: `Nova tarefa criada: "${data.title}"`,
        taskId: data.taskId,
        excludeUserId: data.createdBy, // Frontend irá filtrar este usuário
        metadata: {
          createdBy: data.createdBy,
          assignedTo: data.assignedTo,
        },
      });

      this.logger.log(`Task created notification broadcasted for task ${data.taskId}`);
    } catch (error) {
      this.logger.error(`Error processing task.created event: ${error}`);
    }
  }

  /**
   * Evento: Tarefa atualizada
   * Broadcast para TODAS as aplicações
   */
  @EventPattern(NotificationEventType.TaskUpdated)
  async handleTaskUpdated(@Payload() data: TaskUpdatedEventDto) {
    this.logger.log(`Processing task.updated event: ${data.taskId}`);

    try {
      this.notificationService.broadcast({
        type: 'TASK_UPDATED',
        message: `Tarefa atualizada: "${data.title}"`,
        taskId: data.taskId,
        excludeUserId: data.updatedBy, // Frontend irá filtrar este usuário
        metadata: {
          updatedBy: data.updatedBy,
          changes: data.changes,
        },
      });

      this.logger.log(`Task updated notification broadcasted for task ${data.taskId}`);
    } catch (error) {
      this.logger.error(`Error processing task.updated event: ${error}`);
    }
  }

  /**
   * Evento: Tarefa excluída
   * Broadcast para TODAS as aplicações
   */
  @EventPattern(NotificationEventType.TaskDeleted)
  async handleTaskDeleted(@Payload() data: TaskDeletedEventDto) {
    this.logger.log(`Processing task.deleted event: ${data.taskId}`);

    try {
      this.notificationService.broadcast({
        type: 'TASK_DELETED',
        message: `Tarefa excluída: "${data.title}"`,
        taskId: data.taskId,
        excludeUserId: data.deletedBy, // Frontend irá filtrar este usuário
        metadata: {
          deletedBy: data.deletedBy,
        },
      });

      this.logger.log(`Task deleted notification broadcasted for task ${data.taskId}`);
    } catch (error) {
      this.logger.error(`Error processing task.deleted event: ${error}`);
    }
  }

  /**
   * Evento: Usuário atribuído a tarefa
   * Broadcast para TODAS as aplicações
   */
  @EventPattern(NotificationEventType.TaskAssigned)
  async handleTaskAssigned(@Payload() data: TaskAssignedEventDto) {
    this.logger.log(`Processing task.assigned event: ${data.taskId}`);

    try {
      this.notificationService.broadcast({
        type: 'TASK_ASSIGNED',
        message: `Usuário(s) atribuído(s) à tarefa: "${data.title}"`,
        taskId: data.taskId,
        excludeUserId: data.assignedBy, // Frontend irá filtrar este usuário
        metadata: {
          assignedTo: data.assignedTo,
          assignedBy: data.assignedBy,
        },
      });

      this.logger.log(`Task assignment notification broadcasted for task ${data.taskId}`);
    } catch (error) {
      this.logger.error(`Error processing task.assigned event: ${error}`);
    }
  }

  /**
   * Evento: Novo comentário
   * Broadcast para TODAS as aplicações
   */
  @EventPattern(NotificationEventType.CommentCreated)
  async handleCommentCreated(@Payload() data: CommentCreatedEventDto) {
    this.logger.log(`Processing comment.created event: ${data.commentId} on task ${data.taskId}`);

    try {
      this.notificationService.broadcast({
        type: 'COMMENT_NEW',
        message: `${data.authorName} comentou em "${data.taskTitle}"`,
        taskId: data.taskId,
        excludeUserId: data.authorId, // Frontend irá filtrar este usuário
        metadata: {
          commentId: data.commentId,
          authorId: data.authorId,
          authorName: data.authorName,
        },
      });

      this.logger.log(`Comment notification broadcasted for task ${data.taskId}`);
    } catch (error) {
      this.logger.error(`Error processing comment.created event: ${error}`);
    }
  }
}

import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  TaskHistoryAction,
  createLogger,
  normalizeError,
} from '@taskscore/utils';
import {
  AssignUsersRequestDto,
  ChangeRecord,
  ChangeTaskStatusRequestDto,
  CommentListResponseDto,
  CreateCommentRequestDto,
  CreateTaskRequestDto,
  DeleteTaskRequestDto,
  GetTaskDetailsRequestDto,
  ListCommentsRequestDto,
  ListHistoryRequestDto,
  ListTasksRequestDto,
  TaskHistoryListResponseDto,
  TaskListResponseDto,
  TaskPriorityDto,
  TaskResponseDto,
  TaskStatusDto,
  UpdateTaskRequestDto,
  NotificationEventType,
} from '@taskscore/types';
import { PaginationMetadataDto } from '@taskscore/types';
import { TaskRepository } from './task.repository';
import {
  mapCommentsToResponse,
  mapHistoryToResponse,
  mapPriorityDtoToEntity,
  mapPriorityEntityToDto,
  mapStatusEntityToDto,
  mapStatusDtoToEntity,
  mapTaskEntityToDetails,
  mapTaskEntityToResponse,
} from './task.mapper';
import { TaskStatus } from '@taskscore/utils';

@Injectable()
export class TaskService {
  private readonly logger = createLogger({
    service: 'task-service',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(
    private readonly taskRepository: TaskRepository,
    @Inject('EVENTS_SERVICE') private readonly eventsClient: ClientProxy,
  ) {}

  async createTask(request: CreateTaskRequestDto, traceId: string): Promise<TaskResponseDto> {
    this.logger.info('Processing task creation', { traceId, title: request.data.title, userId: request.userId });

    try {
      const actorId = (request as any).actorId ?? request.userId;
      
      const dueDate = request.data.dueDate ? new Date(request.data.dueDate) : null;
      if (request.data.dueDate && Number.isNaN(dueDate?.getTime())) {
        this.logger.warn('Task creation failed: invalid due date', { traceId, title: request.data.title });
        throw new BadRequestException('Due date must be a valid date');
      }

      const task = await this.taskRepository.createTask({
        title: request.data.title,
        description: request.data.description ?? null,
        dueDate,
        priority: mapPriorityDtoToEntity(request.data.priority ?? TaskPriorityDto.Medium),
        status: mapStatusDtoToEntity(request.data.status ?? TaskStatusDto.Todo),
        createdBy: actorId,
        meta: request.data.meta ?? null,
        assigneeIds: request.assigneeIds ?? [],
      });

      const result = mapTaskEntityToResponse(task);
      this.logger.info('Task creation completed successfully', { traceId, taskId: result.id, title: result.title });
      
      // Publicar evento de tarefa criada
      try {
        this.eventsClient.emit(NotificationEventType.TaskCreated, {
          taskId: task.id,
          title: task.title,
          createdBy: actorId,
          assignedTo: task.assignments?.map(a => a.userId) || [],
        });
        this.logger.debug('Task created event published', { taskId: task.id });
      } catch (error) {
        this.logger.error('Failed to publish task created event', { error, taskId: task.id });
      }
      
      return result;
    } catch (error: any) {
      this.logger.error('Task creation failed', {
        traceId,
        title: request.data.title,
        userId: request.userId,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'Task creation failed' });
    }
  }

  async listTasks(request: ListTasksRequestDto, traceId: string): Promise<TaskListResponseDto> {
    this.logger.info('Processing task listing', { traceId, page: request.page, limit: request.limit, status: request.status });

    try {
      const page = this.normalizePage(request.page);
      const limit = this.normalizeLimit(request.limit);

      const tasksResult = await this.taskRepository.listTasks({
        page,
        limit,
        status: request.status ? mapStatusDtoToEntity(request.status) : undefined,
        priority: request.priority ? mapPriorityDtoToEntity(request.priority) : undefined,
        search: request.search,
        assignedTo: request.assignedTo,
        createdBy: request.createdBy,
      });

      const data = tasksResult.data.map(mapTaskEntityToResponse);

      const meta = this.buildPaginationMeta({
        page,
        limit,
        total: tasksResult.total,
      });

      const result = {
        data,
        meta,
        success: true,
        message: null,
        error: null,
      };

      this.logger.info('Task listing completed successfully', { traceId, total: meta.total, page: meta.page, returned: data.length });
      return result;
    } catch (error: any) {
      this.logger.error('Task listing failed', {
        traceId,
        page: request.page,
        limit: request.limit,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'Task listing failed' });
    }
  }

  async getTaskDetails(request: GetTaskDetailsRequestDto, traceId: string) {
    this.logger.info('Processing task details retrieval', { traceId, taskId: request.taskId });

    try {
      const task = await this.taskRepository.findTaskDetailsOrFail(request.taskId);
      const result = mapTaskEntityToDetails(task);
      this.logger.info('Task details retrieval completed successfully', { traceId, taskId: request.taskId, title: result.title });
      return result;
    } catch (error: any) {
      this.logger.error('Task details retrieval failed', {
        traceId,
        taskId: request.taskId,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'Task details retrieval failed' });
    }
  }

  async updateTask(request: UpdateTaskRequestDto, traceId: string): Promise<TaskResponseDto> {
    this.logger.info('Processing task update', { traceId, taskId: request.taskId, userId: request.userId });

    try {
      const task = await this.taskRepository.findTaskSummaryOrFail(request.taskId);
      const actorId = (request as any).actorId ?? (request as any).userId;

      const changeSet: ChangeRecord[] = [];
      let statusChanged = false;
      let previousStatus: TaskStatus | null = null;

    if (typeof request.data.title !== 'undefined' && request.data.title !== task.title) {
      changeSet.push({ field: 'title', from: task.title, to: request.data.title });
      task.title = request.data.title;
    }

    if (typeof request.data.description !== 'undefined' && request.data.description !== task.description) {
      changeSet.push({ field: 'description', from: task.description ?? null, to: request.data.description ?? null });
      task.description = request.data.description ?? null;
    }

    if (typeof request.data.meta !== 'undefined') {
      const currentMeta = task.meta ?? null;
      const nextMeta = request.data.meta ?? null;
      if (JSON.stringify(currentMeta) !== JSON.stringify(nextMeta)) {
        changeSet.push({ field: 'meta', from: currentMeta, to: nextMeta });
        task.meta = nextMeta;
      }
    }

    if (typeof request.data.dueDate !== 'undefined') {
      const nextDueDate = request.data.dueDate ? new Date(request.data.dueDate) : null;
      if (request.data.dueDate && Number.isNaN(nextDueDate?.getTime())) {
        throw new BadRequestException('Due date must be a valid date');
      }

      const currentTime = task.dueDate?.getTime() ?? null;
      const nextTime = nextDueDate?.getTime() ?? null;
      if (currentTime !== nextTime) {
        changeSet.push({
          field: 'dueDate',
          from: task.dueDate ? task.dueDate.toISOString() : null,
          to: nextDueDate ? nextDueDate.toISOString() : null,
        });
        task.dueDate = nextDueDate;
      }
    }

    if (typeof request.data.priority !== 'undefined') {
      const nextPriority = mapPriorityDtoToEntity(request.data.priority);
      if (nextPriority !== task.priority) {
        changeSet.push({
          field: 'priority',
          from: mapPriorityEntityToDto(task.priority),
          to: request.data.priority,
        });
        task.priority = nextPriority;
      }
    }

    if (typeof request.data.status !== 'undefined') {
      const nextStatus = mapStatusDtoToEntity(request.data.status);
      if (nextStatus !== task.status) {
        statusChanged = true;
        previousStatus = task.status;
        changeSet.push({
          field: 'status',
          from: mapStatusEntityToDto(previousStatus),
          to: request.data.status,
        });
        task.status = nextStatus;
        if (nextStatus === TaskStatus.Done) {
          task.completedAt = new Date();
        } else {
          task.completedAt = null;
        }
      }
    }

      if (!changeSet.length) {
        this.logger.info('No changes detected on task update', {
          traceId,
          taskId: task.id,
        });
        return mapTaskEntityToResponse(task);
      }

      task.updatedBy = actorId;

      const savedTask = await this.taskRepository.saveTask(task);

      if (statusChanged && previousStatus !== null) {
        await this.taskRepository.createHistoryEntry({
          taskId: task.id,
          action: TaskHistoryAction.StatusChanged,
          performedBy: actorId,
          description: 'Task status updated',
          metadata: {
            from: mapStatusEntityToDto(previousStatus),
            to: mapStatusEntityToDto(task.status),
          },
        });
      }

      const otherChanges = statusChanged
        ? changeSet.filter((change) => change.field !== 'status')
        : changeSet;

      if (otherChanges.length) {
        await this.taskRepository.createHistoryEntry({
          taskId: task.id,
          action: TaskHistoryAction.Updated,
          performedBy: actorId,
          description: 'Task updated',
          metadata: {
            changes: otherChanges,
          },
        });
      }

      const result = mapTaskEntityToResponse(savedTask);
      this.logger.info('Task update completed successfully', { traceId, taskId: request.taskId, changesCount: changeSet.length });
      
      // Publicar evento de tarefa atualizada
      if (changeSet.length > 0) {
        try {
          const participantIds = [...new Set([
            savedTask.createdBy,
            ...(savedTask.assignments?.map(a => a.userId) || [])
          ])];
          
          this.eventsClient.emit(NotificationEventType.TaskUpdated, {
            taskId: savedTask.id,
            title: savedTask.title,
            updatedBy: actorId,
            changes: { 
              changeSet,
              participantIds: participantIds.filter(id => id !== actorId)
            },
          });
          this.logger.debug('Task updated event published', { taskId: savedTask.id });
        } catch (error) {
          this.logger.error('Failed to publish task updated event', { error, taskId: savedTask.id });
        }
      }
      
      return result;
    } catch (error: any) {
      this.logger.error('Task update failed', {
        traceId,
        taskId: request.taskId,
        userId: request.userId,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'Task update failed' });
    }
  }

  async deleteTask(request: DeleteTaskRequestDto, traceId: string): Promise<void> {
    this.logger.info('Processing task deletion', { traceId, taskId: request.taskId, userId: request.userId });

    try {
      const actorId = (request as any).actorId ?? (request as any).userId;
      await this.taskRepository.deleteTask({ taskId: request.taskId });
      this.logger.warn('Task deletion completed successfully', { traceId, taskId: request.taskId, userId: actorId });
    } catch (error: any) {
      this.logger.error('Task deletion failed', {
        traceId,
        taskId: request.taskId,
        userId: request.userId,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'Task deletion failed' });
    }
  }

  async createComment(request: CreateCommentRequestDto, traceId: string) {
    this.logger.info('Processing comment creation', { traceId, taskId: request.taskId, userId: request.userId });

    try {
      const actorId = (request as any).actorId ?? (request as any).userId;
      await this.taskRepository.findTaskSummaryOrFail(request.taskId);

      await this.taskRepository.addComment({
        taskId: request.taskId,
        authorId: actorId,
        content: request.data.content,
      });

      const updatedTask = await this.taskRepository.findTaskDetailsOrFail(request.taskId);
      const result = mapTaskEntityToDetails(updatedTask);
      this.logger.info('Comment creation completed successfully', { traceId, taskId: request.taskId, userId: actorId });
      
      // Publicar evento de novo comentário
      try {
        const participantIds = [...new Set([
          updatedTask.createdBy,
          ...(updatedTask.assignments?.map(a => a.userId) || [])
        ])];
        
        const lastComment = updatedTask.comments?.[updatedTask.comments.length - 1];
        
        this.eventsClient.emit(NotificationEventType.CommentCreated, {
          taskId: updatedTask.id,
          taskTitle: updatedTask.title,
          commentId: lastComment?.id || '',
          authorId: actorId,
          authorName: lastComment?.author?.username || lastComment?.author?.email || 'Unknown',
          participants: participantIds.filter(id => id !== actorId),
        });
        this.logger.debug('Comment created event published', { taskId: updatedTask.id });
      } catch (error) {
        this.logger.error('Failed to publish comment created event', { error, taskId: updatedTask.id });
      }
      
      return result;
    } catch (error: any) {
      this.logger.error('Comment creation failed', {
        traceId,
        taskId: request.taskId,
        userId: request.userId,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'Comment creation failed' });
    }
  }

  async listComments(request: ListCommentsRequestDto, traceId: string): Promise<CommentListResponseDto> {
    this.logger.info('Processing comment listing', { traceId, taskId: request.taskId, page: request.page });

    try {
      const page = this.normalizePage(request.page);
      const limit = this.normalizeLimit(request.limit);

      await this.taskRepository.findTaskSummaryOrFail(request.taskId);

      const result = await this.taskRepository.listComments({
        taskId: request.taskId,
        page,
        limit,
      });

      const meta = this.buildPaginationMeta({
        page,
        limit,
        total: result.total,
      });

      const response = {
        data: mapCommentsToResponse(result.data),
        meta,
        success: true,
        message: null,
        error: null,
      };

      this.logger.info('Comment listing completed successfully', { traceId, taskId: request.taskId, total: meta.total, returned: result.data.length });
      return response;
    } catch (error: any) {
      this.logger.error('Comment listing failed', {
        traceId,
        taskId: request.taskId,
        page: request.page,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'Comment listing failed' });
    }
  }

  async assignUsers(request: AssignUsersRequestDto, traceId: string): Promise<TaskResponseDto> {
    this.logger.info('Processing user assignment', { traceId, taskId: request.taskId, userId: request.userId, assigneeCount: request.userIds.length });

    try {
      const actorId = (request as any).actorId ?? (request as any).userId;
      await this.taskRepository.findTaskSummaryOrFail(request.taskId);

      const assignResult = await this.taskRepository.assignUsers({
        taskId: request.taskId,
        userId: actorId,
        userIds: request.userIds,
      });

      const task = await this.taskRepository.findTaskSummaryOrFail(request.taskId);
      task.assignments = assignResult.assignments;

      const result = mapTaskEntityToResponse(task);
      this.logger.info('User assignment completed successfully', { traceId, taskId: request.taskId, added: assignResult.added.length, removed: assignResult.removed.length });
      
      // Publicar evento de atribuição de usuários
      if (assignResult.added.length > 0) {
        try {
          this.eventsClient.emit(NotificationEventType.TaskAssigned, {
            taskId: task.id,
            title: task.title,
            assignedTo: assignResult.added,
            assignedBy: actorId,
          });
          this.logger.debug('Task assigned event published', { taskId: task.id });
        } catch (error) {
          this.logger.error('Failed to publish task assigned event', { error, taskId: task.id });
        }
      }
      
      return result;
    } catch (error: any) {
      this.logger.error('User assignment failed', {
        traceId,
        taskId: request.taskId,
        userId: request.userId,
        assigneeCount: request.userIds.length,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'User assignment failed' });
    }
  }

  async changeStatus(request: ChangeTaskStatusRequestDto, traceId: string): Promise<TaskResponseDto> {
    this.logger.info('Processing status change', { traceId, taskId: request.taskId, status: request.status });

    try {
      const actorId = (request as any).actorId ?? (request as any).userId;
      const task = await this.taskRepository.changeStatus({
        taskId: request.taskId,
        userId: actorId,
        status: mapStatusDtoToEntity(request.status),
        description: request.reason,
      });

      const result = mapTaskEntityToResponse(task);
      this.logger.info('Status change completed successfully', { traceId, taskId: request.taskId, status: request.status });
      return result;
    } catch (error: any) {
      this.logger.error('Status change failed', {
        traceId,
        taskId: request.taskId,
        status: request.status,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'Status change failed' });
    }
  }

  async listHistory(request: ListHistoryRequestDto, traceId: string): Promise<TaskHistoryListResponseDto> {
    this.logger.info('Processing history listing', { traceId, taskId: request.taskId, page: request.page });

    try {
      const page = this.normalizePage(request.page);
      const limit = this.normalizeLimit(request.limit);

      await this.taskRepository.findTaskSummaryOrFail(request.taskId);

      const result = await this.taskRepository.listHistory({
        taskId: request.taskId,
        page,
        limit,
      });

      const meta = this.buildPaginationMeta({
        page,
        limit,
        total: result.total,
      });

      const response = {
        data: mapHistoryToResponse(result.data),
        meta,
        success: true,
        message: null,
        error: null,
      };

      this.logger.info('History listing completed successfully', { traceId, taskId: request.taskId, total: meta.total, returned: result.data.length });
      return response;
    } catch (error: any) {
      this.logger.error('History listing failed', {
        traceId,
        taskId: request.taskId,
        page: request.page,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'History listing failed' });
    }
  }

  private normalizePage(page?: number): number {
    if (!page || Number.isNaN(page) || page < 1) {
      return 1;
    }
    return Math.floor(page);
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || Number.isNaN(limit) || limit < 1) {
      return 10;
    }
    const normalized = Math.min(Math.floor(limit), 100);
    return normalized;
  }

  private buildPaginationMeta({ page, limit, total }: { page: number; limit: number; total: number }): PaginationMetadataDto {
    const totalPages = Math.max(1, Math.ceil(total / limit || 1));
    return {
      page,
      limit,
      total,
      totalPages,
    };
  }
}

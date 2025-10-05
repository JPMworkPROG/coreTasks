import { Injectable, BadRequestException } from '@nestjs/common';
import {
  TaskHistoryAction,
  createLogger,
} from '@taskscore/utils';
import {
  AssignUsersRequestDto,
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

interface ChangeRecord {
  field: string;
  from: unknown;
  to: unknown;
}

@Injectable()
export class TaskService {
  private readonly logger = createLogger({
    service: 'task-service',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(request: CreateTaskRequestDto, correlationId: string): Promise<TaskResponseDto> {
    this.logger.info('Creating task', {
      correlationId,
      actorId: request.actorId,
      title: request.data.title,
    });

    const dueDate = request.data.dueDate ? new Date(request.data.dueDate) : null;
    if (request.data.dueDate && Number.isNaN(dueDate?.getTime())) {
      throw new BadRequestException('Due date must be a valid date');
    }

    const task = await this.taskRepository.createTask({
      title: request.data.title,
      description: request.data.description ?? null,
      dueDate,
      priority: mapPriorityDtoToEntity(request.data.priority ?? TaskPriorityDto.Medium),
      status: mapStatusDtoToEntity(request.data.status ?? TaskStatusDto.Todo),
      createdBy: request.actorId,
      meta: request.data.meta ?? null,
      assigneeIds: request.assigneeIds ?? [],
    });

    return mapTaskEntityToResponse(task);
  }

  async listTasks(request: ListTasksRequestDto, correlationId: string): Promise<TaskListResponseDto> {
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

    return {
      data,
      meta,
      success: true,
      message: null,
      error: null,
    };
  }

  async getTaskDetails(request: GetTaskDetailsRequestDto, correlationId: string) {
    this.logger.debug('Fetching task details', {
      correlationId,
      taskId: request.taskId,
    });

    const task = await this.taskRepository.findTaskDetailsOrFail(request.taskId);
    return mapTaskEntityToDetails(task);
  }

  async updateTask(request: UpdateTaskRequestDto, correlationId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findTaskSummaryOrFail(request.taskId);

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
      this.logger.debug('No changes detected on task update', {
        correlationId,
        taskId: task.id,
      });
      return mapTaskEntityToResponse(task);
    }

    task.updatedBy = request.actorId;

    const savedTask = await this.taskRepository.saveTask(task);

    if (statusChanged && previousStatus !== null) {
      await this.taskRepository.createHistoryEntry({
        taskId: task.id,
        action: TaskHistoryAction.StatusChanged,
        performedBy: request.actorId,
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
        performedBy: request.actorId,
        description: 'Task updated',
        metadata: {
          changes: otherChanges,
        },
      });
    }

    return mapTaskEntityToResponse(savedTask);
  }

  async deleteTask(request: DeleteTaskRequestDto, correlationId: string): Promise<void> {
    this.logger.info('Deleting task', {
      correlationId,
      taskId: request.taskId,
      actorId: request.actorId,
    });

    await this.taskRepository.deleteTask({ taskId: request.taskId });
  }

  async createComment(request: CreateCommentRequestDto, correlationId: string) {
    await this.taskRepository.findTaskSummaryOrFail(request.taskId);

    await this.taskRepository.addComment({
      taskId: request.taskId,
      authorId: request.actorId,
      content: request.data.content,
    });

    const updatedTask = await this.taskRepository.findTaskDetailsOrFail(request.taskId);
    return mapTaskEntityToDetails(updatedTask);
  }

  async listComments(request: ListCommentsRequestDto, correlationId: string): Promise<CommentListResponseDto> {
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

    return {
      data: mapCommentsToResponse(result.data),
      meta,
      success: true,
      message: null,
      error: null,
    };
  }

  async assignUsers(request: AssignUsersRequestDto, correlationId: string): Promise<TaskResponseDto> {
    await this.taskRepository.findTaskSummaryOrFail(request.taskId);

    const assignResult = await this.taskRepository.assignUsers({
      taskId: request.taskId,
      actorId: request.actorId,
      userIds: request.userIds,
    });

    const task = await this.taskRepository.findTaskSummaryOrFail(request.taskId);
    task.assignments = assignResult.assignments;

    return mapTaskEntityToResponse(task);
  }

  async changeStatus(request: ChangeTaskStatusRequestDto, correlationId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.changeStatus({
      taskId: request.taskId,
      actorId: request.actorId,
      status: mapStatusDtoToEntity(request.status),
      description: request.reason,
    });

    return mapTaskEntityToResponse(task);
  }

  async listHistory(request: ListHistoryRequestDto, correlationId: string): Promise<TaskHistoryListResponseDto> {
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

    return {
      data: mapHistoryToResponse(result.data),
      meta,
      success: true,
      message: null,
      error: null,
    };
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

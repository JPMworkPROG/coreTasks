import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { createLogger, normalizeError } from '@taskscore/utils';
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
  TaskRequestsRPCMessage,
  TaskResponseDto,
  UpdateTaskRequestDto,
} from '@taskscore/types';
import { TaskService } from './task.service';

@Controller()
export class TaskController {
  private readonly logger = createLogger({
    service: 'task-controller',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly taskService: TaskService) {}

  @MessagePattern(TaskRequestsRPCMessage.CreateTask)
  async createTask(data: { payload: CreateTaskRequestDto; correlationId: string }): Promise<TaskResponseDto> {
    const { payload, correlationId } = data;
    this.logger.info('RPC: create task request received', {
      correlationId,
      title: payload.data.title,
      actorId: payload.actorId,
    });

    try {
      return await this.taskService.createTask(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: create task failed', {
        correlationId,
        title: payload.data.title,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to create task',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.ListTasks)
  async listTasks(data: { payload: ListTasksRequestDto; correlationId: string }): Promise<TaskListResponseDto> {
    const { payload, correlationId } = data;
    this.logger.debug('RPC: list tasks request received', {
      correlationId,
      page: payload.page,
      limit: payload.limit,
      status: payload.status,
    });

    try {
      return await this.taskService.listTasks(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: list tasks failed', {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to list tasks',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.GetTaskDetails)
  async getTaskDetails(data: { payload: GetTaskDetailsRequestDto; correlationId: string }) {
    const { payload, correlationId } = data;
    this.logger.debug('RPC: get task details request received', {
      correlationId,
      taskId: payload.taskId,
    });

    try {
      return await this.taskService.getTaskDetails(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: get task details failed', {
        correlationId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to fetch task details',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.UpdateTask)
  async updateTask(data: { payload: UpdateTaskRequestDto; correlationId: string }): Promise<TaskResponseDto> {
    const { payload, correlationId } = data;
    this.logger.info('RPC: update task request received', {
      correlationId,
      taskId: payload.taskId,
      actorId: payload.actorId,
    });

    try {
      return await this.taskService.updateTask(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: update task failed', {
        correlationId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to update task',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.DeleteTask)
  async deleteTask(data: { payload: DeleteTaskRequestDto; correlationId: string }): Promise<void> {
    const { payload, correlationId } = data;
    this.logger.warn('RPC: delete task request received', {
      correlationId,
      taskId: payload.taskId,
      actorId: payload.actorId,
    });

    try {
      await this.taskService.deleteTask(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: delete task failed', {
        correlationId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to delete task',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.CreateComment)
  async createComment(data: { payload: CreateCommentRequestDto; correlationId: string }) {
    const { payload, correlationId } = data;
    this.logger.info('RPC: create comment request received', {
      correlationId,
      taskId: payload.taskId,
      actorId: payload.actorId,
    });

    try {
      return await this.taskService.createComment(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: create comment failed', {
        correlationId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to create comment',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.ListComments)
  async listComments(data: { payload: ListCommentsRequestDto; correlationId: string }): Promise<CommentListResponseDto> {
    const { payload, correlationId } = data;
    this.logger.debug('RPC: list comments request received', {
      correlationId,
      taskId: payload.taskId,
      page: payload.page,
    });

    try {
      return await this.taskService.listComments(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: list comments failed', {
        correlationId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to list comments',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.AssignUsers)
  async assignUsers(data: { payload: AssignUsersRequestDto; correlationId: string }): Promise<TaskResponseDto> {
    const { payload, correlationId } = data;
    this.logger.info('RPC: assign users request received', {
      correlationId,
      taskId: payload.taskId,
      actorId: payload.actorId,
      assignees: payload.userIds.length,
    });

    try {
      return await this.taskService.assignUsers(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: assign users failed', {
        correlationId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to assign users',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.ChangeStatus)
  async changeStatus(data: { payload: ChangeTaskStatusRequestDto; correlationId: string }): Promise<TaskResponseDto> {
    const { payload, correlationId } = data;
    this.logger.info('RPC: change task status request received', {
      correlationId,
      taskId: payload.taskId,
      status: payload.status,
    });

    try {
      return await this.taskService.changeStatus(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: change task status failed', {
        correlationId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to change task status',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.ListHistory)
  async listHistory(data: { payload: ListHistoryRequestDto; correlationId: string }): Promise<TaskHistoryListResponseDto> {
    const { payload, correlationId } = data;
    this.logger.debug('RPC: list history request received', {
      correlationId,
      taskId: payload.taskId,
      page: payload.page,
    });

    try {
      return await this.taskService.listHistory(payload, correlationId);
    } catch (error) {
      this.logger.error('RPC: list history failed', {
        correlationId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to list task history',
      });
    }
  }
}

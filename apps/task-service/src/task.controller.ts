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
  async createTask(data: { payload: CreateTaskRequestDto; traceId: string }): Promise<TaskResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('RPC: create task request received', {
      traceId,
      title: payload.data.title,
      userId: payload.userId,
    });

    try {
      return await this.taskService.createTask(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: create task failed', {
        traceId,
        title: payload.data.title,
        error: error instanceof Error ? error.stack : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to create task',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.ListTasks)
  async listTasks(data: { payload: ListTasksRequestDto; traceId: string }): Promise<TaskListResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('RPC: list tasks request received', {
      traceId,
      page: payload.page,
      limit: payload.limit,
      status: payload.status,
    });

    try {
      return await this.taskService.listTasks(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: list tasks failed', {
        traceId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to list tasks',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.GetTaskDetails)
  async getTaskDetails(data: { payload: GetTaskDetailsRequestDto; traceId: string }) {
    const { payload, traceId } = data;
    this.logger.info('RPC: get task details request received', {
      traceId,
      taskId: payload.taskId,
    });

    try {
      return await this.taskService.getTaskDetails(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: get task details failed', {
        traceId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to fetch task details',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.UpdateTask)
  async updateTask(data: { payload: UpdateTaskRequestDto; traceId: string }): Promise<TaskResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('RPC: update task request received', {
      traceId,
      taskId: payload.taskId,
      userId: payload.userId,
    });

    try {
      return await this.taskService.updateTask(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: update task failed', {
        traceId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to update task',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.DeleteTask)
  async deleteTask(data: { payload: DeleteTaskRequestDto; traceId: string }): Promise<void> {
    const { payload, traceId } = data;
    this.logger.warn('RPC: delete task request received', {
      traceId,
      taskId: payload.taskId,
      userId: payload.userId,
    });

    try {
      await this.taskService.deleteTask(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: delete task failed', {
        traceId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to delete task',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.CreateComment)
  async createComment(data: { payload: CreateCommentRequestDto; traceId: string }) {
    const { payload, traceId } = data;
    this.logger.info('RPC: create comment request received', {
      traceId,
      taskId: payload.taskId,
      userId: payload.userId,
    });

    try {
      return await this.taskService.createComment(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: create comment failed', {
        traceId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to create comment',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.ListComments)
  async listComments(data: { payload: ListCommentsRequestDto; traceId: string }): Promise<CommentListResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('RPC: list comments request received', {
      traceId,
      taskId: payload.taskId,
      page: payload.page,
    });

    try {
      return await this.taskService.listComments(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: list comments failed', {
        traceId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to list comments',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.AssignUsers)
  async assignUsers(data: { payload: AssignUsersRequestDto; traceId: string }): Promise<TaskResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('RPC: assign users request received', {
      traceId,
      taskId: payload.taskId,
      userId: payload.userId,
      assignees: payload.userIds.length,
    });

    try {
      return await this.taskService.assignUsers(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: assign users failed', {
        traceId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to assign users',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.ChangeStatus)
  async changeStatus(data: { payload: ChangeTaskStatusRequestDto; traceId: string }): Promise<TaskResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('RPC: change task status request received', {
      traceId,
      taskId: payload.taskId,
      status: payload.status,
    });

    try {
      return await this.taskService.changeStatus(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: change task status failed', {
        traceId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to change task status',
      });
    }
  }

  @MessagePattern(TaskRequestsRPCMessage.ListHistory)
  async listHistory(data: { payload: ListHistoryRequestDto; traceId: string }): Promise<TaskHistoryListResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('RPC: list history request received', {
      traceId,
      taskId: payload.taskId,
      page: payload.page,
    });

    try {
      return await this.taskService.listHistory(payload, traceId);
    } catch (error) {
      this.logger.error('RPC: list history failed', {
        traceId,
        taskId: payload.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Failed to list task history',
      });
    }
  }
}

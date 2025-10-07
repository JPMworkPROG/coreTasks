import { Injectable } from '@nestjs/common';
import { createLogger } from '@taskscore/utils';
import {
  AssignUsersBodyDto,
  AssignUsersRequestDto,
  ChangeTaskStatusBodyDto,
  ChangeTaskStatusRequestDto,
  CommentListResponseDto,
  CreateCommentBodyDto,
  CreateCommentRequestDto,
  CreateTaskBodyDto,
  CreateTaskRequestDto,
  DeleteTaskRequestDto,
  GetTaskDetailsRequestDto,
  ListCommentsRequestDto,
  ListHistoryRequestDto,
  ListTasksRequestDto,
  TaskDetailsResponseDto,
  TaskHistoryListResponseDto,
  TaskListResponseDto,
  TaskRequestsRPCMessage,
  TaskResponseDto,
  UpdateTaskBodyDto,
  UpdateTaskRequestDto,
} from '@taskscore/types';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { GatewayEnv } from '../../config/envLoader.config';

@Injectable()
export class TaskService {
  private readonly tasksQueue = this.configService.get('rabbitmq.queues.tasks', { infer: true });
  private readonly logger = createLogger({
    service: 'task-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly rabbitMQService: RabbitMQService, private readonly configService: ConfigService<GatewayEnv, true>) { }

  async createTask(body: CreateTaskBodyDto, userId: string, traceId: string): Promise<TaskResponseDto> {
    const payload: any = { data: body, userId };

    try {
      const result = await this.rabbitMQService.sendToQueue<CreateTaskRequestDto, TaskResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.CreateTask,
        payload,
        traceId,
      );
      this.logger.info('Create task request forwarded successfully', { traceId, title: body.title });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward create task request', { traceId, error: error.message });
      throw error;
    }
  }

  async listTasks(filters: ListTasksRequestDto, traceId: string): Promise<TaskListResponseDto> {
    const payload: ListTasksRequestDto = { ...filters };

    try {
      const result = await this.rabbitMQService.sendToQueue<ListTasksRequestDto, TaskListResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.ListTasks,
        payload,
        traceId,
      );
      this.logger.debug('List tasks request forwarded successfully', { traceId, page: filters.page, limit: filters.limit });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward list tasks request', { traceId, error: error.message });
      throw error;
    }
  }

  async getTaskDetails(taskId: string, traceId: string): Promise<TaskDetailsResponseDto> {
    const payload: GetTaskDetailsRequestDto = { taskId };

    try {
      const result = await this.rabbitMQService.sendToQueue<GetTaskDetailsRequestDto, TaskDetailsResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.GetTaskDetails,
        payload,
        traceId,
      );
      this.logger.debug('Get task details request forwarded successfully', { traceId, taskId });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward get task details request', { traceId, taskId, error: error.message });
      throw error;
    }
  }

  async updateTask(taskId: string, body: UpdateTaskBodyDto, userId: string, traceId: string): Promise<TaskResponseDto> {
    const payload: any = { taskId, data: body, userId};

    try {
      const result = await this.rabbitMQService.sendToQueue<UpdateTaskRequestDto, TaskResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.UpdateTask,
        payload,
        traceId,
      );
      this.logger.info('Update task request forwarded successfully', { traceId, taskId, userId });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward update task request', { traceId, taskId, error: error.message });
      throw error;
    }
  }

  async deleteTask(taskId: string, userId: string, traceId: string): Promise<void> {
    const payload: any = { taskId, userId };

    try {
      await this.rabbitMQService.sendToQueue<DeleteTaskRequestDto, void>(
        this.tasksQueue,
        TaskRequestsRPCMessage.DeleteTask,
        payload,
        traceId,
      );
      this.logger.warn('Delete task request forwarded successfully', { traceId, taskId, userId });
    } catch (error: any) {
      this.logger.error('Failed to forward delete task request', { traceId, taskId, error: error.message });
      throw error;
    }
  }

  async createComment(taskId: string, body: CreateCommentBodyDto, userId: string, traceId: string): Promise<TaskDetailsResponseDto> {
    const payload: any = { taskId, data: body, userId };

    try {
      const result = await this.rabbitMQService.sendToQueue<CreateCommentRequestDto, TaskDetailsResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.CreateComment,
        payload,
        traceId,
      );
      this.logger.info('Create comment request forwarded successfully', { traceId, taskId, userId });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward create comment request', { traceId, taskId, error: error.message });
      throw error;
    }
  }

  async listComments(params: Omit<ListCommentsRequestDto, 'taskId'>, taskId: string, traceId: string): Promise<CommentListResponseDto> {
    const payload: ListCommentsRequestDto = { taskId, page: params.page, limit: params.limit };

    try {
      const result = await this.rabbitMQService.sendToQueue<ListCommentsRequestDto, CommentListResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.ListComments,
        payload,
        traceId,
      );
      this.logger.debug('List comments request forwarded successfully', { traceId, taskId, page: params.page, limit: params.limit });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward list comments request', { traceId, taskId, error: error.message });
      throw error;
    }
  }

  async assignUsers(taskId: string, body: AssignUsersBodyDto, userId: string, traceId: string): Promise<TaskResponseDto> {
    const payload: any = { taskId, userId, userIds: body.userIds };

    try {
      const result = await this.rabbitMQService.sendToQueue<AssignUsersRequestDto, TaskResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.AssignUsers,
        payload,
        traceId,
      );
      this.logger.info('Assign users request forwarded successfully', { traceId, taskId, userId, users: body.userIds.length });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward assign users request', { traceId, taskId, error: error.message });
      throw error;
    }
  }

  async changeStatus(taskId: string, body: ChangeTaskStatusBodyDto, userId: string, traceId: string): Promise<TaskResponseDto> {
    const payload: any = { taskId, userId, status: body.status, reason: body.reason };

    try {
      const result = await this.rabbitMQService.sendToQueue<ChangeTaskStatusRequestDto, TaskResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.ChangeStatus,
        payload,
        traceId,
      );
      this.logger.info('Change task status request forwarded successfully', { traceId, taskId, userId, status: body.status });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward change task status request', { traceId, taskId, error: error.message });
      throw error;
    }
  }

  async listHistory(params: Omit<ListHistoryRequestDto, 'taskId'>, taskId: string, traceId: string): Promise<TaskHistoryListResponseDto> {
    const payload: ListHistoryRequestDto = { taskId, page: params.page, limit: params.limit };

    try {
      const result = await this.rabbitMQService.sendToQueue<ListHistoryRequestDto, TaskHistoryListResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.ListHistory,
        payload,
        traceId,
      );
      this.logger.debug('List task history request forwarded successfully', { traceId, taskId, page: params.page, limit: params.limit });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward list task history request', { traceId, taskId, error: error.message });
      throw error;
    }
  }
}
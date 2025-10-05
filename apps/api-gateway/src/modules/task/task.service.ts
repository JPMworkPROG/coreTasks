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
import { GatewayEnv } from '../../../config/envLoader';

@Injectable()
export class TaskService {
  private readonly logger = createLogger({
    service: 'task-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });
  private readonly tasksQueue: string;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly configService: ConfigService<GatewayEnv, true>,
  ) {
    const queue = this.configService.get('rabbitmq.queues.tasks', { infer: true });
    if (!queue) {
      this.logger.error('Tasks queue is not configured');
      throw new Error('Tasks queue is not configured');
    }
    this.tasksQueue = queue;
  }

  async createTask(
    body: CreateTaskBodyDto,
    actorId: string,
    correlationId: string,
  ): Promise<TaskResponseDto> {
    this.logger.info('Forwarding create task request to task service', {
      correlationId,
      actorId,
      title: body.title,
    });

    const payload: CreateTaskRequestDto = {
      data: body,
      actorId,
    };

    try {
      return await this.rabbitMQService.sendToQueue<CreateTaskRequestDto, TaskResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.CreateTask,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward create task request', {
        correlationId,
        actorId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async listTasks(
    filters: ListTasksRequestDto,
    actorId: string,
    correlationId: string,
  ): Promise<TaskListResponseDto> {
    this.logger.debug('Forwarding list tasks request to task service', {
      correlationId,
      actorId,
      page: filters.page,
      limit: filters.limit,
    });

    const payload: ListTasksRequestDto = {
      ...filters,
      actorId,
    };

    try {
      return await this.rabbitMQService.sendToQueue<ListTasksRequestDto, TaskListResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.ListTasks,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward list tasks request', {
        correlationId,
        actorId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async getTaskDetails(
    taskId: string,
    actorId: string,
    correlationId: string,
  ): Promise<TaskDetailsResponseDto> {
    this.logger.debug('Forwarding get task details request to task service', {
      correlationId,
      taskId,
      actorId,
    });

    const payload: GetTaskDetailsRequestDto = {
      taskId,
      actorId,
    };

    try {
      return await this.rabbitMQService.sendToQueue<GetTaskDetailsRequestDto, TaskDetailsResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.GetTaskDetails,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward get task details request', {
        correlationId,
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async updateTask(
    taskId: string,
    body: UpdateTaskBodyDto,
    actorId: string,
    correlationId: string,
  ): Promise<TaskResponseDto> {
    this.logger.info('Forwarding update task request', {
      correlationId,
      taskId,
      actorId,
    });

    const payload: UpdateTaskRequestDto = {
      taskId,
      data: body,
      actorId,
    };

    try {
      return await this.rabbitMQService.sendToQueue<UpdateTaskRequestDto, TaskResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.UpdateTask,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward update task request', {
        correlationId,
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async deleteTask(taskId: string, actorId: string, correlationId: string): Promise<void> {
    this.logger.warn('Forwarding delete task request', {
      correlationId,
      taskId,
      actorId,
    });

    const payload: DeleteTaskRequestDto = {
      taskId,
      actorId,
    };

    try {
      await this.rabbitMQService.sendToQueue<DeleteTaskRequestDto, void>(
        this.tasksQueue,
        TaskRequestsRPCMessage.DeleteTask,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward delete task request', {
        correlationId,
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async createComment(
    taskId: string,
    body: CreateCommentBodyDto,
    actorId: string,
    correlationId: string,
  ): Promise<TaskDetailsResponseDto> {
    this.logger.info('Forwarding create comment request', {
      correlationId,
      taskId,
      actorId,
    });

    const payload: CreateCommentRequestDto = {
      taskId,
      data: body,
      actorId,
    };

    try {
      return await this.rabbitMQService.sendToQueue<CreateCommentRequestDto, TaskDetailsResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.CreateComment,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward create comment request', {
        correlationId,
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async listComments(
    params: Omit<ListCommentsRequestDto, 'taskId'>,
    taskId: string,
    correlationId: string,
  ): Promise<CommentListResponseDto> {
    this.logger.debug('Forwarding list comments request', {
      correlationId,
      taskId,
      page: params.page,
      limit: params.limit,
    });

    const payload: ListCommentsRequestDto = {
      taskId,
      page: params.page,
      limit: params.limit,
    };

    try {
      return await this.rabbitMQService.sendToQueue<ListCommentsRequestDto, CommentListResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.ListComments,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward list comments request', {
        correlationId,
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async assignUsers(
    taskId: string,
    body: AssignUsersBodyDto,
    actorId: string,
    correlationId: string,
  ): Promise<TaskResponseDto> {
    this.logger.info('Forwarding assign users request', {
      correlationId,
      taskId,
      actorId,
      users: body.userIds.length,
    });

    const payload: AssignUsersRequestDto = {
      taskId,
      actorId,
      userIds: body.userIds,
    };

    try {
      return await this.rabbitMQService.sendToQueue<AssignUsersRequestDto, TaskResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.AssignUsers,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward assign users request', {
        correlationId,
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async changeStatus(
    taskId: string,
    body: ChangeTaskStatusBodyDto,
    actorId: string,
    correlationId: string,
  ): Promise<TaskResponseDto> {
    this.logger.info('Forwarding change task status request', {
      correlationId,
      taskId,
      actorId,
      status: body.status,
    });

    const payload: ChangeTaskStatusRequestDto = {
      taskId,
      actorId,
      status: body.status,
      reason: body.reason,
    };

    try {
      return await this.rabbitMQService.sendToQueue<ChangeTaskStatusRequestDto, TaskResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.ChangeStatus,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward change task status request', {
        correlationId,
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async listHistory(
    params: Omit<ListHistoryRequestDto, 'taskId'>,
    taskId: string,
    correlationId: string,
  ): Promise<TaskHistoryListResponseDto> {
    this.logger.debug('Forwarding list task history request', {
      correlationId,
      taskId,
      page: params.page,
      limit: params.limit,
    });

    const payload: ListHistoryRequestDto = {
      taskId,
      page: params.page,
      limit: params.limit,
    };

    try {
      return await this.rabbitMQService.sendToQueue<ListHistoryRequestDto, TaskHistoryListResponseDto>(
        this.tasksQueue,
        TaskRequestsRPCMessage.ListHistory,
        payload,
        correlationId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward list task history request', {
        correlationId,
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  }
}

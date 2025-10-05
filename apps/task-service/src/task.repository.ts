import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Task,
  TaskAssignment,
  TaskComment,
  TaskHistory,
  TaskHistoryAction,
  TaskPriority,
  TaskStatus,
  User,
  createLogger,
} from '@taskscore/utils';
import { mapStatusEntityToDto } from './task.mapper';

interface CreateTaskParams {
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string;
  meta?: Record<string, unknown> | null;
  assigneeIds?: string[];
}

interface ListTasksParams {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  assignedTo?: string;
  createdBy?: string;
}

interface DeleteTaskParams {
  taskId: string;
}

interface AddCommentParams {
  taskId: string;
  authorId: string;
  content: string;
}

interface AssignUsersParams {
  taskId: string;
  actorId: string;
  userIds: string[];
}

interface ChangeStatusParams {
  taskId: string;
  actorId: string;
  status: TaskStatus;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface ListCommentsParams {
  taskId: string;
  page: number;
  limit: number;
}

interface ListHistoryParams {
  taskId: string;
  page: number;
  limit: number;
}

@Injectable()
export class TaskRepository {
  private readonly logger = createLogger({
    service: 'task-repository',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepository: Repository<TaskAssignment>,
    @InjectRepository(TaskComment)
    private readonly commentRepository: Repository<TaskComment>,
    @InjectRepository(TaskHistory)
    private readonly historyRepository: Repository<TaskHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Valida se um usuário existe no banco de dados
   */
  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(`User with id '${userId}' not found`);
    }
  }

  /**
   * Valida se múltiplos usuários existem no banco de dados
   */
  private async validateUsersExist(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;

    const uniqueUserIds = Array.from(new Set(userIds));
    const existingUsers = await this.userRepository.find({
      where: uniqueUserIds.map(id => ({ id })),
      select: ['id']
    });

    const existingUserIds = new Set(existingUsers.map(user => user.id));
    const missingUserIds = uniqueUserIds.filter(id => !existingUserIds.has(id));

    if (missingUserIds.length > 0) {
      throw new BadRequestException(
        `Users not found: ${missingUserIds.map(id => `'${id}'`).join(', ')}`
      );
    }
  }

  async createTask(params: CreateTaskParams): Promise<Task> {
    this.logger.debug('Creating task', {
      title: params.title,
      createdBy: params.createdBy,
      assignees: params.assigneeIds?.length ?? 0,
    });

    // Validar se o usuário criador existe
    await this.validateUserExists(params.createdBy);

    // Validar se os usuários atribuídos existem
    if (params.assigneeIds?.length) {
      await this.validateUsersExist(params.assigneeIds);
    }

    return this.taskRepository.manager.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);
      const assignmentRepo = manager.getRepository(TaskAssignment);
      const historyRepo = manager.getRepository(TaskHistory);

      const task = taskRepo.create({
        title: params.title,
        description: params.description ?? null,
        dueDate: params.dueDate ?? null,
        priority: params.priority,
        status: params.status,
        createdBy: params.createdBy,
        updatedBy: params.createdBy,
        completedAt: null,
        meta: params.meta ?? null,
      });

      const savedTask = await taskRepo.save(task);

      if (params.assigneeIds?.length) {
        const uniqueAssignees = Array.from(new Set(params.assigneeIds));
        const assignments = uniqueAssignees.map((userId) =>
          assignmentRepo.create({
            taskId: savedTask.id,
            userId,
            assignedBy: params.createdBy,
          }),
        );
        await assignmentRepo.save(assignments);
      }

      await historyRepo.save(
        historyRepo.create({
          taskId: savedTask.id,
          action: TaskHistoryAction.Created,
          performedBy: params.createdBy,
          description: 'Task created',
          metadata: {
            title: savedTask.title,
            priority: savedTask.priority,
            status: savedTask.status,
          },
        }),
      );

      const fullTask = await taskRepo.findOne({
        where: { id: savedTask.id },
        relations: {
          assignments: true,
        },
        order: {
          assignments: {
            assignedAt: 'ASC',
          },
        },
      });

      if (!fullTask) {
        throw new Error('Failed to load task after creation');
      }

      return fullTask;
    });
  }

  async findTaskSummaryOrFail(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: {
        assignments: true,
      },
      order: {
        assignments: {
          assignedAt: 'ASC',
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async findTaskDetailsOrFail(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: {
        assignments: {
          user: true,
          assignedByUser: true,
        },
        createdByUser: true,
        updatedByUser: true,
      },
      order: {
        assignments: {
          assignedAt: 'ASC',
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async listTasks(params: ListTasksParams): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
    const { page, limit, status, priority, search, assignedTo, createdBy } = params;

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignments', 'assignment')
      .leftJoinAndSelect('assignment.user', 'assignmentUser')
      .leftJoinAndSelect('assignment.assignedByUser', 'assignedByUser')
      .leftJoinAndSelect('task.createdByUser', 'createdByUser')
      .leftJoinAndSelect('task.updatedByUser', 'updatedByUser')
      .orderBy('task.createdAt', 'DESC')
      .addOrderBy('assignment.assignedAt', 'ASC')
      .distinct(true);

    if (status) {
      qb.andWhere('task.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('task.priority = :priority', { priority });
    }

    if (search) {
      qb.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (assignedTo) {
      qb.andWhere('assignment.userId = :assignedTo', { assignedTo });
    }

    if (createdBy) {
      qb.andWhere('task.createdBy = :createdBy', { createdBy });
    }

    const offset = (page - 1) * limit;
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }

  async saveTask(task: Task): Promise<Task> {
    const saved = await this.taskRepository.save(task);

    return this.findTaskSummaryOrFail(saved.id);
  }

  async createHistoryEntry(entry: {
    taskId: string;
    action: TaskHistoryAction;
    performedBy: string;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<TaskHistory> {
    // Validar se o usuário que está realizando a ação existe
    await this.validateUserExists(entry.performedBy);

    const history = this.historyRepository.create({
      taskId: entry.taskId,
      action: entry.action,
      performedBy: entry.performedBy,
      description: entry.description ?? null,
      metadata: entry.metadata ?? null,
    });

    return this.historyRepository.save(history);
  }

  async deleteTask(params: DeleteTaskParams): Promise<void> {
    const result = await this.taskRepository.delete({ id: params.taskId });

    if (!result.affected) {
      throw new NotFoundException('Task not found');
    }
  }

  async addComment(params: AddCommentParams): Promise<TaskComment> {
    // Validar se o usuário autor do comentário existe
    await this.validateUserExists(params.authorId);

    return this.commentRepository.manager.transaction(async (manager) => {
      const commentRepo = manager.getRepository(TaskComment);
      const historyRepo = manager.getRepository(TaskHistory);

      const comment = commentRepo.create({
        taskId: params.taskId,
        authorId: params.authorId,
        content: params.content,
      });

      const savedComment = await commentRepo.save(comment);

      await historyRepo.save(
        historyRepo.create({
          taskId: params.taskId,
          action: TaskHistoryAction.Commented,
          performedBy: params.authorId,
          description: 'Comment added to task',
          metadata: { commentId: savedComment.id },
        }),
      );

      return savedComment;
    });
  }

  async listComments(params: ListCommentsParams): Promise<{ data: TaskComment[]; total: number; page: number; limit: number }> {
    const { taskId, page, limit } = params;
    const [data, total] = await this.commentRepository.findAndCount({
      where: { taskId },
      relations: {
        author: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async assignUsers(params: AssignUsersParams): Promise<{ added: string[]; removed: string[]; assignments: TaskAssignment[] }> {
    // Validar se o usuário que está fazendo a atribuição existe
    await this.validateUserExists(params.actorId);

    // Validar se os usuários a serem atribuídos existem
    if (params.userIds.length) {
      await this.validateUsersExist(params.userIds);
    }

    return this.assignmentRepository.manager.transaction(async (manager) => {
      const assignmentRepo = manager.getRepository(TaskAssignment);
      const historyRepo = manager.getRepository(TaskHistory);

      const existingAssignments = await assignmentRepo.find({ where: { taskId: params.taskId } });
      const existingMap = new Map(existingAssignments.map((assignment) => [assignment.userId, assignment]));

      const targetSet = new Set(params.userIds);

      const addedUserIds = params.userIds.filter((userId) => !existingMap.has(userId));
      const removedAssignments = existingAssignments.filter((assignment) => !targetSet.has(assignment.userId));

      if (addedUserIds.length) {
        const newAssignments = addedUserIds.map((userId) =>
          assignmentRepo.create({
            taskId: params.taskId,
            userId,
            assignedBy: params.actorId,
          }),
        );
        await assignmentRepo.save(newAssignments);
      }

      if (removedAssignments.length) {
        await assignmentRepo.remove(removedAssignments);
      }

      if (addedUserIds.length || removedAssignments.length) {
        await historyRepo.save(
          historyRepo.create({
            taskId: params.taskId,
            action: TaskHistoryAction.Assigned,
            performedBy: params.actorId,
            description: 'Task assignments updated',
            metadata: {
              added: addedUserIds,
              removed: removedAssignments.map((assignment) => assignment.userId),
            },
          }),
        );
      }

      const refreshedAssignments = await assignmentRepo.find({
        where: { taskId: params.taskId },
        order: { assignedAt: 'ASC' },
      });

      return {
        added: addedUserIds,
        removed: removedAssignments.map((assignment) => assignment.userId),
        assignments: refreshedAssignments,
      };
    });
  }

  async changeStatus(params: ChangeStatusParams): Promise<Task> {
    // Validar se o usuário que está alterando o status existe
    await this.validateUserExists(params.actorId);

    return this.taskRepository.manager.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);
      const historyRepo = manager.getRepository(TaskHistory);

      const task = await taskRepo.findOne({
        where: { id: params.taskId },
        relations: {
          assignments: true,
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const previousStatus = task.status;
      task.status = params.status;
      task.updatedBy = params.actorId;

      if (params.status === TaskStatus.Done) {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }

      await taskRepo.save(task);

      await historyRepo.save(
        historyRepo.create({
          taskId: params.taskId,
          action: TaskHistoryAction.StatusChanged,
          performedBy: params.actorId,
          description: params.description ?? 'Task status changed',
          metadata: {
            from: mapStatusEntityToDto(previousStatus),
            to: mapStatusEntityToDto(params.status),
            ...params.metadata,
          },
        }),
      );

      const updatedTask = await taskRepo.findOne({
        where: { id: params.taskId },
        relations: {
          assignments: true,
        },
        order: {
          assignments: {
            assignedAt: 'ASC',
          },
        },
      });

      if (!updatedTask) {
        throw new NotFoundException('Task not found after status change');
      }

      return updatedTask;
    });
  }

  async listHistory(params: ListHistoryParams): Promise<{ data: TaskHistory[]; total: number; page: number; limit: number }> {
    const { taskId, page, limit } = params;
    const [data, total] = await this.historyRepository.findAndCount({
      where: { taskId },
      relations: {
        performedByUser: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}

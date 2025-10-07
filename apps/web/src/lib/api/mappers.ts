import type { TaskCommentResponseDto } from '@/lib/api/models/TaskCommentResponseDto';
import type { TaskDetailsResponseDto } from '@/lib/api/models/TaskDetailsResponseDto';
import { TaskResponseDto } from '@/lib/api/models/TaskResponseDto';
import { CreateTaskBodyDto } from '@/lib/api/models/CreateTaskBodyDto';
import { UpdateTaskBodyDto } from '@/lib/api/models/UpdateTaskBodyDto';
import type { UserInfoDto } from '@/lib/api/models/UserInfoDto';
import type { UserResponseDto } from '@/lib/api/models/UserResponseDto';
import { Comment, Task, TaskPriority, TaskStatus, User } from '@/lib/types';

const parseDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
};

const normalizeDescription = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

const mapTaskStatusFromDto = (
  status: TaskResponseDto.status | TaskDetailsResponseDto.status
): TaskStatus => {
  switch (status) {
    case TaskResponseDto.status.TODO:
      return 'todo';
    case TaskResponseDto.status.IN_PROGRESS:
      return 'in-progress';
    case TaskResponseDto.status.REVIEW:
      return 'review';
    case TaskResponseDto.status.DONE:
      return 'completed';
    case TaskResponseDto.status.CANCELLED:
      return 'cancelled';
    default:
      return 'todo';
  }
};

const mapTaskPriorityFromDto = (
  priority: TaskResponseDto.priority | TaskDetailsResponseDto.priority
): TaskPriority => {
  switch (priority) {
    case TaskResponseDto.priority.LOW:
      return 'low';
    case TaskResponseDto.priority.MEDIUM:
      return 'medium';
    case TaskResponseDto.priority.HIGH:
      return 'high';
    case TaskResponseDto.priority.URGENT:
      return 'urgent';
    default:
      return 'medium';
  }
};

export const mapTaskStatusToDto = (
  status: TaskStatus
): CreateTaskBodyDto.status | UpdateTaskBodyDto.status => {
  switch (status) {
    case 'todo':
      return CreateTaskBodyDto.status.TODO;
    case 'in-progress':
      return CreateTaskBodyDto.status.IN_PROGRESS;
    case 'review':
      return CreateTaskBodyDto.status.REVIEW;
    case 'completed':
      return CreateTaskBodyDto.status.DONE;
    case 'cancelled':
      return CreateTaskBodyDto.status.CANCELLED;
    default:
      return CreateTaskBodyDto.status.TODO;
  }
};

export const mapTaskPriorityToDto = (
  priority: TaskPriority
): CreateTaskBodyDto.priority | UpdateTaskBodyDto.priority => {
  switch (priority) {
    case 'low':
      return CreateTaskBodyDto.priority.LOW;
    case 'medium':
      return CreateTaskBodyDto.priority.MEDIUM;
    case 'high':
      return CreateTaskBodyDto.priority.HIGH;
    case 'urgent':
      return CreateTaskBodyDto.priority.URGENT;
    default:
      return CreateTaskBodyDto.priority.MEDIUM;
  }
};

export const mapUserToAppUser = (user: UserInfoDto | UserResponseDto): User => {
  const baseUser: User = {
    id: user.id,
    name: 'username' in user ? user.username : user.email,
    email: user.email,
  };

  // Adiciona campos extras se for UserResponseDto
  if ('role' in user) {
    return {
      ...baseUser,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      createdAt: parseDate(user.createdAt),
      updatedAt: parseDate(user.updatedAt),
      lastLoginAt: user.lastLoginAt ? parseDate(user.lastLoginAt) : null,
    };
  }

  return baseUser;
};

type TaskDto = TaskResponseDto | TaskDetailsResponseDto;

export const mapTaskDtoToTask = (task: TaskDto): Task => {
  const assignedUser = task.assignments?.[0]?.user;

  return {
    id: task.id,
    title: task.title,
    description: normalizeDescription(task.description),
    status: mapTaskStatusFromDto(task.status),
    priority: mapTaskPriorityFromDto(task.priority),
    assignedTo: assignedUser ? mapUserToAppUser(assignedUser) : undefined,
    createdBy: mapUserToAppUser(task.createdBy),
    createdAt: parseDate(task.createdAt) ?? new Date(),
    updatedAt: parseDate(task.updatedAt) ?? new Date(),
    dueDate: parseDate(task.dueDate),
  };
};

export const mapCommentDtoToComment = (
  comment: TaskCommentResponseDto
): Comment => ({
  id: comment.id,
  taskId: comment.taskId,
  author: mapUserToAppUser(comment.author),
  content: comment.content,
  createdAt: parseDate(comment.createdAt) ?? new Date(),
});

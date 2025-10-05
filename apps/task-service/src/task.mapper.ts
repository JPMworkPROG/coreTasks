import {
  Task,
  TaskAssignment,
  TaskComment,
  TaskHistory,
  TaskHistoryAction,
  TaskPriority,
  TaskStatus,
} from '@taskscore/utils';
import {
  TaskAssignmentResponseDto,
  TaskCommentResponseDto,
  TaskDetailsResponseDto,
  TaskHistoryActionDto,
  TaskHistoryEntryResponseDto,
  TaskPriorityDto,
  TaskResponseDto,
  TaskStatusDto,
  UserInfoDto,
} from '@taskscore/types';

export function mapPriorityDtoToEntity(priority?: TaskPriorityDto): TaskPriority {
  switch (priority) {
    case TaskPriorityDto.Low:
      return TaskPriority.Low;
    case TaskPriorityDto.High:
      return TaskPriority.High;
    case TaskPriorityDto.Urgent:
      return TaskPriority.Critical;
    case TaskPriorityDto.Medium:
    default:
      return TaskPriority.Medium;
  }
}

export function mapPriorityEntityToDto(priority: TaskPriority): TaskPriorityDto {
  switch (priority) {
    case TaskPriority.Low:
      return TaskPriorityDto.Low;
    case TaskPriority.High:
      return TaskPriorityDto.High;
    case TaskPriority.Critical:
      return TaskPriorityDto.Urgent;
    case TaskPriority.Medium:
    default:
      return TaskPriorityDto.Medium;
  }
}

export function mapStatusDtoToEntity(status?: TaskStatusDto): TaskStatus {
  switch (status) {
    case TaskStatusDto.Done:
      return TaskStatus.Done;
    case TaskStatusDto.InProgress:
      return TaskStatus.InProgress;
    case TaskStatusDto.Review:
      return TaskStatus.InReview;
    case TaskStatusDto.Cancelled:
      return TaskStatus.Cancelled;
    case TaskStatusDto.Todo:
    default:
      return TaskStatus.Todo;
  }
}

export function mapStatusEntityToDto(status: TaskStatus): TaskStatusDto {
  switch (status) {
    case TaskStatus.Done:
      return TaskStatusDto.Done;
    case TaskStatus.InProgress:
      return TaskStatusDto.InProgress;
    case TaskStatus.InReview:
      return TaskStatusDto.Review;
    case TaskStatus.Cancelled:
      return TaskStatusDto.Cancelled;
    case TaskStatus.Todo:
    default:
      return TaskStatusDto.Todo;
  }
}

export function mapHistoryActionToDto(action: TaskHistoryAction): TaskHistoryActionDto {
  switch (action) {
    case TaskHistoryAction.Created:
      return TaskHistoryActionDto.Created;
    case TaskHistoryAction.Updated:
      return TaskHistoryActionDto.Updated;
    case TaskHistoryAction.StatusChanged:
      return TaskHistoryActionDto.StatusChanged;
    case TaskHistoryAction.Assigned:
      return TaskHistoryActionDto.Assigned;
    case TaskHistoryAction.Unassigned:
      return TaskHistoryActionDto.Unassigned;
    case TaskHistoryAction.Commented:
      return TaskHistoryActionDto.Commented;
    case TaskHistoryAction.Completed:
      return TaskHistoryActionDto.Completed;
    case TaskHistoryAction.Cancelled:
      return TaskHistoryActionDto.Cancelled;
    case TaskHistoryAction.Deleted:
      return TaskHistoryActionDto.Deleted;
    default:
      return TaskHistoryActionDto.Updated;
  }
}

function mapUserInfo(user: any): UserInfoDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

const mapAssignmentEntity = (assignment: TaskAssignment): TaskAssignmentResponseDto => ({
  user: mapUserInfo(assignment.user),
  assignedBy: mapUserInfo(assignment.assignedByUser),
  assignedAt: assignment.assignedAt.toISOString(),
});

const mapCommentEntity = (comment: TaskComment): TaskCommentResponseDto => ({
  id: comment.id,
  taskId: comment.taskId,
  author: mapUserInfo(comment.author),
  content: comment.content,
  createdAt: comment.createdAt.toISOString(),
  updatedAt: comment.updatedAt.toISOString(),
});

const mapHistoryEntity = (entry: TaskHistory): TaskHistoryEntryResponseDto => ({
  id: entry.id,
  taskId: entry.taskId,
  action: mapHistoryActionToDto(entry.action),
  performedBy: mapUserInfo(entry.performedByUser),
  description: entry.description ?? null,
  metadata: normalizeHistoryMetadata(entry),
  createdAt: entry.createdAt.toISOString(),
});

function normalizeHistoryMetadata(entry: TaskHistory): Record<string, unknown> | null {
  if (!entry.metadata) {
    return null;
  }

  const metadata = { ...entry.metadata } as Record<string, unknown>;

  if (entry.action === TaskHistoryAction.StatusChanged) {
    if (metadata.from) {
      metadata.from = normalizeStatusMetadata(metadata.from);
    }
    if (metadata.to) {
      metadata.to = normalizeStatusMetadata(metadata.to);
    }
  }

  return metadata;
}

function normalizeStatusMetadata(value: unknown): TaskStatusDto | unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.toLowerCase();
  switch (normalized) {
    case TaskStatus.Todo:
    case TaskStatusDto.Todo.toLowerCase():
      return TaskStatusDto.Todo;
    case TaskStatus.InProgress:
    case TaskStatusDto.InProgress.toLowerCase():
      return TaskStatusDto.InProgress;
    case TaskStatus.InReview:
    case TaskStatusDto.Review.toLowerCase():
      return TaskStatusDto.Review;
    case TaskStatus.Done:
    case TaskStatusDto.Done.toLowerCase():
      return TaskStatusDto.Done;
    case TaskStatus.Cancelled:
    case TaskStatusDto.Cancelled.toLowerCase():
      return TaskStatusDto.Cancelled;
    default:
      return value;
  }
}

export function mapTaskEntityToResponse(task: Task): TaskResponseDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: mapPriorityEntityToDto(task.priority),
    status: mapStatusEntityToDto(task.status),
    createdBy: mapUserInfo(task.createdByUser),
    updatedBy: task.updatedByUser ? mapUserInfo(task.updatedByUser) : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    meta: task.meta ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    assignments: (task.assignments ?? [])
      .slice()
      .sort((a, b) => a.assignedAt.getTime() - b.assignedAt.getTime())
      .map(mapAssignmentEntity),
  };
}

export function mapTaskEntityToDetails(task: Task): TaskDetailsResponseDto {
  // TaskDetailsResponseDto agora herda apenas de TaskResponseDto
  // Comments e history devem ser obtidos via endpoints específicos
  return mapTaskEntityToResponse(task);
}

export function mapCommentsToResponse(comments: TaskComment[]): TaskCommentResponseDto[] {
  return comments.map(mapCommentEntity);
}

export function mapHistoryToResponse(history: TaskHistory[]): TaskHistoryEntryResponseDto[] {
  return history.map(mapHistoryEntity);
}

export function mapAssignmentsToResponse(assignments: TaskAssignment[]): TaskAssignmentResponseDto[] {
  return assignments.map(mapAssignmentEntity);
}

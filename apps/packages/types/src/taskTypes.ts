export enum TaskRequestsRPCMessage {
  CreateTask = 'tasks.create',
  ListTasks = 'tasks.list',
  GetTaskDetails = 'tasks.get-details',
  UpdateTask = 'tasks.update',
  DeleteTask = 'tasks.delete',
  CreateComment = 'tasks.create-comment',
  ListComments = 'tasks.list-comments',
  AssignUsers = 'tasks.assign-users',
  ChangeStatus = 'tasks.change-status',
  ListHistory = 'tasks.list-history',
}

export enum TaskEventsRPCMessage {
  TaskCreated = 'tasks.events.created',
  TaskUpdated = 'tasks.events.updated',
  TaskDeleted = 'tasks.events.deleted',
  TaskStatusChanged = 'tasks.events.status-changed',
}

export interface ChangeRecord {
  field: string;
  from: unknown;
  to: unknown;
}

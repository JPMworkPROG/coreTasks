export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: User;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  author: User;
  content: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

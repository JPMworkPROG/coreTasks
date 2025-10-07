import { Task, Comment, User, TaskPriority, TaskStatus } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { config } from '@/lib/config';

export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: User;
  createdBy: User;
  dueDate?: Date;
};

export type TaskUpdateInput = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assignedTo' | 'dueDate'>
>;

export type CommentInput = {
  taskId: string;
  author: User;
  content: string;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const users: User[] = [
  { id: '1', name: 'João Silva', email: 'joao@example.com' },
  { id: '2', name: 'Maria Santos', email: 'maria@example.com' },
  { id: '3', name: 'Pedro Costa', email: 'pedro@example.com' },
];

let tasks: Task[] = [
  {
    id: '1',
    title: 'Implementar autenticação',
    description: 'Criar sistema de login e registro com validação',
    status: 'in-progress',
    priority: 'high',
    assignedTo: users[0],
    createdBy: users[0],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
    dueDate: new Date('2025-01-15'),
  },
  {
    id: '2',
    title: 'Design da interface',
    description: 'Criar mockups e protótipos das telas principais',
    status: 'completed',
    priority: 'medium',
    assignedTo: users[1],
    createdBy: users[0],
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-28'),
    dueDate: new Date('2024-12-30'),
  },
  {
    id: '3',
    title: 'Configurar CI/CD',
    description: 'Implementar pipeline de deploy automatizado',
    status: 'todo',
    priority: 'low',
    assignedTo: users[2],
    createdBy: users[1],
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03'),
  },
];

const comments: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      taskId: '1',
      author: users[1],
      content: 'Já comecei a trabalhar nisso. Vou usar JWT para autenticação.',
      createdAt: new Date('2025-01-02T10:00:00'),
    },
    {
      id: 'c2',
      taskId: '1',
      author: users[0],
      content: 'Ótimo! Lembre-se de adicionar validação no backend também.',
      createdAt: new Date('2025-01-02T11:30:00'),
    },
  ],
};

const cloneTask = (task: Task): Task => ({
  ...task,
  createdAt: new Date(task.createdAt),
  updatedAt: new Date(task.updatedAt),
  dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
  assignedTo: task.assignedTo ? { ...task.assignedTo } : undefined,
  createdBy: { ...task.createdBy },
});

const cloneComment = (comment: Comment): Comment => ({
  ...comment,
  createdAt: new Date(comment.createdAt),
  author: { ...comment.author },
});

export const mockDb = {
  async getUsers(): Promise<User[]> {
    await delay(config.api.delay.getUsers);
    return users.map((user) => ({ ...user }));
  },

  async listTasks(): Promise<Task[]> {
    await delay(config.api.delay.listTasks);
    return tasks.map(cloneTask);
  },

  async getTask(taskId: string): Promise<Task | undefined> {
    await delay(config.api.delay.getTask);
    const task = tasks.find((t) => t.id === taskId);
    return task ? cloneTask(task) : undefined;
  },

  async createTask(input: TaskInput): Promise<Task> {
    await delay(config.api.delay.createTask);
    const newTask: Task = {
      id: generateId(),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tasks = [newTask, ...tasks];
    return cloneTask(newTask);
  },

  async updateTask(taskId: string, updates: TaskUpdateInput): Promise<Task> {
    await delay(config.api.delay.updateTask);
    let updatedTask: Task | undefined;

    tasks = tasks.map((task) => {
      if (task.id !== taskId) return task;
      updatedTask = {
        ...task,
        ...updates,
        updatedAt: new Date(),
      };
      return updatedTask;
    });

    if (!updatedTask) {
      throw new Error('Task not found');
    }

    return cloneTask(updatedTask);
  },

  async deleteTask(taskId: string): Promise<void> {
    await delay(config.api.delay.deleteTask);
    tasks = tasks.filter((task) => task.id !== taskId);
    delete comments[taskId];
  },

  async listComments(taskId: string): Promise<Comment[]> {
    await delay(config.api.delay.getComments);
    return (comments[taskId] || []).map(cloneComment);
  },

  async getCommentsCount(): Promise<Record<string, number>> {
    await delay(config.api.delay.getUsers);
    return Object.entries(comments).reduce<Record<string, number>>((acc, [taskId, taskComments]) => {
      acc[taskId] = taskComments.length;
      return acc;
    }, {});
  },

  async addComment(input: CommentInput): Promise<Comment> {
    await delay(config.api.delay.addComment);
    const newComment: Comment = {
      id: generateId(),
      createdAt: new Date(),
      ...input,
    };

    comments[input.taskId] = [...(comments[input.taskId] || []), newComment];
    return cloneComment(newComment);
  },
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockDb, type TaskInput, type TaskUpdateInput, type CommentInput } from '@/lib/api/mock-db';
import { useNotificationStore } from '@/lib/store';
import { Task, Comment } from '@/lib/types';

export const tasksQueryKeys = {
  all: ['tasks'] as const,
  detail: (taskId: string) => ['tasks', taskId] as const,
  comments: (taskId: string) => ['tasks', taskId, 'comments'] as const,
  users: ['users'] as const,
  commentsCount: ['tasks', 'comments-count'] as const,
};

export const useTasksQuery = () =>
  useQuery({
    queryKey: tasksQueryKeys.all,
    queryFn: () => mockDb.listTasks(),
  });

export const useTaskQuery = (taskId: string) =>
  useQuery({
    queryKey: tasksQueryKeys.detail(taskId),
    queryFn: () => mockDb.getTask(taskId),
    enabled: Boolean(taskId),
  });

export const useUsersQuery = () =>
  useQuery({
    queryKey: tasksQueryKeys.users,
    queryFn: () => mockDb.getUsers(),
  });

export const useCommentsCountQuery = () =>
  useQuery({
    queryKey: tasksQueryKeys.commentsCount,
    queryFn: () => mockDb.getCommentsCount(),
  });

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);

  return useMutation({
    mutationFn: (input: TaskInput) => mockDb.createTask(input),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(tasksQueryKeys.all, (prev) =>
        prev ? [task, ...prev] : [task]
      );
      queryClient.setQueryData(tasksQueryKeys.detail(task.id), task);
      addNotification({
        message: `Nova tarefa criada: ${task.title}`,
        read: false,
        type: 'success',
      });
    },
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: TaskUpdateInput }) =>
      mockDb.updateTask(taskId, updates),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(tasksQueryKeys.all, (prev) =>
        prev ? prev.map((t) => (t.id === task.id ? task : t)) : prev
      );
      queryClient.setQueryData(tasksQueryKeys.detail(task.id), task);
      addNotification({
        message: `Tarefa atualizada: ${task.title}`,
        read: false,
        type: 'info',
      });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);

  return useMutation({
    mutationFn: (taskId: string) => mockDb.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.setQueryData<Task[]>(tasksQueryKeys.all, (prev) =>
        prev ? prev.filter((task) => task.id !== taskId) : prev
      );
      queryClient.removeQueries({ queryKey: tasksQueryKeys.detail(taskId) });
      queryClient.removeQueries({ queryKey: tasksQueryKeys.comments(taskId) });
      queryClient.setQueryData<Record<string, number> | undefined>(
        tasksQueryKeys.commentsCount,
        (prev) => {
          if (!prev) return prev;
          const { [taskId]: _removed, ...rest } = prev;
          return rest;
        }
      );
      addNotification({
        message: 'Tarefa removida com sucesso',
        read: false,
        type: 'warning',
      });
    },
  });
};

export const useCommentsQuery = (taskId: string) =>
  useQuery({
    queryKey: tasksQueryKeys.comments(taskId),
    queryFn: () => mockDb.listComments(taskId),
    enabled: Boolean(taskId),
  });

export const useAddCommentMutation = () => {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);

  return useMutation({
    mutationFn: (input: CommentInput) => mockDb.addComment(input),
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[] | undefined>(
        tasksQueryKeys.comments(comment.taskId),
        (prev) => (prev ? [...prev, comment] : [comment])
      );
      const task = queryClient.getQueryData<Task>(tasksQueryKeys.detail(comment.taskId));
      queryClient.setQueryData<Record<string, number>>(tasksQueryKeys.commentsCount, (prev) => ({
        ...(prev ?? {}),
        [comment.taskId]: ((prev ?? {})[comment.taskId] ?? 0) + 1,
      }));
      addNotification({
        message: `Novo comentário em: ${task?.title ?? comment.taskId}`,
        read: false,
        type: 'info',
      });
    },
  });
};

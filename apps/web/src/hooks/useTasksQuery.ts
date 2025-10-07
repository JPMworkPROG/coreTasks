import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { coreTasksApi } from '@/lib/api/client';
import { config } from '@/lib/config';
import {
  mapCommentDtoToComment,
  mapTaskDtoToTask,
  mapTaskPriorityToDto,
  mapTaskStatusToDto,
  mapUserToAppUser,
} from '@/lib/api/mappers';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import type { Comment, Task, TaskPriority, TaskStatus } from '@/lib/types';

export const tasksQueryKeys = {
  all: ['tasks'] as const,
  detail: (taskId: string) => ['tasks', taskId] as const,
  comments: (taskId: string) => ['tasks', taskId, 'comments'] as const,
  users: ['users'] as const,
  commentsCount: ['tasks', 'comments-count'] as const,
};

type CreateTaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  assignedUserId?: string;
};

type UpdateTaskInput = {
  taskId: string;
  data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    assignedUserId?: string | null;
  };
};

type AddCommentInput = {
  taskId: string;
  content: string;
};

const useIsAuthenticated = () =>
  useAuthStore((state) => Boolean(state.accessToken));

export const useTasksQuery = () => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: tasksQueryKeys.all,
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await coreTasksApi.tasks.tasksControllerListTasks({});
      return response.data.map(mapTaskDtoToTask);
    },
  });
};

export const useTaskQuery = (taskId: string) => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: tasksQueryKeys.detail(taskId),
    enabled: Boolean(taskId) && isAuthenticated,
    queryFn: async () => {
      const response = await coreTasksApi.tasks.tasksControllerGetTask({ id: taskId });
      return mapTaskDtoToTask(response);
    },
  });
};

export const useUsersQuery = () => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: tasksQueryKeys.users,
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await coreTasksApi.users.usersControllerListUsers({
        page: 1,
        limit: config.api.pagination.usersLimit,
      });
      return response.data.map(mapUserToAppUser);
    },
  });
};

export const useUserProfileQuery = () => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['user', 'profile'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await coreTasksApi.users.usersControllerGetMe();
      return mapUserToAppUser(response);
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCommentsCountQuery = () =>
  useQuery({
    queryKey: tasksQueryKeys.commentsCount,
    queryFn: async () => ({} as Record<string, number>),
    staleTime: Infinity,
  });

export const useTaskHistoryQuery = (taskId: string) => {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery({
    queryKey: ['tasks', taskId, 'history'],
    enabled: isAuthenticated && !!taskId,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await coreTasksApi.tasks.tasksControllerListHistory({
        id: taskId,
        page: pageParam,
        limit: config.api.pagination.historyLimit,
      });
      return {
        data: response.data,
        meta: response.meta,
      };
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { assignedUserId, ...taskData } = input;

      const createdTask = await coreTasksApi.tasks.tasksControllerCreateTask({
        requestBody: {
          title: taskData.title,
          description: taskData.description,
          priority: mapTaskPriorityToDto(taskData.priority),
          status: mapTaskStatusToDto(taskData.status),
          dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
        },
      });

      if (assignedUserId) {
        await coreTasksApi.tasks.tasksControllerAssignUsers({
          id: createdTask.id,
          requestBody: { userIds: [assignedUserId] },
        });
      }

      const taskDetails = await coreTasksApi.tasks.tasksControllerGetTask({
        id: createdTask.id,
      });

      return mapTaskDtoToTask(taskDetails);
    },
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
    mutationFn: async ({ taskId, data }: UpdateTaskInput) => {
      const { assignedUserId, ...updates } = data;

      const requestBody: any = {};
      
      if (updates.title !== undefined) {
        requestBody.title = updates.title;
      }
      if (updates.description !== undefined) {
        requestBody.description = updates.description;
      }
      if (updates.status !== undefined) {
        requestBody.status = mapTaskStatusToDto(updates.status);
      }
      if (updates.priority !== undefined) {
        requestBody.priority = mapTaskPriorityToDto(updates.priority);
      }
      if (updates.dueDate !== undefined) {
        requestBody.dueDate = updates.dueDate ? updates.dueDate.toISOString() : null;
      }

      await coreTasksApi.tasks.tasksControllerUpdateTask({
        id: taskId,
        requestBody,
      });

      if (assignedUserId !== undefined) {
        await coreTasksApi.tasks.tasksControllerAssignUsers({
          id: taskId,
          requestBody: {
            userIds: assignedUserId ? [assignedUserId] : [],
          },
        });
      }

      const taskDetails = await coreTasksApi.tasks.tasksControllerGetTask({
        id: taskId,
      });

      return mapTaskDtoToTask(taskDetails);
    },
    onSuccess: (task) => {
      // Invalida queries para forçar refetch
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: ['tasks', task.id, 'history'] });
      
      // Atualiza cache imediatamente
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
    mutationFn: async (taskId: string) => {
      await coreTasksApi.tasks.tasksControllerDeleteTask({ id: taskId });
      return taskId;
    },
    onSuccess: (taskId) => {
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

export const useCommentsQuery = (taskId: string) => {
  const isAuthenticated = useIsAuthenticated();

  return useInfiniteQuery({
    queryKey: tasksQueryKeys.comments(taskId),
    enabled: Boolean(taskId) && isAuthenticated,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await coreTasksApi.tasks.tasksControllerListComments({
        id: taskId,
        page: pageParam,
        limit: config.api.pagination.commentsLimit,
      });
      return {
        data: response.data.map(mapCommentDtoToComment),
        meta: response.meta,
      };
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useAddCommentMutation = () => {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);

  return useMutation({
    mutationFn: async ({ taskId, content }: AddCommentInput) => {
      await coreTasksApi.tasks.tasksControllerCreateComment({
        id: taskId,
        requestBody: { content },
      });
      const commentsResponse = await coreTasksApi.tasks.tasksControllerListComments({
        id: taskId,
        limit: config.api.pagination.commentsLimit,
      });
      return commentsResponse.data.map(mapCommentDtoToComment);
    },
    onSuccess: (comments, { taskId }) => {
      queryClient.setQueryData<Comment[] | undefined>(
        tasksQueryKeys.comments(taskId),
        comments
      );
      queryClient.setQueryData<Record<string, number>>(tasksQueryKeys.commentsCount, (prev) => ({
        ...(prev ?? {}),
        [taskId]: comments.length,
      }));
      const task = queryClient.getQueryData<Task>(tasksQueryKeys.detail(taskId));
      addNotification({
        message: `Novo comentário em: ${task?.title ?? taskId}`,
        read: false,
        type: 'info',
      });
    },
  });
};

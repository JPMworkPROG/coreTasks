import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { TaskCard } from '@/components/TaskCard';
import { TaskFilters } from '@/components/TaskFilters';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { TaskSkeleton } from '@/components/TaskSkeleton';
import { useAuthStore } from '@/lib/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { toast } from 'sonner';
import {
  useTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUsersQuery,
  useCommentsCountQuery,
} from '@/hooks/useTasksQuery';

const Index = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery();
  const { data: users = [] } = useUsersQuery();
  const { data: commentsCount = {} } = useCommentsCountQuery();
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  useWebSocket(tasks);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  useEffect(() => {
    setAuthModalOpen(!currentUser);
  }, [currentUser]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };

  const handleTaskSubmit = async (formData: TaskFormValues) => {
    if (!currentUser) return;

    const assignedUserId =
      formData.assignedToId && formData.assignedToId !== 'none'
        ? formData.assignedToId
        : null;

    const basePayload = {
      title: formData.title,
      description: formData.description,
      status: formData.status as TaskStatus,
      priority: formData.priority as TaskPriority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    };

    try {
      if (editingTask) {
        const currentAssignedId = editingTask.assignedTo?.id ?? null;
        const assignedUserIdForUpdate =
          assignedUserId === currentAssignedId ? undefined : assignedUserId;

        await updateTaskMutation.mutateAsync({
          taskId: editingTask.id,
          data: {
            ...basePayload,
            assignedUserId: assignedUserIdForUpdate,
          },
        });
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        await createTaskMutation.mutateAsync({
          ...basePayload,
          assignedUserId: assignedUserId ?? undefined,
        });
        toast.success('Tarefa criada com sucesso!');
      }
    } catch {
      toast.error('Não foi possível salvar a tarefa. Tente novamente.');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    deleteTaskMutation
      .mutateAsync(taskId)
      .then(() => toast.success('Tarefa excluída com sucesso!'))
      .catch(() => toast.error('Não foi possível excluir a tarefa.'));
  };

  const handleTaskClick = (taskId: string) => {
    navigate({
      to: '/task/$taskId',
      params: { taskId },
    });
  };

  if (!currentUser) {
    return (
      <>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-primary">
              <span className="text-2xl font-bold text-primary-foreground">TM</span>
            </div>
            <h1 className="text-3xl font-bold">TaskManager</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Tarefas</h1>
            <p className="text-muted-foreground">
              Gerencie suas tarefas e colabore com sua equipe
            </p>
          </div>
          <Button onClick={handleCreateTask} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nova Tarefa
          </Button>
        </div>

        <div className="mb-6">
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
          />
        </div>

        {tasksLoading ? (
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]">
                <TaskSkeleton />
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-muted">
                <Plus className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhuma tarefa encontrada</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Tente ajustar os filtros para encontrar suas tarefas.'
                  : 'Comece criando sua primeira tarefa.'}
              </p>
              {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
                <Button onClick={handleCreateTask} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Tarefa
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]">
                <TaskCard
                  task={task}
                  onEdit={() => handleEditTask(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onClick={() => handleTaskClick(task.id)}
                  commentsCount={commentsCount[task.id] ?? 0}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        users={users}
        currentUser={currentUser}
        isSubmitting={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </div>
  );
};

export default Index;

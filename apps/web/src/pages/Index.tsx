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
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuthStore } from '@/lib/store';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { toast } from 'sonner';
import {
  useTasksQuery,
  useCreateTaskMutation,
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
  const deleteTaskMutation = useDeleteTaskMutation();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
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
    setTaskFormOpen(true);
  };

  const handleTaskSubmit = async (formData: TaskFormValues) => {
    if (!currentUser) return;

    const assignedUserId =
      formData.assignedToId && formData.assignedToId !== 'none'
        ? formData.assignedToId
        : null;

    try {
      await createTaskMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        status: formData.status as TaskStatus,
        priority: formData.priority as TaskPriority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        assignedUserId: assignedUserId ?? undefined,
      });
      toast.success('Tarefa criada com sucesso!');
    } catch {
      toast.error('Não foi possível criar a tarefa. Tente novamente.');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTaskToDelete({ id: task.id, title: task.title });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTaskMutation.mutateAsync(taskToDelete.id);
      toast.success('Tarefa excluída com sucesso!');
    } catch {
      toast.error('Não foi possível excluir a tarefa.');
    } finally {
      // Fechar dialog imediatamente após a operação
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleTaskClick = (taskId: string) => {
    navigate({
      to: '/task/$taskId',
      params: { taskId },
    });
  };

  const handleEditTask = (taskId: string) => {
    navigate({
      to: '/task/$taskId',
      params: { taskId },
      search: { edit: true },
    });
  };

  if (!currentUser) {
    return (
      <>
        <AuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          required={true}
        />
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

      <main className="container mx-auto max-w-7xl py-8 px-4">
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
                  onEdit={() => handleEditTask(task.id)}
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
        users={users}
        currentUser={currentUser}
        isSubmitting={createTaskMutation.isPending}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={confirmDeleteTask}
        title="Confirmar exclusão"
        description={
          taskToDelete
            ? `Tem certeza que deseja excluir a tarefa "${taskToDelete.title}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={deleteTaskMutation.isPending}
      />
    </div>
  );
};

export default Index;

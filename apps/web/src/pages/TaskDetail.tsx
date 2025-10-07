import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Calendar, Clock, User, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { CommentList } from '@/components/CommentList';
import { TaskHistory } from '@/components/TaskHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store';
import { taskRoute } from '@/router';
import {
  useTaskQuery,
  useCommentsQuery,
  useAddCommentMutation,
  useTaskHistoryQuery,
  useUpdateTaskMutation,
  useUsersQuery,
} from '@/hooks/useTasksQuery';
import { toast } from 'sonner';

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  status: z.enum(['todo', 'in-progress', 'review', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const statusConfig = {
  todo: { label: 'A Fazer', variant: 'secondary' as const, className: undefined },
  'in-progress': { label: 'Em Progresso', variant: 'default' as const, className: undefined },
  review: { label: 'Em Revisão', variant: 'outline' as const, className: undefined },
  completed: { label: 'Concluído', variant: 'default' as const, className: 'bg-green-500' },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const, className: undefined },
};

const priorityConfig = {
  low: { label: 'Baixa', variant: 'secondary' as const, className: undefined },
  medium: { label: 'Média', variant: 'default' as const, className: undefined },
  high: { label: 'Alta', variant: 'destructive' as const, className: undefined },
  urgent: { label: 'Urgente', variant: 'destructive' as const, className: 'bg-red-600' },
};

const TaskDetail = () => {
  const { taskId } = taskRoute.useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const shouldEdit = searchParams.get('edit') === 'true';
  
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isEditing, setIsEditing] = useState(false);

  // Ativa edição se veio do botão editar do card
  useEffect(() => {
    if (shouldEdit && !isEditing) {
      setIsEditing(true);
      // Limpa o query param da URL
      window.history.replaceState({}, '', `/task/${taskId}`);
    }
  }, [shouldEdit, taskId, isEditing]);
  
  const { data: task, isLoading: taskLoading, isError } = useTaskQuery(taskId);
  const { 
    data: commentsData, 
    isLoading: commentsLoading,
    hasNextPage: hasMoreComments,
    isFetchingNextPage: isFetchingComments,
    fetchNextPage: fetchMoreComments,
  } = useCommentsQuery(taskId);
  const { 
    data: historyData, 
    isLoading: historyLoading,
    hasNextPage: hasMoreHistory,
    isFetchingNextPage: isFetchingHistory,
    fetchNextPage: fetchMoreHistory,
  } = useTaskHistoryQuery(taskId);
  const { data: users = [] } = useUsersQuery();
  
  // Flatten paginated data
  const comments = commentsData?.pages.flatMap(page => page.data) ?? [];
  const history = historyData?.pages.flatMap(page => page.data) ?? [];
  const addCommentMutation = useAddCommentMutation();
  const updateTaskMutation = useUpdateTaskMutation();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignedToId: 'none',
      dueDate: '',
    },
  });

  // Update form quando a tarefa carrega
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedToId: task.assignedTo?.id || 'none',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    }
  }, [task, form]);

  useEffect(() => {
    if (!taskLoading && (!task || isError)) {
      toast.error('Tarefa não encontrada');
      navigate({ to: '/' });
    }
  }, [task, taskLoading, isError, navigate]);

  const handleAddComment = async (content: string) => {
    if (!task) return;

    if (!currentUser) {
      toast.error('Faça login para comentar.');
      return;
    }

    try {
      await addCommentMutation.mutateAsync({
        taskId: task.id,
        content,
      });
      toast.success('Comentário adicionado!');
    } catch {
      toast.error('Não foi possível adicionar o comentário.');
    }
  };

  const handleSave = async (data: TaskFormValues) => {
    if (!task) return;

    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assignedUserId: data.assignedToId && data.assignedToId !== 'none' 
            ? data.assignedToId
            : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
      });
      toast.success('Tarefa atualizada com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa.');
    }
  };

  const handleCancel = () => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedToId: task.assignedTo?.id || 'none',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    }
    setIsEditing(false);
  };

  if (taskLoading || !task) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8 px-4">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 lg:w-[66.666%] space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full lg:w-[33.333%]">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const statusInfo = statusConfig[task.status] || statusConfig.todo;
  const priorityInfo = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/' })}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:w-[66.666%] space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  {!isEditing ? (
                    <>
                      <div>
                        <CardTitle className="text-2xl">{task.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge 
                            variant={statusInfo.variant}
                            className={statusInfo.className}
                          >
                            {statusInfo.label}
                          </Badge>
                          <Badge 
                            variant={priorityInfo.variant}
                            className={priorityInfo.className}
                          >
                            {priorityInfo.label}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </Button>
                    </>
                  ) : (
                    <div className="w-full">
                      <CardTitle className="text-lg mb-4">Editando Tarefa</CardTitle>
                    </div>
                  )}
                </div>
              </CardHeader>
              {isEditing && (
                <CardContent className="pt-0">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                    <SelectContent>
                                      <SelectItem value="todo">A Fazer</SelectItem>
                                      <SelectItem value="in-progress">Em Progresso</SelectItem>
                                      <SelectItem value="review">Em Revisão</SelectItem>
                                      <SelectItem value="completed">Concluído</SelectItem>
                                      <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Prioridade</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                    <SelectContent>
                                      <SelectItem value="low">Baixa</SelectItem>
                                      <SelectItem value="medium">Média</SelectItem>
                                      <SelectItem value="high">Alta</SelectItem>
                                      <SelectItem value="urgent">Urgente</SelectItem>
                                    </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="assignedToId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um responsável" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={4}
                                className="resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={updateTaskMutation.isPending}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {updateTaskMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              )}
              {!isEditing && (
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                    <p className="text-muted-foreground">{task.description}</p>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardContent className="pt-6">
                <CommentList
                  comments={comments}
                  onAddComment={handleAddComment}
                  isLoading={commentsLoading}
                  hasNextPage={hasMoreComments}
                  isFetchingNextPage={isFetchingComments}
                  onLoadMore={() => fetchMoreComments()}
                />
              </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-[33.333%] space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.assignedTo && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {task.assignedTo.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{task.assignedTo.name}</p>
                        <p className="text-xs text-muted-foreground">Responsável</p>
                      </div>
                    </div>
                  </div>
                )}

                {task.dueDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(task.dueDate).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">Data de entrega</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{task.createdBy.name}</p>
                    <p className="text-xs text-muted-foreground">Criado por</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TaskHistory 
              history={history} 
              isLoading={historyLoading}
              hasNextPage={hasMoreHistory}
              isFetchingNextPage={isFetchingHistory}
              onLoadMore={() => fetchMoreHistory()}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetail;

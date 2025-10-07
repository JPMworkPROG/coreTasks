import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from '@/hooks/useTasksQuery';
import { toast } from 'sonner';

const statusConfig = {
  todo: { label: 'A Fazer', variant: 'secondary' as const },
  'in-progress': { label: 'Em Progresso', variant: 'default' as const },
  completed: { label: 'Concluído', variant: 'outline' as const },
};

const priorityConfig = {
  low: { label: 'Baixa', variant: 'secondary' as const },
  medium: { label: 'Média', variant: 'default' as const },
  high: { label: 'Alta', variant: 'destructive' as const },
};

const TaskDetail = () => {
  const { taskId } = taskRoute.useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { data: task, isLoading: taskLoading, isError } = useTaskQuery(taskId);
  const { data: comments = [], isLoading: commentsLoading } = useCommentsQuery(taskId);
  const { data: history = [], isLoading: historyLoading } = useTaskHistoryQuery(taskId);
  const addCommentMutation = useAddCommentMutation();

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
        author: currentUser,
      });
      toast.success('Comentário adicionado!');
    } catch {
      toast.error('Não foi possível adicionar o comentário.');
    }
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

  const statusInfo = statusConfig[task.status];
  const priorityInfo = priorityConfig[task.priority];

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
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{task.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <CommentList
                  comments={comments}
                  onAddComment={handleAddComment}
                  isLoading={commentsLoading}
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

            <TaskHistory history={history} isLoading={historyLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetail;

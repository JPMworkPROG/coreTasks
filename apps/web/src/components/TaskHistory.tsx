import { History, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskHistoryEntryResponseDto } from '@/lib/api/models/TaskHistoryEntryResponseDto';

interface TaskHistoryProps {
  history: TaskHistoryEntryResponseDto[];
  isLoading?: boolean;
}

const getActionLabel = (action: Record<string, any>): string => {
  if (typeof action === 'string') return action;
  
  // Mapeia as ações para português
  const actionMap: Record<string, string> = {
    'created': 'Criou a tarefa',
    'updated': 'Atualizou a tarefa',
    'assigned': 'Atribuiu usuários',
    'status_changed': 'Mudou o status',
    'commented': 'Comentou',
    'deleted': 'Excluiu a tarefa',
  };

  const actionKey = String(action).toLowerCase();
  return actionMap[actionKey] || 'Realizou uma ação';
};

const getActionBadgeVariant = (action: Record<string, any>): 'default' | 'secondary' | 'outline' | 'destructive' => {
  const actionKey = String(action).toLowerCase();
  
  if (actionKey.includes('created')) return 'default';
  if (actionKey.includes('deleted')) return 'destructive';
  if (actionKey.includes('status')) return 'outline';
  return 'secondary';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Menos de 1 minuto
  if (diffInSeconds < 60) return 'agora há pouco';
  
  // Menos de 1 hora
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  // Menos de 1 dia
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  // Formato completo
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const renderMetadata = (metadata?: Record<string, any>) => {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <div className="mt-2 text-xs text-muted-foreground space-y-1">
      {metadata.from && metadata.to && (
        <p>
          <span className="font-medium">De:</span> {String(metadata.from)} → <span className="font-medium">Para:</span> {String(metadata.to)}
        </p>
      )}
      {metadata.added && Array.isArray(metadata.added) && metadata.added.length > 0 && (
        <p>
          <span className="font-medium">Adicionados:</span> {metadata.added.length} {metadata.added.length === 1 ? 'usuário' : 'usuários'}
        </p>
      )}
      {metadata.removed && Array.isArray(metadata.removed) && metadata.removed.length > 0 && (
        <p>
          <span className="font-medium">Removidos:</span> {metadata.removed.length} {metadata.removed.length === 1 ? 'usuário' : 'usuários'}
        </p>
      )}
    </div>
  );
};

export const TaskHistory = ({ history, isLoading }: TaskHistoryProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum histórico disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Alterações
          <Badge variant="secondary" className="ml-auto">
            {history.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {entry.performedBy.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{entry.performedBy.username || entry.performedBy.email}</p>
                    <Badge variant={getActionBadgeVariant(entry.action)} className="text-xs">
                      {getActionLabel(entry.action)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
                {entry.description && (
                  <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                )}
                {renderMetadata(entry.metadata)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


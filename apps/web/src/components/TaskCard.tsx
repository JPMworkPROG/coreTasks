import { Task } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete: () => void;
  onClick: () => void;
  commentsCount?: number;
}

const statusConfig = {
  todo: { label: 'A Fazer', variant: 'secondary' as const },
  'in-progress': { label: 'Em Progresso', variant: 'default' as const },
  completed: { label: 'Concluído', variant: 'outline' as const },
};

const priorityConfig = {
  low: { label: 'Baixa', className: 'border-muted' },
  medium: { label: 'Média', className: 'border-warning' },
  high: { label: 'Alta', className: 'border-destructive' },
};

export const TaskCard = ({ task, onDelete, onClick, commentsCount = 0 }: TaskCardProps) => {
  const statusInfo = statusConfig[task.status];
  const priorityInfo = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-lg border-l-4',
        priorityInfo.className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold leading-tight line-clamp-2">{task.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          <Badge variant="outline">{priorityInfo.label}</Badge>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignedTo && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          {task.dueDate && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
        
        {commentsCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {commentsCount}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

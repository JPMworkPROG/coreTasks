import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { useNotificationStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const Notifications = () => {
  const navigate = useNavigate();
  const notifications = useNotificationStore((state) => state.notifications);
  const markNotificationRead = useNotificationStore((state) => state.markNotificationRead);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'success':
        return <CheckCheck className={cn(iconClass, "text-green-500")} />;
      case 'error':
        return <Bell className={cn(iconClass, "text-red-500")} />;
      case 'warning':
        return <Bell className={cn(iconClass, "text-yellow-500")} />;
      default:
        return <Bell className={cn(iconClass, "text-blue-500")} />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'success':
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Aviso</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora há pouco';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach((notification) => {
      if (!notification.read) {
        markNotificationRead(notification.id);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/' })}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Notificações
              </h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0 
                  ? `Você tem ${unreadCount} ${unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}`
                  : 'Todas as notificações foram lidas'
                }
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Marcar todas como lidas
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearNotifications}
                  className="gap-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar tudo
                </Button>
              </div>
            )}
          </div>

          {/* Lista de Notificações */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
                <p className="text-sm text-muted-foreground">
                  Você será notificado quando houver atualizações
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    'transition-all hover:shadow-md cursor-pointer',
                    !notification.read && 'border-l-4 border-l-primary bg-muted/30'
                  )}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <CardTitle className="text-base font-medium">
                            {notification.message}
                          </CardTitle>
                          {!notification.read && (
                            <Badge variant="default" className="flex-shrink-0">
                              Nova
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getNotificationBadge(notification.type)}
                          <CardDescription className="text-xs">
                            {formatDate(notification.createdAt)}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notification.read) {
                            markNotificationRead(notification.id);
                          }
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;


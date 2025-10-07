import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Mail, User as UserIcon, Calendar, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { useUserProfileQuery } from '@/hooks/useTasksQuery';

const Profile = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { data: userProfile, isLoading } = useUserProfileQuery();

  // Usa dados da API se disponíveis, senão usa do store local
  const user = userProfile || currentUser;

  if (!currentUser) {
    return null;
  }

  const formatDate = (date?: Date | null) => {
    if (!date) return 'Não disponível';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'admin') {
      return <Badge variant="default">Administrador</Badge>;
    }
    return <Badge variant="secondary">Usuário</Badge>;
  };

  const getStatusBadge = (isActive?: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    }
    return <Badge variant="destructive">Inativo</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 px-4">
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

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header do Perfil */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                {isLoading ? (
                  <div className="flex items-center gap-4 w-full">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-2xl">{user.name}</CardTitle>
                          {user.role && getRoleBadge(user.role)}
                          {user.isActive !== undefined && getStatusBadge(user.isActive)}
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </CardDescription>
                        {user.username && (
                          <CardDescription className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            @{user.username}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Detalhes sobre sua conta no TaskManager
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {user.username && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Nome de Usuário</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>@{user.username}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  </div>

                  {user.role && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Função</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </div>
                  )}

                  {user.isActive !== undefined && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>{user.isActive ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Conta criada em</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  {user.updatedAt && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Última atualização</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(user.updatedAt)}</span>
                      </div>
                    </div>
                  )}

                  {user.lastLoginAt && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Último login</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(user.lastLoginAt)}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">ID do Usuário</Label>
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="text-muted-foreground text-xs">{user.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;


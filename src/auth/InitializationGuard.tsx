import { useEffect, type ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { useIdentityStore } from '@/_shared/stores/identityStore';
import { Loader2, Building2 } from 'lucide-react';
import { Button } from '@/_shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/_shared/components/ui/card';

interface InitializationGuardProps {
  children: ReactNode;
}

/**
 * InitializationGuard ensures that:
 * 1. User info is loaded from info-me endpoint
 * 2. A center is selected if multiple centers are available
 * 3. Only renders children when initialization is complete
 */
export function InitializationGuard({ children }: InitializationGuardProps) {
  const { authenticated } = useAuth();
  const {
    user,
    availableCenters,
    selectedCenter,
    isLoading,
    error,
    fetchUserInfo,
    setSelectedCenter,
  } = useIdentityStore();

  useEffect(() => {
    // Only fetch if authenticated and user info not loaded
    if (authenticated && !user && !isLoading && !error) {
      fetchUserInfo().catch((err) => {
        console.error('[InitializationGuard] Failed to fetch user info:', err);
      });
    }
  }, [authenticated, user, isLoading, error, fetchUserInfo]);

  // Show loading while checking authentication or fetching user info
  if (!authenticated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando informações do usuário...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar informações</CardTitle>
            <CardDescription>
              Não foi possível carregar as informações do usuário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button
              onClick={() => {
                useIdentityStore.setState({ error: null });
                fetchUserInfo();
              }}
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is loaded but no center selected (and multiple centers available)
  if (user && !selectedCenter && availableCenters.length > 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Selecionar Centro
            </CardTitle>
            <CardDescription>
              Você possui acesso a múltiplos centros. Por favor, selecione o centro que deseja utilizar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableCenters.map((center) => (
              <Button
                key={center}
                onClick={() => setSelectedCenter(center)}
                className="w-full justify-start"
                variant="outline"
              >
                <Building2 className="h-4 w-4 mr-2" />
                {center}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is loaded and center is selected (or only one center), render children
  if (user && (selectedCenter || availableCenters.length <= 1)) {
    return <>{children}</>;
  }

  // Fallback: still loading or waiting
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Inicializando...</p>
      </div>
    </div>
  );
}

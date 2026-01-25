import { useNavigate } from '@tanstack/react-router';
import { FileText, ArrowRight } from 'lucide-react';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { Card, CardContent } from '@/_shared/components/ui/card';
import { cn } from '@/_shared/lib/utils';

export default function HomePage() {
  const navigate = useNavigate();

  const handleNavigateToDemands = () => {
    navigate({ to: '/demands' });
  };

  return (
    <PageContainer>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-4 py-6 border-b border-border bg-card">
          <h1 className="text-2xl font-bold text-foreground">
            Sistema de Devolução
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas demandas de devolução
          </p>
        </header>

        {/* Main Content */}
        <div className="flex-1 px-4 py-2">
          <div className="max-w-md mx-auto space-y-4">
            {/* Menu Card - Demandas */}
            <Card
              className={cn(
                'cursor-pointer transition-all',
                'hover:shadow-lg active:scale-[0.98]',
                'p-0',
                'border-2 border-primary/20 hover:border-primary/40'
              )}
              onClick={handleNavigateToDemands}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-foreground">
                        Demandas de Devolução
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Visualize e gerencie suas demandas
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>

            {/* Placeholder para futuros itens do menu */}
            {/* 
            <Card className="opacity-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-muted-foreground">
                      Novo Item
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Em breve...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            */}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

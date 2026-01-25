import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/_shared/components/ui/card';
import { Button } from '@/_shared/components/ui/button';
import { Badge } from '@/_shared/components/ui/badge';

/**
 * Danger zone component with destructive actions
 */
export function DangerZone({
  isOnline,
  onClearAll,
  onExportDatabase,
}: {
  isOnline: boolean;
  onClearAll: () => void;
  onExportDatabase: () => void;
}) {
  return (
    <Card className="border-destructive/50">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          Zona de Perigo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <div className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg">
          <div>
            <p className="font-medium text-xs sm:text-sm">Status da Rede</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Monitoramento de conectividade</p>
          </div>
          <Badge variant={isOnline ? 'default' : 'secondary'} className={`text-[10px] sm:text-xs ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start h-10 sm:h-auto text-xs sm:text-sm"
            onClick={onExportDatabase}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
            <span className="truncate">Exportar Banco de Dados</span>
          </Button>
          <p className="text-[10px] sm:text-xs text-muted-foreground ml-0 sm:ml-6">
            Exporta todos os dados locais como JSON no console
          </p>
        </div>

        <div className="space-y-1 sm:space-y-2 pt-2 border-t border-destructive/20">
          <Button
            variant="destructive"
            className="w-full justify-start h-10 sm:h-auto text-xs sm:text-sm"
            onClick={onClearAll}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
            <span className="truncate">Limpar Todos os Dados Locais</span>
          </Button>
          <p className="text-[10px] sm:text-xs text-destructive ml-0 sm:ml-6">
            Remove TODOS os dados do IndexedDB e Zustand stores
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

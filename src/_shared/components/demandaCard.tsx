import { ChevronRight, Clock, Truck, FileText } from 'lucide-react';
import type { DemandDto } from '@/_services/api/model';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { formatarDataUTC } from '../lib/convertHourUtc';


interface DemandCardProps {
  demand: DemandDto;
  hasDraft?: boolean;
  demandStoreData?: {
    finalizeIntention?: boolean;
    finalizeAttemptedAt?: number;
  };
  onClick: () => void;
}

export function DemandCard({ demand, hasDraft = false, demandStoreData, onClick }: DemandCardProps) {

  const formattedDate = new Date(formatarDataUTC(demand.criadoEm)).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determine status based on API status and local store data
  const getStatusDisplay = () => {
    if (demand.status === 'EM_CONFERENCIA') {
      return { text: 'Em conferência', variant: 'default' as const };
    }
    
    // If there's a finalize intention in the store, it means the user tried to finalize
    if (demandStoreData?.finalizeIntention) {
      return { text: 'Pendente sincronização', variant: 'secondary' as const };
    }
    
    // Default status
    return { text: 'não iniciada', variant: 'secondary' as const };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card
      className={cn(
        'cursor-pointer p-0 transition-all hover:shadow-md active:scale-[0.99]',
        'border-l-4',
        demand.status === 'EM_CONFERENCIA' ? 'border-l-primary' : 'border-l-transparent'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Demanda ${demand.id}, ${demand.doca ?? 'Não informado'}, ${demand.status}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground">{demand.id}</span>
              <Badge variant={statusDisplay.variant} className="text-xs">
                {statusDisplay.text}
              </Badge>
              {hasDraft && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Rascunho
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                {demand.doca}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formattedDate}
              </span>
            </div>
            
            {demand.placa && (
              <p className="mt-1 text-sm text-muted-foreground">
                Placa: <span className="font-medium text-foreground">{demand.placa}</span>
              </p>
            )}
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

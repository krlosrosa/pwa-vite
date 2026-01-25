import { ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/_shared/components/ui/card';
import { Badge } from '@/_shared/components/ui/badge';
import { cn } from '@/_shared/lib/utils';
import type { ItemData } from '../hooks/useDemandItems';

/**
 * Card component for displaying a demand item
 * Shows SKU, description, badges (Extra, Checked, Divergence), and quantities
 */
export function ItemCard({ 
  item,
  onClick 
}: { 
  item: ItemData;
  onClick: () => void;
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer p-0 transition-all hover:shadow-md active:scale-[0.99]',
        item.isChecked && 'border-l-4 border-l-primary',
        item.hasDivergence && 'border-l-4 border-l-destructive'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground">{item.sku}</span>
              {item.isExtra && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                  Item Extra
                </Badge>
              )}
              {item.isChecked && (
                <Badge variant="default" className="text-xs">
                  Conferido
                </Badge>
              )}
              {item.hasDivergence && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Divergência
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
            {item.isChecked && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium">Conferido:</span>{' '}
                  {item.boxQuantity !== undefined && item.boxQuantity > 0 && (
                    <span>{item.boxQuantity} cx</span>
                  )}
                  {item.boxQuantity !== undefined && item.boxQuantity > 0 && item.checkedQuantity > 0 && ' • '}
                  {item.checkedQuantity > 0 && <span>{item.checkedQuantity} un</span>}
                  {(!item.boxQuantity || item.boxQuantity === 0) && item.checkedQuantity === 0 && (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
                {item.lote && (
                  <div>
                    <span className="font-medium">Lote:</span> <span>{item.lote}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

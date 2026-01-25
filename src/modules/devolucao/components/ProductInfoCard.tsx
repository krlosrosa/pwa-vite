import { Package } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/_shared/components/ui/card';
import { Label } from '@/_shared/components/ui/label';
import type { ConferenceRecord } from '@/_shared/db/database';

/**
 * Card component displaying product information (SKU and description)
 */
export function ProductInfoCard({ conference }: { conference: ConferenceRecord }) {
  return (
    <Card className="p-0">
      <CardContent className="space-y-1 p-2">
        <CardTitle className="text-base flex m-0 items-center gap-2">
          <Package className="h-4 w-4" />
          Dados do Produto
        </CardTitle>
        <div>
          <Label className="text-muted-foreground text-xs">SKU</Label>
          <p className="font-mono font-medium">{conference.sku}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Descrição</Label>
          <p className="text-sm">{conference.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

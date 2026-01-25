import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/_shared/components/ui/input';
import { Label } from '@/_shared/components/ui/label';
import { Badge } from '@/_shared/components/ui/badge';
import { cn } from '@/_shared/lib/utils';
import type { ProdutoItem } from '@/_shared/stores/produtoStore';

/**
 * SKU input component with validation feedback
 * Shows visual indicators for valid/invalid SKU
 */
export function SkuInput({
  sku,
  produtoEncontrado,
  onSkuChange,
}: {
  sku: string;
  produtoEncontrado: ProdutoItem | null;
  onSkuChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="extra-sku">
          SKU <span className="text-destructive">*</span>
        </Label>
        {sku.trim() && produtoEncontrado && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            SKU válido
          </Badge>
        )}
        {sku.trim() && !produtoEncontrado && (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            SKU não encontrado
          </Badge>
        )}
      </div>
      <Input
        id="extra-sku"
        type="text"
        value={sku}
        onChange={(e) => onSkuChange(e.target.value)}
        placeholder="Informe o SKU"
        required
        className={cn(
          !sku.trim() && 'border-destructive/50',
          sku.trim() && produtoEncontrado && 'border-green-500/50',
          sku.trim() && !produtoEncontrado && 'border-destructive/50'
        )}
      />
      {!sku.trim() && (
        <p className="text-xs text-destructive">SKU é obrigatório</p>
      )}
      {sku.trim() && !produtoEncontrado && (
        <p className="text-xs text-destructive">
          SKU não encontrado no catálogo. Verifique o SKU e sincronize o catálogo se necessário.
        </p>
      )}
      {produtoEncontrado && produtoEncontrado.unPorCaixa && (
        <p className="text-xs text-muted-foreground">
          Unidades por caixa: {produtoEncontrado.unPorCaixa}
        </p>
      )}
    </div>
  );
}

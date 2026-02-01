import { Plus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/_shared/components/ui/card';
import { Input } from '@/_shared/components/ui/input';
import { Label } from '@/_shared/components/ui/label';
import { cn } from '@/_shared/lib/utils';
import { SkuInput } from './SkuInput';
import type { ProdutoItem } from '@/_shared/stores/produtoStore';

/**
 * Form component for adding extra items
 * Collects SKU, description, quantities, and lot number
 */
export function ExtraItemForm({
  sku,
  description,
  quantity,
  boxQuantity,
  lote,
  produtoEncontrado,
  onSkuChange,
  onDescriptionChange,
  onQuantityChange,
  onBoxQuantityChange,
  onLoteChange,
}: {
  sku: string;
  description: string;
  quantity: string;
  boxQuantity: string;
  lote: string;
  produtoEncontrado: ProdutoItem | null;
  onSkuChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onBoxQuantityChange: (value: string) => void;
  onLoteChange: (value: string) => void;
}) {
  const hasQuantity = (quantity && parseInt(quantity, 10) > 0) || (boxQuantity && parseInt(boxQuantity, 10) > 0);

  return (
    <Card className="p-0">
      <CardContent className="p-4 space-y-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Informações do Item
        </CardTitle>

        <div className="space-y-4">
          {/* SKU */}
          <SkuInput
            sku={sku}
            produtoEncontrado={produtoEncontrado}
            onSkuChange={onSkuChange}
          />

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="extra-description">Descrição</Label>
            <Input
              id="extra-description"
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Descrição do item"
              disabled={!produtoEncontrado}
              className={cn(
                !produtoEncontrado && 'bg-muted cursor-not-allowed'
              )}
            />
            {produtoEncontrado && produtoEncontrado.descricao && (
              <p className="text-xs text-muted-foreground">
                Descrição preenchida automaticamente do catálogo
              </p>
            )}
          </div>

          {/* Quantidade de Caixas */}
          <div className="space-y-2">
            <Label htmlFor="extra-box-quantity">Quantidade de Caixas</Label>
            <Input
              id="extra-box-quantity"
              type="number"
              inputMode="numeric"
              min={0}
              value={boxQuantity}
              onChange={(e) => onBoxQuantityChange(e.target.value)}
              placeholder="Quantidade de caixas"
              className="text-lg font-semibold"
            />
          </div>
          
          {/* Quantidade de Unidades */}
          <div className="space-y-2">
            <Label htmlFor="extra-quantity">Quantidade de Unidades</Label>
            <Input
              id="extra-quantity"
              type="number"
              inputMode="numeric"
              min={0}
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              placeholder="Quantidade de unidades"
              className="text-lg font-semibold"
            />
          </div>


          {/* Lote */}
          <div className="space-y-2">
            <Label htmlFor="extra-lote">
              Lote <span className="text-destructive">*</span>
            </Label>
            <Input
              id="extra-lote"
              type="text"
              value={lote}
              onChange={(e) => onLoteChange(e.target.value)}
              placeholder="Informe o lote"
              required
              className={cn(
                'text-lg font-semibold',
                !lote.trim() && 'border-destructive/50'
              )}
            />
            {!lote.trim() && (
              <p className="text-xs text-destructive">Lote é obrigatório</p>
            )}
          </div>

          {/* Validação: pelo menos um campo de quantidade */}
          {!hasQuantity && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Preencha pelo menos um dos campos: Quantidade de Unidades ou Quantidade de Caixas</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

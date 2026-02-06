import { Check, Package, Box, Copy } from 'lucide-react';
import { Card, CardContent } from '@/_shared/components/ui/card';
import { Label } from '@/_shared/components/ui/label';
import { Input } from '@/_shared/components/ui/input';
import { Textarea } from '@/_shared/components/ui/textarea';
import { Checkbox } from '@/_shared/components/ui/checkbox';
import { naturezaAnomaliaOptions, tipoNaoConformidadeOptions } from '../consts/causas-check-list';
import type { AnomalyFormData } from '../hooks/useAnomalyRegistration';

/**
 * Step component for observation and summary
 */
export function AnomalyObservationStep({
  sku,
  formData,
  onObservationChange,
  onQuantityBoxChange,
  onQuantityUnitChange,
  onReplicateToAllItemsChange,
}: {
  sku: string;
  formData: AnomalyFormData;
  onObservationChange: (value: string) => void;
  onQuantityBoxChange: (value: string) => void;
  onQuantityUnitChange: (value: string) => void;
  onReplicateToAllItemsChange?: (checked: boolean) => void;
}) {
  const replicate = formData.replicateToAllItems ?? false;
  const hasBoxQuantity = formData.quantityBox.trim() !== '' && !isNaN(Number(formData.quantityBox)) && Number(formData.quantityBox) >= 0;
  const hasUnitQuantity = formData.quantityUnit.trim() !== '' && !isNaN(Number(formData.quantityUnit)) && Number(formData.quantityUnit) >= 0;
  const isValidQuantity = replicate || hasBoxQuantity || hasUnitQuantity;

  return (
    <div className="space-y-4">
      {/* Quantity Fields */}
      <Card className="p-0">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Quantidade da Anomalia {!replicate && <span className="text-destructive">*</span>}
            </Label>
            <p className="text-xs text-muted-foreground">
              {replicate
                ? 'Ao replicar, será usada a quantidade conferida de cada item (o que foi conferido na tela de conferência).'
                : 'Preencha pelo menos um dos campos (caixa ou unidade)'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Box Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantityBox" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Quantidade em Caixas
              </Label>
              <Input
                id="quantityBox"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formData.quantityBox}
                onChange={(e) => onQuantityBoxChange(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Unit Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantityUnit" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Quantidade em Unidades
              </Label>
              <Input
                id="quantityUnit"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formData.quantityUnit}
                onChange={(e) => onQuantityUnitChange(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {!isValidQuantity && (
            <p className="text-xs text-destructive">
              Preencha pelo menos um dos campos de quantidade (caixa ou unidade)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Replicar para todos */}
      {onReplicateToAllItemsChange && (
        <Card className="p-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="replicateToAll"
                checked={replicate}
                onCheckedChange={(v) => onReplicateToAllItemsChange(v === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="replicateToAll" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Copy className="h-4 w-4" />
                  Replicar esta anomalia para todos os itens da demanda
                </Label>
                <p className="text-xs text-muted-foreground">
                  Serão usadas todas as fotos e a mesma descrição em todos os itens. A quantidade será a conferida de cada item.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observation Field */}
      <Card className="p-0">
        <CardContent className="p-4 space-y-4">
          <Label htmlFor="observacao">Observação (opcional)</Label>
          <Textarea
            id="observacao"
            placeholder="Descreva detalhes adicionais sobre a anomalia..."
            value={formData.observacao}
            onChange={(e) => onObservationChange(e.target.value)}
            className="mt-1.5"
            rows={4}
          />
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5 p-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Resumo da Anomalia</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU:</span>
              <span className="font-mono">{sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Natureza:</span>
              <span>
                {naturezaAnomaliaOptions.find((o) => o.value === formData.natureza)?.label || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <span>
                {tipoNaoConformidadeOptions.find((o) => o.value === formData.tipoNaoConformidade)?.label || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Causa:</span>
              <span className="text-right max-w-[60%]">{formData.causaAvaria || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fotos:</span>
              <span>{formData.photos.length} anexada(s)</span>
            </div>
            {(formData.quantityBox || formData.quantityUnit) && (
              <>
                {formData.quantityBox && Number(formData.quantityBox) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade em Caixas:</span>
                    <span className="font-medium">{formData.quantityBox}</span>
                  </div>
                )}
                {formData.quantityUnit && Number(formData.quantityUnit) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade em Unidades:</span>
                    <span className="font-medium">{formData.quantityUnit}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

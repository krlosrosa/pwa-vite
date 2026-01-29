import { Check, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/_shared/components/ui/card';
import { Input } from '@/_shared/components/ui/input';
import { Label } from '@/_shared/components/ui/label';
import { Button } from '@/_shared/components/ui/button';
import { cn } from '@/_shared/lib/utils';
import type { ConferenceRecord } from '@/_shared/db/database';

/**
 * Form component for item conference
 * Collects box quantity, unit quantity, and lot number
 */
export function ConferenceForm({
  conference,
  boxQuantity,
  checkedQuantity,
  lote,
  productValidationCode,
  isExtraItem,
  isValidProductCode,
  onBoxQuantityChange,
  onCheckedQuantityChange,
  onLoteChange,
  onProductValidationCodeChange,
  onQuickSetExpected,
}: {
  conference: ConferenceRecord;
  boxQuantity: string;
  checkedQuantity: string;
  lote: string;
  productValidationCode: string;
  isExtraItem: boolean;
  isValidProductCode: boolean;
  onBoxQuantityChange: (value: string) => void;
  onCheckedQuantityChange: (value: string) => void;
  onLoteChange: (value: string) => void;
  onProductValidationCodeChange: (value: string) => void;
  onQuickSetExpected: () => void;
}) {
  return (
    <Card className="p-0">
      <CardContent className="p-2 space-y-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Check className="h-4 w-4" />
          Conferência
        </CardTitle>
        <div className="space-y-4">
          {/* Validação do Produto (apenas para produtos não extras e não conferidos) */}
          {!isExtraItem && !conference.isChecked && (
            <div className="space-y-2">
              <Label htmlFor="productValidationCode">
                Validar Produto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="productValidationCode"
                type="text"
                value={productValidationCode}
                onChange={(e) => {
                  const value = e.target.value;
                  onProductValidationCodeChange(value);
                }}
                onBlur={(e) => {
                  // Trim on blur to remove extra spaces
                  const trimmed = e.target.value.trim();
                  if (trimmed !== productValidationCode) {
                    onProductValidationCodeChange(trimmed);
                  }
                }}
                placeholder="Digite o SKU, EAN ou DUM do produto"
                className={cn(
                  'text-lg font-semibold',
                  productValidationCode && !isValidProductCode && 'border-destructive'
                )}
                autoComplete="off"
                autoFocus={false}
              />
              {productValidationCode && !isValidProductCode && (
                <p className="text-xs text-destructive">
                  Código não confere. Verifique o SKU, EAN ou DUM do produto.
                </p>
              )}
              {isValidProductCode && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Produto validado com sucesso
                </p>
              )}
            </div>
          )}
          
          {/* Mensagem quando item já foi conferido */}
          {!isExtraItem && conference.isChecked && (
            <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Item já conferido - Validação do produto não necessária</span>
              </div>
            </div>
          )}
          {/* Quantidade de Caixas */}
          <div className="space-y-2">
            <Label htmlFor="boxQuantity">Quantidade de Caixas</Label>
            <Input
              id="boxQuantity"
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
            <div className="flex items-center justify-between">
              <Label htmlFor="checkedQuantity">Quantidade de Unidades</Label>
            </div>
            <Input
              id="checkedQuantity"
              type="number"
              inputMode="numeric"
              min={0}
              value={checkedQuantity}
              onChange={(e) => onCheckedQuantityChange(e.target.value)}
              placeholder="Quantidade de unidades"
              className="text-lg font-semibold"
            />
          </div>

          {/* Lote (obrigatório) */}
          <div className="space-y-2">
            <Label htmlFor="lote">
              Lote <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lote"
              type="text"
              value={lote}
              onChange={(e) => onLoteChange(e.target.value)}
              placeholder="Informe o lote"
              className={cn(
                'text-lg font-semibold',
                !lote.trim() && 'border-destructive/50'
              )}
              required
            />
            {!lote.trim() && (
              <p className="text-xs text-destructive">Lote é obrigatório</p>
            )}
          </div>

          {/* Validação: pelo menos um campo de quantidade */}
          {!checkedQuantity && !boxQuantity && (
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

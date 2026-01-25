import { Plus } from 'lucide-react';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { BottomActionBar } from '@/_shared/components/layout/BottomActionBar';
import { Button } from '@/_shared/components/ui/button';
import { useAddExtraItem } from '../hooks/useAddExtraItem';
import { ExtraItemForm } from '../components';

export default function AddExtraItemPage() {
  const {
    demandaId,
    sku,
    description,
    quantity,
    boxQuantity,
    lote,
    produtoEncontrado,
    isValid,
    setSku,
    setDescription,
    setQuantity,
    setBoxQuantity,
    setLote,
    handleSubmit,
  } = useAddExtraItem();

  return (
    <PageContainer hasBottomBar>
      <PageHeader
        title="Adicionar Item Extra"
        subtitle={`Demanda #${demandaId || 'N/A'}`}
        showBack
        backTo={{ to: '/demands/$id', params: { id: demandaId } }}
      />

      <div className="p-4 space-y-4">
        <ExtraItemForm
          sku={sku}
          description={description}
          quantity={quantity}
          boxQuantity={boxQuantity}
          lote={lote}
          produtoEncontrado={produtoEncontrado}
          onSkuChange={setSku}
          onDescriptionChange={setDescription}
          onQuantityChange={setQuantity}
          onBoxQuantityChange={setBoxQuantity}
          onLoteChange={setLote}
        />
      </div>

      <BottomActionBar>
        <Button
          type="button"
          className="flex-1"
          onClick={handleSubmit}
          disabled={!isValid}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item Extra
        </Button>
      </BottomActionBar>
    </PageContainer>
  );
}

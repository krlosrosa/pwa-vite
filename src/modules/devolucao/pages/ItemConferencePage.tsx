import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { BottomActionBar } from '@/_shared/components/layout/BottomActionBar';
import { Button } from '@/_shared/components/ui/button';
import { useItemConference } from '../hooks/useItemConference';
import {
  ProductInfoCard,
  ConferenceForm,
  AnomaliesList,
  RegisterAnomalyButton,
} from '../components';

export default function ItemConferencePage() {
  const {
    demandaId,
    conference,
    anomalies,
    isLoading,
    checkedQuantity,
    boxQuantity,
    lote,
    productValidationCode,
    isExtraItem,
    isValidProductCode,
    isValid,
    setCheckedQuantity,
    setBoxQuantity,
    setLote,
    setProductValidationCode,
    handleQuickSetExpected,
    handleConfirmConference,
    handleNavigateToAnomaly,
    handleDeleteAnomaly,
  } = useItemConference();

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Conferência de Item"
          subtitle="Carregando..."
          showBack
          backTo={{ to: '/demands/$id', params: { id: demandaId } }}
        />
        <div className="p-4">
          <p className="text-muted-foreground">Carregando dados do item...</p>
        </div>
      </PageContainer>
    );
  }

  if (!conference) {
    return null; // Will redirect in useEffect
  }

  return (
    <PageContainer hasBottomBar>
      <PageHeader
        title="Conferência de Item"
        subtitle={conference.sku}
        showBack
        backTo={{ to: '/demands/$id', params: { id: demandaId } }}
      />

      <div className="p-4 space-y-2">
        <ProductInfoCard conference={conference} />

        <ConferenceForm
          conference={conference}
          boxQuantity={boxQuantity}
          checkedQuantity={checkedQuantity}
          lote={lote}
          productValidationCode={productValidationCode}
          isExtraItem={isExtraItem}
          isValidProductCode={isValidProductCode}
          onBoxQuantityChange={setBoxQuantity}
          onCheckedQuantityChange={setCheckedQuantity}
          onLoteChange={setLote}
          onProductValidationCodeChange={setProductValidationCode}
          onQuickSetExpected={handleQuickSetExpected}
        />

        <AnomaliesList anomalies={anomalies} onDelete={handleDeleteAnomaly} />

        <RegisterAnomalyButton
          conference={conference}
          onNavigate={handleNavigateToAnomaly}
        />

        <BottomActionBar>
          <Button
            type="button"
            className="flex-1"
            onClick={handleConfirmConference}
            disabled={!isValid}
          >
            Confirmar Conferência
          </Button>
        </BottomActionBar>
      </div>
    </PageContainer>
  );
}

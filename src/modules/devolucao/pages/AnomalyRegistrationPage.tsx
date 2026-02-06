import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { BottomActionBar } from '@/_shared/components/layout/BottomActionBar';
import { Button } from '@/_shared/components/ui/button';
import { useAnomalyRegistration, ANOMALY_STEPS, ANOMALY_STEP_LABELS } from '../hooks/useAnomalyRegistration';
import { ProgressIndicator, AnomalyStepContent } from '../components';

export default function AnomalyRegistrationPage() {
  const {
    demandaId,
    itemId,
    conference,
    isLoading,
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    formData,
    item,
    canProceed,
    setFormData,
    handleNext,
    handleBack,
    handlePhotoAdd,
    handlePhotoRemove,
    handleNaturezaChange,
  } = useAnomalyRegistration();

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Registrar Anomalia"
          subtitle="Carregando..."
          showBack
          backTo={demandaId && itemId ? {
            to: '/demands/$id/items/$itemId/conference',
            params: { id: demandaId, itemId: itemId }
          } : undefined}
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
        title="Registrar Anomalia"
        subtitle={ANOMALY_STEP_LABELS[currentStep]}
        showBack
        backTo={{
          to: '/demands/$id/items/$itemId/conference',
          params: { id: demandaId, itemId: itemId }
        }}
      />

      <div className="p-4 space-y-6">
        <ProgressIndicator
          currentStep={currentStepIndex}
          totalSteps={ANOMALY_STEPS.length}
          labels={ANOMALY_STEPS.map((step) => ANOMALY_STEP_LABELS[step])}
        />

        <AnomalyStepContent
          step={currentStep}
          sku={item.sku}
          description={item.description}
          formData={formData}
          onNaturezaChange={handleNaturezaChange}
          onTipoChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              tipoNaoConformidade: value,
            }))
          }
          onCausaChange={(value) =>
            setFormData((prev) => ({ ...prev, causaAvaria: value }))
          }
          onPhotoAdd={handlePhotoAdd}
          onPhotoRemove={handlePhotoRemove}
          onObservationChange={(value) =>
            setFormData((prev) => ({ ...prev, observacao: value }))
          }
          onQuantityBoxChange={(value: string) =>
            setFormData((prev) => ({ ...prev, quantityBox: value }))
          }
          onQuantityUnitChange={(value: string) =>
            setFormData((prev) => ({ ...prev, quantityUnit: value }))
          }
          onReplicateToAllItemsChange={(checked) =>
            setFormData((prev) => ({ ...prev, replicateToAllItems: checked }))
          }
        />
      </div>

      <BottomActionBar>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {isFirstStep ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button
          className="flex-1"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {isLastStep ? (
            'Registrar'
          ) : (
            <>
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </BottomActionBar>
    </PageContainer>
  );
}

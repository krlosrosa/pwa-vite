import { ArrowRight, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { BottomActionBar } from '@/_shared/components/layout/BottomActionBar';
import { Button } from '@/_shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/_shared/components/ui/card';
import { useChecklist, STEP_LABELS } from '../hooks/useChecklist';
import {
  ProgressIndicator,
  ChecklistStepContent,
} from '../components';

export default function ChekListPage() {
  const {
    demandaId,
    currentChecklist,
    checklistData,
    currentStep,
    currentStepIndex,
    totalSteps,
    isLastStep,
    canProceed,
    updateField,
    handleNext,
    handleBack,
    getStepTitle,
  } = useChecklist();

  if (!currentChecklist) {
    return (
      <PageContainer>
        <PageHeader
          title="Checklist"
          subtitle="Carregando..."
          showBack
        />
        <div className="p-4">
          <p className="text-muted-foreground">Inicializando checklist...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer hasBottomBar>
      <PageHeader
        title="Checklist"
        subtitle={`Demanda #${demandaId || 'N/A'}`}
        showBack
      />

      <div className="p-4 space-y-4">
        <ProgressIndicator
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
          labels={STEP_LABELS}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {getStepTitle(currentStep)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChecklistStepContent
              step={currentStep}
              data={checklistData}
              updateField={updateField}
            />
          </CardContent>
        </Card>
      </div>

      <BottomActionBar>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {isLastStep ? 'Finalizar Checklist' : 'Próximo'}
          {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </BottomActionBar>
    </PageContainer>
  );
}

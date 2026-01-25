import { RefreshCw } from 'lucide-react';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { BottomActionBar } from '@/_shared/components/layout/BottomActionBar';
import { Button } from '@/_shared/components/ui/button';
import { useValidate } from '../hooks/useValidate';
import {
  DockInfoCard,
  VehicleInfoCard,
  PasswordRequiredCard,
  PasswordStepCard,
} from '../components';

export default function ValidatePage() {
  const {
    demandaId,
    showPasswordStep,
    password,
    dock,
    licensePlate,
    needsPassword,
    canSubmit,
    isStarting,
    setPassword,
    setDock,
    setLicensePlate,
    handleContinue,
    handleBack,
  } = useValidate();

  return (
    <PageContainer hasBottomBar>
      <PageHeader
        title={`Demanda ${demandaId}`}
        subtitle={dock || 'Validação'}
        showBack
      />

      <div className="p-4 space-y-4">
        {!showPasswordStep ? (
          <>
            <DockInfoCard dock={dock} onDockChange={setDock} />

            <VehicleInfoCard
              licensePlate={licensePlate}
              onLicensePlateChange={setLicensePlate}
            />

            {needsPassword && <PasswordRequiredCard />}
          </>
        ) : (
          <PasswordStepCard
            password={password}
            onPasswordChange={setPassword}
          />
        )}
      </div>

      <BottomActionBar>
        {showPasswordStep && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleBack}
          >
            Voltar
          </Button>
        )}
        <Button
          type="button"
          className="flex-1"
          onClick={handleContinue}
          disabled={!canSubmit || isStarting}
        >
          {isStarting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Iniciando...
            </>
          ) : (
            needsPassword && !showPasswordStep ? 'Continuar' : 'Iniciar Conferência'
          )}
        </Button>
      </BottomActionBar>
    </PageContainer>
  );
}

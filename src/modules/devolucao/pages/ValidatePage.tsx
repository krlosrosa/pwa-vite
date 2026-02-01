import { RefreshCw } from 'lucide-react';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { BottomActionBar } from '@/_shared/components/layout/BottomActionBar';
import { Button } from '@/_shared/components/ui/button';
import { useValidate } from '../hooks/useValidate';
import {
  ValidationInfoCard,
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
    paletesRecebidos,
    quantidadePaletesEsperada,
    isCargaSegregada,
    needsPassword,
    canSubmit,
    isStarting,
    setPassword,
    setDock,
    setLicensePlate,
    setPaletesRecebidos,
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
            <ValidationInfoCard
              dock={dock}
              licensePlate={licensePlate}
              paletesRecebidos={paletesRecebidos}
              quantidadePaletesEsperada={quantidadePaletesEsperada}
              isCargaSegregada={isCargaSegregada}
              onDockChange={setDock}
              onLicensePlateChange={setLicensePlate}
              onPaletesRecebidosChange={setPaletesRecebidos}
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

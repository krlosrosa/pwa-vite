import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useDemandStore } from '@/_shared/stores/demandStore';
import { useChecklistStore } from '@/_shared/stores/checklistStore';
import { useStartDemandaDevolucaoMobile, useListarDemandasEmAbertoDevolucaoMobile } from '@/_services/api/service/devolucao/devolucao';
import { useIdentityStore } from '@/_shared/stores/identityStore';
/**
 * Hook for managing demand validation page logic
 * Handles dock and vehicle information, password validation, and navigation
 */
export function useValidate() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const demandaId = params.id as string;

  const { loadDemand, saveDemand } = useDemandStore();
  const { loadChecklist } = useChecklistStore();
  const { mutateAsync: startDemanda } = useStartDemandaDevolucaoMobile();
  const { selectedCenter } = useIdentityStore();
  const effectiveCenterId = selectedCenter || 'teste_1';
  
  // Fetch demand data from API
  const { data: demands } = useListarDemandasEmAbertoDevolucaoMobile(effectiveCenterId);
  
  // Find current demand from API data
  const currentDemand = useMemo(() => {
    if (!demands) return null;
    return demands.find(d => d.id.toString() === demandaId);
  }, [demands, demandaId]);

  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [password, setPassword] = useState('');
  const [dock, setDock] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [paletesRecebidos, setPaletesRecebidos] = useState('0');
  const [isStarting, setIsStarting] = useState(false);

  // Load existing demand data to pre-fill form
  useEffect(() => {
    const loadExistingData = async () => {
      const demandRecord = await loadDemand(demandaId);
      if (demandRecord?.data) {
        if (demandRecord.data.doca) {
          setDock(demandRecord.data.doca as string);
        }
        if (demandRecord.data.placa) {
          setLicensePlate(demandRecord.data.placa as string);
        }
        if (demandRecord.data.paletesRecebidos !== undefined) {
          setPaletesRecebidos(demandRecord?.data.paletesRecebidos?.toString() ?? '0');
        }
      }
    };
    loadExistingData();
  }, [demandaId, loadDemand]);

  // TODO: Replace with actual demand data from API/store
  // For now, using mock values
  const needsPassword = false; // Should be determined from demand data

  /**
   * Validates if password step can proceed
   */
  const canProceedPassword = useMemo(() => {
    return password.length === 4;
  }, [password]);

  /**
   * Validates if form can be submitted
   */
  const canSubmit = useMemo(() => {
    if (showPasswordStep) {
      return canProceedPassword;
    }
    return dock.trim().length > 0 && licensePlate.trim().length > 0;
  }, [showPasswordStep, canProceedPassword, dock, licensePlate]);

  /**
   * Get expected pallets quantity from API
   */
  const quantidadePaletesEsperada = useMemo(() => {
    return currentDemand?.quantidadePaletes ?? null;
  }, [currentDemand]);

  /**
   * Get if load is segregated from API
   */
  const isCargaSegregada = useMemo(() => {
    return currentDemand?.cargaSegregada ?? false;
  }, [currentDemand]);

  /**
   * Handles navigation to password step or form submission
   */
  const handleContinue = useCallback(async () => {
    if (needsPassword && !showPasswordStep) {
      setShowPasswordStep(true);
      return;
    }

    setIsStarting(true);

    try {
      // Save dock, license plate and pallets received to demandStore (upsert - creates if doesn't exist)
      await saveDemand(demandaId, {
        doca: dock,
        placa: licensePlate,
        paletesRecebidos: paletesRecebidos ? parseInt(paletesRecebidos, 10) : 0,
      });

      console.log('[VALIDATE] Local storage updated. Proceeding to next step for Demand:', demandaId);
      console.log('[VALIDATE] Validation complete for Demand:', demandaId, 'Dock:', dock, 'Plate:', licensePlate);

      // Call backend to start the demand (estar na demanda)
      const demandaIdNumber = Number(demandaId);
      if (isNaN(demandaIdNumber)) {
        throw new Error(`Invalid demandaId: ${demandaId}`);
      }

      await startDemanda({
        demandaId: demandaIdNumber.toString(),
        doca: dock,
      }).then(() => {
        console.log('Demand started successfully:', demandaId);
      }).catch((error) => {
        console.error('Error starting demand:', error);
        alert('Erro ao iniciar conferência. Tente novamente.');
        throw error;
      });

      // Check if checklist already exists
      const checklist = await loadChecklist(demandaId);

      if (checklist) {
        // Checklist exists - navigate to items list
        navigate({
          to: '/demands/$id',
          params: { id: demandaId }
        });
      } else {
        // No checklist exists - navigate to checklist creation
        navigate({
          to: '/demands/$id/checklist',
          params: { id: demandaId }
        });
      }
    } catch (error) {
      console.error('Error starting demand or saving validation data:', error);
      // Show error to user but still allow navigation
      alert('Erro ao iniciar conferência. Tente novamente.');
      // Still navigate even if save fails
      navigate({
        to: '/demands/$id/checklist',
        params: { id: demandaId }
      });
    } finally {
      setIsStarting(false);
    }
  }, [needsPassword, showPasswordStep, dock, licensePlate, password, navigate, demandaId, saveDemand, loadChecklist, startDemanda]);

  /**
   * Handles back navigation from password step
   */
  const handleBack = useCallback(() => {
    setShowPasswordStep(false);
    setPassword('');
  }, []);

  return {
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
    canProceedPassword,
    isStarting,
    setPassword,
    setDock,
    setLicensePlate,
    setPaletesRecebidos,
    handleContinue,
    handleBack,
  };
}

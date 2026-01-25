import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useChecklistStore } from '@/_shared/stores/checklistStore';

export type StepType = 'truck_closed_photo' | 'truck_open_photo' | 'temperature' | 'observations';

export interface ChecklistData {
  truckClosedPhoto: string;
  truckOpenPhoto: string;
  compartmentTemperature: string;
  productTemperature: string;
  observations: string;
}

export const STEPS: StepType[] = ['truck_closed_photo', 'truck_open_photo', 'temperature', 'observations'];
export const STEP_LABELS = ['Foto Fechado', 'Foto Aberto', 'Temperatura', 'Observações'];

/**
 * Hook for managing checklist page logic
 * Handles step navigation, field updates, validation, and auto-save
 */
export function useChecklist() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const demandaId = params.id as string;
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { currentChecklist, initializeChecklist, updateField: updateStoreField, saveChecklist } = useChecklistStore();

  // Initialize checklist on mount
  useEffect(() => {
    if (demandaId) {
      initializeChecklist(demandaId);
    }
  }, [demandaId, initializeChecklist]);

  // Map store fields to UI fields
  const checklistData: ChecklistData = useMemo(() => {
    if (!currentChecklist) {
      return {
        truckClosedPhoto: '',
        truckOpenPhoto: '',
        compartmentTemperature: '',
        productTemperature: '',
        observations: '',
      };
    }

    return {
      truckClosedPhoto: currentChecklist.fotoBauFechado || '',
      truckOpenPhoto: currentChecklist.fotoBauAberto || '',
      compartmentTemperature: currentChecklist.temperaturaBau || '',
      productTemperature: currentChecklist.temperaturaProduto || '',
      observations: currentChecklist.anomalias || '',
    };
  }, [currentChecklist]);

  const currentStep = STEPS[currentStepIndex];
  const totalSteps = STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Map UI field names to Store field names
  const mapFieldToStore = useCallback((field: keyof ChecklistData): 'fotoBauAberto' | 'fotoBauFechado' | 'temperaturaBau' | 'temperaturaProduto' | 'anomalias' => {
    const fieldMap = {
      truckClosedPhoto: 'fotoBauFechado' as const,
      truckOpenPhoto: 'fotoBauAberto' as const,
      compartmentTemperature: 'temperaturaBau' as const,
      productTemperature: 'temperaturaProduto' as const,
      observations: 'anomalias' as const,
    };
    return fieldMap[field];
  }, []);

  /**
   * Updates a checklist field and auto-saves
   */
  const updateField = useCallback(async (field: keyof ChecklistData, value: string) => {
    if (!currentChecklist) return;

    const storeField = mapFieldToStore(field);
    type StoreFieldType = 'fotoBauAberto' | 'fotoBauFechado' | 'temperaturaBau' | 'temperaturaProduto' | 'anomalias';
    (updateStoreField as (field: StoreFieldType, value: string) => void)(storeField, value);
    
    // Auto-save after updating field
    try {
      await saveChecklist();
    } catch (error) {
      console.error('Error auto-saving checklist:', error);
    }
  }, [currentChecklist, mapFieldToStore, updateStoreField, saveChecklist]);

  /**
   * Checks if current step can proceed (validation)
   */
  const canProceed = useCallback((): boolean => {
    if (!currentChecklist) return false;

    switch (currentStep) {
      case 'truck_closed_photo':
        return !!currentChecklist.fotoBauFechado;
      case 'truck_open_photo':
        return !!currentChecklist.fotoBauAberto;
      case 'temperature':
        return !!currentChecklist.temperaturaBau && !!currentChecklist.temperaturaProduto;
      case 'observations':
        return true; // Opcional
      default:
        return false;
    }
  }, [currentChecklist, currentStep]);

  /**
   * Handles navigation to next step or finalization
   */
  const handleNext = useCallback(async () => {
    if (!canProceed()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (isLastStep) {
      // Save checklist one last time before navigating
      try {
        await saveChecklist();
        // Navigate to items conference page
        navigate({ 
          to: '/demands/$id', 
          params: { id: demandaId } 
        });
      } catch (error) {
        console.error('Error saving checklist:', error);
        alert('Erro ao salvar checklist. Tente novamente.');
      }
      return;
    }

    setCurrentStepIndex(prev => prev + 1);
  }, [canProceed, isLastStep, saveChecklist, navigate, demandaId]);

  /**
   * Handles navigation to previous step or back to demands list
   */
  const handleBack = useCallback(async () => {
    // Save current state before navigating back
    if (currentChecklist) {
      try {
        await saveChecklist();
      } catch (error) {
        console.error('Error saving checklist:', error);
      }
    }

    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      navigate({ to: '/demands' });
    }
  }, [currentChecklist, currentStepIndex, saveChecklist, navigate]);

  /**
   * Gets the title for the current step
   */
  const getStepTitle = useCallback((step: StepType): string => {
    switch (step) {
      case 'truck_closed_photo':
        return 'Foto do caminhão fechado';
      case 'truck_open_photo':
        return 'Foto do caminhão aberto';
      case 'temperature':
        return 'Temperatura';
      case 'observations':
        return 'Observações';
    }
  }, []);

  return {
    demandaId,
    currentChecklist,
    checklistData,
    currentStep,
    currentStepIndex,
    totalSteps,
    isLastStep,
    canProceed: canProceed(),
    updateField,
    handleNext,
    handleBack,
    getStepTitle,
  };
}

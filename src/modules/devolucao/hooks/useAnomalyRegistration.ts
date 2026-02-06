import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useConferenceStore } from '@/_shared/stores/conferenceStore';
import type { ConferenceRecord } from '@/_shared/db/database';
import { naturezaAnomaliaOptions, tipoNaoConformidadeOptions, type NaturezaAnomalia, type TipoNaoConformidade } from '../consts/causas-check-list';

export type AnomalyStep = 'natureza' | 'tipo' | 'causa' | 'fotos' | 'observacao';

export const ANOMALY_STEPS: AnomalyStep[] = ['natureza', 'tipo', 'causa', 'fotos', 'observacao'];

export const ANOMALY_STEP_LABELS: Record<AnomalyStep, string> = {
  natureza: 'Natureza',
  tipo: 'Tipo',
  causa: 'Causa',
  fotos: 'Fotos',
  observacao: 'Observação',
};

export interface AnomalyFormData {
  natureza: NaturezaAnomalia | null;
  tipoNaoConformidade: TipoNaoConformidade | null;
  causaAvaria: string | null;
  photos: string[];
  observacao: string;
  quantityBox: string;
  quantityUnit: string;
  /** Replicar esta anomalia para todos os itens conferidos da demanda (usa todas as fotos e quantidade física informada) */
  replicateToAllItems?: boolean;
}

/**
 * Hook for managing anomaly registration page logic
 * Handles multi-step form, validation, photo management, and anomaly saving
 */
export function useAnomalyRegistration() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const demandaId = params.id as string;
  const itemId = params.itemId as string;

  const [currentStep, setCurrentStep] = useState<AnomalyStep>('natureza');
  const [formData, setFormData] = useState<AnomalyFormData>({
    natureza: null,
    tipoNaoConformidade: null,
    causaAvaria: null,
    photos: [],
    observacao: '',
    quantityBox: '',
    replicateToAllItems: false,
    quantityUnit: '',
  });

  const [conference, setConference] = useState<ConferenceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const { loadConference, loadConferencesByDemand, saveAnomaly } = useConferenceStore();

  // Carregar dados da conferência ao montar o componente
  useEffect(() => {
    const loadConferenceData = async () => {
      if (!itemId || !demandaId) {
        alert('Parâmetros inválidos. Redirecionando...');
        navigate({ to: '/demands' });
        return;
      }

      setIsLoading(true);
      try {
        const loadedConference = await loadConference(itemId);

        if (!loadedConference) {
          alert('Item não encontrado. Redirecionando...');
          navigate({
            to: '/demands/$id',
            params: { id: demandaId }
          });
          return;
        }

        // Verificar se o item está conferido
        if (!loadedConference.isChecked) {
          alert('O item precisa estar conferido antes de registrar anomalias. Redirecionando...');
          navigate({
            to: '/demands/$id/items/$itemId/conference',
            params: { id: demandaId, itemId: itemId }
          });
          return;
        }

        setConference(loadedConference);
      } catch (error) {
        console.error('Error loading conference:', error);
        alert('Erro ao carregar dados do item.');
        navigate({
          to: '/demands/$id',
          params: { id: demandaId }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConferenceData();
  }, [itemId, demandaId, loadConference, navigate]);

  const currentStepIndex = ANOMALY_STEPS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === ANOMALY_STEPS.length - 1;

  /**
   * Validates if current step can proceed
   */
  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 'natureza':
        return formData.natureza !== null;
      case 'tipo':
        return formData.tipoNaoConformidade !== null;
      case 'causa':
        return formData.causaAvaria !== null;
      case 'fotos':
        return true;
      case 'observacao':
        // Ao replicar: exige pelo menos uma foto e quantidade física (caixa ou unidade)
        if (formData.replicateToAllItems) {
          const hasQty = (formData.quantityBox.trim() !== '' && !isNaN(Number(formData.quantityBox)) && Number(formData.quantityBox) >= 0) ||
            (formData.quantityUnit.trim() !== '' && !isNaN(Number(formData.quantityUnit)) && Number(formData.quantityUnit) >= 0);
          return formData.photos.length >= 1 && hasQty;
        }
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  /**
   * Handles navigation to next step or final submission
   */
  const handleNext = useCallback(async () => {
    if (!canProceed()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (isLastStep) {
      if (!conference || !itemId || !demandaId) {
        alert('Erro: Dados da conferência não encontrados.');
        return;
      }

      try {
        const descricaoParts: string[] = [];
        if (formData.natureza) {
          const naturezaLabel = naturezaAnomaliaOptions.find(o => o.value === formData.natureza)?.label || formData.natureza;
          descricaoParts.push(`Natureza: ${naturezaLabel}`);
        }
        if (formData.tipoNaoConformidade) {
          const tipoLabel = tipoNaoConformidadeOptions.find(o => o.value === formData.tipoNaoConformidade)?.label || formData.tipoNaoConformidade;
          descricaoParts.push(`Tipo: ${tipoLabel}`);
        }
        if (formData.causaAvaria) {
          descricaoParts.push(`Causa: ${formData.causaAvaria}`);
        }
        if (formData.observacao.trim()) {
          descricaoParts.push(`Observação: ${formData.observacao.trim()}`);
        }
        const description = descricaoParts.join(' | ') || 'Anomalia registrada';
        // Usar ref para garantir as fotos mais recentes do formulário (evita closure desatualizada)
        const currentPhotos = formDataRef.current.photos ?? [];
        const hasPhotos = currentPhotos.length > 0;

        if (formData.replicateToAllItems && hasPhotos) {
          // Replicar para todos: mesma descrição, todas as fotos e quantidade física (o que o usuário informou)
          const quantityBox = formData.quantityBox.trim() !== '' && !isNaN(Number(formData.quantityBox))
            ? Number(formData.quantityBox)
            : undefined;
          const quantityUnit = formData.quantityUnit.trim() !== '' && !isNaN(Number(formData.quantityUnit))
            ? Number(formData.quantityUnit)
            : 0;
          const quantity = quantityUnit;

          const allConferences = await loadConferencesByDemand(demandaId);
          const checkedConferences = allConferences.filter(c => c.isChecked);
          if (checkedConferences.length === 0) {
            alert('Nenhum item conferido nesta demanda para replicar.');
            return;
          }
          const replicatedGroupId = crypto.randomUUID();
          const photosToReplicate = [...currentPhotos];
          for (const conf of checkedConferences) {
            await saveAnomaly({
              itemId: conf.itemId,
              demandaId,
              sku: conf.sku,
              lote: conf.lote ?? '',
              quantity,
              quantityBox,
              quantityUnit,
              description,
              photos: photosToReplicate,
              replicatedGroupId,
            });
          }
          alert(`Anomalia replicada com sucesso para ${checkedConferences.length} item(ns).`);
        } else {
          // Registro único (item atual)
          const quantityBox = formData.quantityBox.trim() !== '' && !isNaN(Number(formData.quantityBox)) && Number(formData.quantityBox) > 0
            ? Number(formData.quantityBox)
            : undefined;
          const quantityUnit = formData.quantityUnit.trim() !== '' && !isNaN(Number(formData.quantityUnit)) && Number(formData.quantityUnit) > 0
            ? Number(formData.quantityUnit)
            : undefined;
          const quantity = quantityUnit ?? 0;
          await saveAnomaly({
            itemId,
            demandaId,
            sku: conference.sku,
            lote: conference.lote,
            quantity,
            quantityBox,
            quantityUnit,
            description,
            photos: formData.photos,
          });
          alert('Anomalia registrada com sucesso!');
        }

        navigate({
          to: '/demands/$id/items/$itemId/conference',
          params: { id: demandaId, itemId: itemId }
        });
      } catch (error) {
        console.error('Error saving anomaly:', error);
        alert('Erro ao salvar anomalia. Tente novamente.');
      }
      return;
    }

    setCurrentStep(ANOMALY_STEPS[currentStepIndex + 1]);
  }, [canProceed, isLastStep, conference, itemId, demandaId, formData, saveAnomaly, navigate, currentStepIndex]);

  /**
   * Handles navigation to previous step or cancellation
   */
  const handleBack = useCallback(() => {
    if (isFirstStep) {
      // Cancelar e voltar para a página de conferência do item
      if (demandaId && itemId) {
        navigate({
          to: '/demands/$id/items/$itemId/conference',
          params: { id: demandaId, itemId: itemId }
        });
      } else {
        navigate({ to: '/demands' });
      }
      return;
    }
    setCurrentStep(ANOMALY_STEPS[currentStepIndex - 1]);
  }, [isFirstStep, demandaId, itemId, navigate, currentStepIndex]);

  /**
   * Handles adding a photo
   */
  const handlePhotoAdd = useCallback(async (base64: string) => {
    setFormData((prev) => ({ ...prev, photos: [...prev.photos, base64] }));
  }, []);

  /**
   * Handles removing a photo
   */
  const handlePhotoRemove = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Handles natureza change and clears causa when natureza changes
   */
  const handleNaturezaChange = useCallback((value: NaturezaAnomalia) => {
    setFormData((prev) => ({
      ...prev,
      natureza: value,
      causaAvaria: null, // Limpa causa quando muda natureza
    }));
  }, []);

  // Dados do item (derivados da conferência)
  const item = useMemo(() => {
    return conference ? {
      sku: conference.sku,
      description: conference.description,
    } : {
      sku: '',
      description: '',
    };
  }, [conference]);

  return {
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
    canProceed: canProceed(),
    setFormData,
    handleNext,
    handleBack,
    handlePhotoAdd,
    handlePhotoRemove,
    handleNaturezaChange,
  };
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useConferenceStore } from '@/_shared/stores/conferenceStore';
import { useProdutoStore } from '@/_shared/stores/produtoStore';
import type { ConferenceRecord, AnomalyRecord } from '@/_shared/db/database';
import { validateProductCode } from '../helpers/validateProductCode';

/**
 * Hook for managing item conference page logic
 * Handles data loading, field updates, validation, and conference confirmation
 */
export function useItemConference() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const demandaId = params.id as string;
  const itemId = params.itemId as string;

  const [checkedQuantity, setCheckedQuantity] = useState(''); // quantidadeUnidades
  const [boxQuantity, setBoxQuantity] = useState(''); // quantidadeCaixas
  const [lote, setLote] = useState(''); // lote (obrigatório)
  const [productValidationCode, setProductValidationCode] = useState(''); // código para validação do produto
  const [conference, setConference] = useState<ConferenceRecord | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { loadConference, saveConference, loadAnomaliesByItem, deleteAnomaly } = useConferenceStore();
  const { produtos } = useProdutoStore();

  // Data initialization: Load conference and anomalies
  useEffect(() => {
    const loadData = async () => {
      if (!itemId || !demandaId) return;

      setIsLoading(true);
      try {
        const loadedConference = await loadConference(itemId);

        if (!loadedConference) {
          // Item not found in Dexie, redirect back with error
          alert('Item não encontrado. Redirecionando...');
          navigate({
            to: '/demands/$id',
            params: { id: demandaId }
          });
          return;
        }

        setConference(loadedConference);

        // Initialize fields with saved values or defaults
        if (loadedConference.isChecked) {
          setCheckedQuantity(loadedConference.checkedQuantity.toString());
          setBoxQuantity(loadedConference.boxQuantity?.toString() || '');
          setLote(loadedConference.lote || '');
        } else {
          // Default to expected quantity for units, empty for boxes and lote
          setCheckedQuantity(loadedConference.expectedQuantity.toString());
          setBoxQuantity('');
          setLote('');
        }

        // Load anomalies
        const loadedAnomalies = await loadAnomaliesByItem(itemId);
        setAnomalies(loadedAnomalies);
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

    loadData();
  }, [itemId, demandaId, loadConference, loadAnomaliesByItem, navigate]);

  /**
   * Quick set to expected quantity
   */
  const handleQuickSetExpected = useCallback(() => {
    if (conference) {
      setCheckedQuantity(conference.expectedQuantity.toString());
    }
  }, [conference]);

  /**
   * Check if this is an extra item (doesn't need product validation)
   */
  const isExtraItem = useMemo(() => {
    if (!conference) return false;
    return conference.isExtra === true || conference.itemId?.startsWith('extra-') === true;
  }, [conference]);

  /**
   * Validate product code if not extra item
   */
  const isValidProductCode = useMemo(() => {
    // Extra items don't need validation
    if (isExtraItem) return true;
    
    if (!conference || !productValidationCode.trim()) {
      return false;
    }

    const validatedSku = validateProductCode(
      productValidationCode,
      produtos,
      conference.sku
    );

    // If validateProductCode returns a SKU, it means it found a match
    // We just need to check if it's not null
    const isValid = validatedSku !== null;

    console.log('[useItemConference isValidProductCode]', {
      productValidationCode: `"${productValidationCode}"`,
      conferenceSku: `"${conference.sku}"`,
      validatedSku: `"${validatedSku}"`,
      isValid,
      isExtraItem,
    });

    return isValid;
  }, [isExtraItem, conference, productValidationCode, produtos]);

  /**
   * Validation: lote is required, at least one quantity field must be filled,
   * and product code validation (only for non-extra items)
   */
  const isValid = useMemo(() => {
    const hasLote = lote.trim().length > 0;
    const unidades = parseInt(checkedQuantity, 10);
    const caixas = parseInt(boxQuantity, 10);
    const hasUnidades = !isNaN(unidades) && unidades > 0;
    const hasCaixas = !isNaN(caixas) && caixas > 0;

    const hasQuantities = hasUnidades || hasCaixas;
    
    // For extra items, only lote and quantities are required
    if (isExtraItem) {
      return hasLote && hasQuantities;
    }

    // For regular items, also need product code validation
    return hasLote && hasQuantities && isValidProductCode;
  }, [lote, checkedQuantity, boxQuantity, isExtraItem, isValidProductCode]);

  /**
   * Handle confirm conference
   */
  const handleConfirmConference = useCallback(async () => {
    if (!conference || !isValid) {
      if (!lote.trim()) {
        alert('O campo Lote é obrigatório.');
      } else if (!isExtraItem && !isValidProductCode) {
        alert('O código do produto não confere. Digite o SKU, EAN ou DUM correto.');
      } else {
        alert('Preencha pelo menos um dos campos: Quantidade de Unidades ou Quantidade de Caixas.');
      }
      return;
    }

    const unidades = checkedQuantity ? parseInt(checkedQuantity, 10) : 0;
    const caixas = boxQuantity ? parseInt(boxQuantity, 10) : 0;

    if ((checkedQuantity && (isNaN(unidades) || unidades < 0)) ||
      (boxQuantity && (isNaN(caixas) || caixas < 0))) {
      alert('Por favor, insira valores válidos para as quantidades.');
      return;
    }

    try {
      await saveConference({
        itemId: conference.itemId,
        demandaId: conference.demandaId,
        sku: conference.sku,
        description: conference.description,
        expectedQuantity: conference.expectedQuantity,
        checkedQuantity: unidades,
        expectedBoxQuantity: conference.expectedBoxQuantity,
        boxQuantity: caixas > 0 ? caixas : undefined,
        lote: lote.trim(),
        isChecked: true,
      });

      // Show success notification
      alert('Conferência salva com sucesso!');

      // Navigate back to items list
      navigate({
        to: '/demands/$id',
        params: { id: demandaId }
      });
    } catch (error) {
      console.error('Error saving conference:', error);
      alert('Erro ao salvar conferência. Tente novamente.');
    }
  }, [conference, isValid, checkedQuantity, boxQuantity, lote, isExtraItem, isValidProductCode, saveConference, navigate, demandaId]);

  /**
   * Navigate to anomaly registration page
   */
  const handleNavigateToAnomaly = useCallback(() => {
    if (!conference?.isChecked) {
      alert('Confirme a conferência do item antes de registrar anomalias.');
      return;
    }
    navigate({
      to: '/demands/$id/items/$itemId/anomaly-registration',
      params: { id: demandaId, itemId: itemId }
    });
  }, [conference, navigate, demandaId, itemId]);

  /**
   * Handle delete anomaly
   */
  const handleDeleteAnomaly = useCallback(async (anomalyId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta anomalia?')) {
      return;
    }

    try {
      await deleteAnomaly(anomalyId);
      // Reload anomalies after deletion
      const updatedAnomalies = await loadAnomaliesByItem(itemId);
      setAnomalies(updatedAnomalies);
    } catch (error) {
      console.error('Error deleting anomaly:', error);
      alert('Erro ao excluir anomalia. Tente novamente.');
    }
  }, [deleteAnomaly, loadAnomaliesByItem, itemId]);

  return {
    demandaId,
    itemId,
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
  };
}

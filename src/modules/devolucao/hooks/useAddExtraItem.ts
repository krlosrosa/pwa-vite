import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useConferenceStore } from '@/_shared/stores/conferenceStore';
import { useProdutoStore, type ProdutoItem } from '@/_shared/stores/produtoStore';

/**
 * Helper function to generate unique itemId for extra items
 */
const generateExtraItemId = (demandaId: string, sku: string): string => {
  return `extra-${demandaId}-${sku}-${Date.now()}`;
};

/**
 * Hook for managing add extra item page logic
 * Handles SKU validation, product catalog lookup, form validation, and item creation
 */
export function useAddExtraItem() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const demandaId = params.id as string;

  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [boxQuantity, setBoxQuantity] = useState('');
  const [lote, setLote] = useState('');

  const { saveConference } = useConferenceStore();
  const { getProdutoBySku } = useProdutoStore();

  /**
   * Searches for product in catalog when SKU is entered
   * Returns null instead of undefined for type compatibility
   */
  const produtoEncontrado: ProdutoItem | null = useMemo(() => {
    if (!sku.trim()) return null;
    const produto = getProdutoBySku(sku.trim());
    return produto ?? null;
  }, [sku, getProdutoBySku]);

  /**
   * Auto-fills description when product is found
   */
  useEffect(() => {
    if (produtoEncontrado && produtoEncontrado.descricao) {
      // Always fills description when product is found
      setDescription(produtoEncontrado.descricao);
    } else if (!produtoEncontrado && sku.trim()) {
      // If product is not found and there's SKU entered, clears description
      setDescription('');
    }
  }, [produtoEncontrado, sku]);

  /**
   * Validates form: SKU must exist in catalog, lote is required, at least one quantity field must be filled
   */
  const isValid = useMemo(() => {
    // SKU is required and must exist in catalog
    if (!sku.trim() || !produtoEncontrado) {
      return false;
    }

    const hasLote = lote.trim().length > 0;
    const unidades = parseInt(quantity, 10);
    const caixas = parseInt(boxQuantity, 10);
    const hasUnidades = !isNaN(unidades) && unidades > 0;
    const hasCaixas = !isNaN(caixas) && caixas > 0;

    return hasLote && (hasUnidades || hasCaixas);
  }, [sku, produtoEncontrado, lote, quantity, boxQuantity]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!isValid || !demandaId) {
      if (!sku.trim()) {
        alert('O campo SKU é obrigatório.');
      } else if (!produtoEncontrado) {
        alert('SKU não encontrado no catálogo. Verifique o SKU e tente novamente.');
      } else if (!lote.trim()) {
        alert('O campo Lote é obrigatório.');
      } else {
        alert('Preencha pelo menos um dos campos: Quantidade de Unidades ou Quantidade de Caixas.');
      }
      return;
    }

    const unidades = quantity ? parseInt(quantity, 10) : 0;
    const caixas = boxQuantity ? parseInt(boxQuantity, 10) : 0;

    if ((quantity && (isNaN(unidades) || unidades < 0)) ||
      (boxQuantity && (isNaN(caixas) || caixas < 0))) {
      alert('Por favor, insira valores válidos para as quantidades.');
      return;
    }

    try {
      const itemId = generateExtraItemId(demandaId, sku.trim());

      await saveConference({
        itemId,
        demandaId,
        sku: sku.trim(),
        description: description.trim() || sku.trim(), // Uses SKU as description if not provided
        expectedQuantity: 0, // Extra item was not in the demand
        checkedQuantity: unidades,
        expectedBoxQuantity: undefined, // No box expectation for extra item
        boxQuantity: caixas > 0 ? caixas : undefined,
        lote: lote.trim(),
        isChecked: true, // Extra item comes already checked
        isExtra: true,
      });

      // Show success notification
      alert('Item extra adicionado com sucesso!');

      // Navigate back to items list
      navigate({
        to: '/demands/$id',
        params: { id: demandaId }
      });
    } catch (error) {
      console.error('Error adding extra item:', error);
      alert('Erro ao adicionar item extra. Tente novamente.');
    }
  }, [isValid, demandaId, sku, produtoEncontrado, lote, quantity, boxQuantity, description, saveConference, navigate]);

  // Normalize produtoEncontrado to ensure it's never undefined
  const produtoEncontradoNormalized: ProdutoItem | null = produtoEncontrado ?? null;

  return {
    demandaId,
    sku,
    description,
    quantity,
    boxQuantity,
    lote,
    produtoEncontrado: produtoEncontradoNormalized as ProdutoItem | null,
    isValid,
    setSku,
    setDescription,
    setQuantity,
    setBoxQuantity,
    setLote,
    handleSubmit,
  } as const;
}

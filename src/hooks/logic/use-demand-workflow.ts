import { useNavigate } from '@tanstack/react-router';
import { useChecklistStore } from '@/_shared/stores/checklistStore';
import { useDemandStore } from '@/_shared/stores/demandStore';
import type { ChecklistRecord } from '@/_shared/db/database';
import type { ListarDemandasDtoStatus } from '@/_services/api/model';

/**
 * Hook that encapsulates the logic for starting or resuming a demand workflow.
 * Handles navigation based on checklist state and completion status.
 */
export function useDemandWorkflow() {
  const navigate = useNavigate();
  const { loadChecklist, initializeChecklist } = useChecklistStore();
  const { loadDemand } = useDemandStore();

  /**
   * Checks if a checklist has all mandatory fields filled.
   * Mandatory fields: fotoBauAberto, fotoBauFechado, temperaturaBau, temperaturaProduto
   */
  const isChecklistComplete = (checklist: ChecklistRecord): boolean => {
    return !!(
      checklist.fotoBauAberto &&
      checklist.fotoBauFechado &&
      checklist.temperaturaBau &&
      checklist.temperaturaProduto
    );
  };

  /**
   * Handles demand selection and navigates to the appropriate page based on checklist state and demand status.
   * 
   * @param demandId - The ID of the demand to process
   * @param status - Optional status of the demand from API. If not provided, will check local store.
   */
  const handleDemandSelection = async (demandId: string, status?: ListarDemandasDtoStatus): Promise<void> => {
    try {
      // If status is AGUARDANDO_CONFERENCIA, always navigate to validation page first
      if (status === 'AGUARDANDO_CONFERENCIA') {
        navigate({ 
          to: '/demands/$id/validate',
          params: { id: demandId } as any
        });
        return;
      }

      // Check if validation data exists (doca/placa) in local store
      const demandRecord = await loadDemand(demandId);
      const hasValidationData = demandRecord?.data?.doca && demandRecord?.data?.placa;

      // If status is EM_CONFERENCIA but no validation data exists, still go to validation
      if (status === 'EM_CONFERENCIA' && !hasValidationData) {
        navigate({ 
          to: '/demands/$id/validate',
          params: { id: demandId } as any
        });
        return;
      }

      // Load existing checklist for this demand
      const checklist = await loadChecklist(demandId);

      if (checklist) {
        // Checklist exists - check if it's complete
        if (isChecklistComplete(checklist)) {
          // All mandatory fields filled - navigate to items conference
          navigate({ 
            to: '/demands/$id', 
            params: { id: demandId } 
          });
        } else {
          // Checklist exists but incomplete - navigate to checklist flow
          navigate({ 
            to: '/demands/$id/checklist',
            params: { id: demandId } as any
          });
        }
      } else {
        // No checklist exists - check if validation is needed
        if (!hasValidationData) {
          // No validation data - navigate to validation first
          navigate({ 
            to: '/demands/$id/validate',
            params: { id: demandId } as any
          });
        } else {
          // Validation data exists - initialize checklist and navigate to checklist
          await initializeChecklist(demandId);
          navigate({ 
            to: '/demands/$id/checklist',
            params: { id: demandId } as any
          });
        }
      }
    } catch (error) {
      console.error('Error handling demand selection:', error);
      // Fallback: navigate to items page if there's an error
      navigate({ 
        to: '/demands/$id', 
        params: { id: demandId } 
      });
    }
  };

  return {
    handleDemandSelection,
  };
}

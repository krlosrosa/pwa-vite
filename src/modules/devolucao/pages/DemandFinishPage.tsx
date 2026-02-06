import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Edit, Package, Camera, X } from 'lucide-react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { BottomActionBar } from '@/_shared/components/layout/BottomActionBar';
import { Button } from '@/_shared/components/ui/button';
import { Card, CardContent, CardTitle } from '@/_shared/components/ui/card';
import { Label } from '@/_shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/_shared/components/ui/dialog';
import { useDemandFinish } from '../hooks/useDemandFinish';
import { useDemandStore } from '@/_shared/stores/demandStore';
import { useFinishPhotoStore } from '@/_shared/stores/finishPhotoStore';
import { useSyncProdutos } from '@/hooks/logic/use-sync-produtos';
import { useSyncAnomalia } from '@/hooks/logic/use-sync-anomalia';
import { useSyncConferencia } from '@/hooks/logic/use-sync-conferencia';
import { useSyncCheckList } from '@/hooks/logic/use-sync-check-list';
import { useSyncDemand } from '@/hooks/logic/use-sync-demand';

export default function DemandFinishPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const demandaId = params.id as string;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [finishPhotos, setFinishPhotos] = useState<string[]>([]);

  const {
    summary,
    divergentItems,
    isLoading,
    showSuccessCard,
    navigateToEdit,
  } = useDemandFinish(demandaId);

  const { markDemandAsFinalized } = useDemandStore();
  const { saveFinishPhotos, getFinishPhotosByDemand } = useFinishPhotoStore();

  // Carregar fotos de término já salvas ao abrir/voltar na página
  useEffect(() => {
    if (!demandaId) return;
    getFinishPhotosByDemand(demandaId).then(setFinishPhotos);
  }, [demandaId, getFinishPhotosByDemand]);
  const { syncProdutos } = useSyncProdutos();
  const { syncAnomalias } = useSyncAnomalia();
  const { syncConferences } = useSyncConferencia();
  const { syncCheckLists } = useSyncCheckList();
  const { syncDemands } = useSyncDemand();

  const uncheckedItemsCount = summary.unchecked;

  const handleFinishPhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }
    try {
      const { convertFileToBase64 } = await import('@/_shared/lib/convertBase64');
      const base64 = await convertFileToBase64(file);
      const newPhotos = [...finishPhotos, base64];
      setFinishPhotos(newPhotos);
      await saveFinishPhotos(demandaId, newPhotos);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar a imagem. Tente novamente.');
    }
    e.target.value = '';
  };

  const handleFinishPhotoRemove = async (index: number) => {
    const newPhotos = finishPhotos.filter((_, i) => i !== index);
    setFinishPhotos(newPhotos);
    await saveFinishPhotos(demandaId, newPhotos);
  };

  /**
   * Handles the finalization confirmation
   */
  const handleConfirmFinalization = async () => {
    setIsFinalizing(true);
    try {
      if (finishPhotos.length > 0) {
        await saveFinishPhotos(demandaId, finishPhotos);
      }
      await markDemandAsFinalized(demandaId);

      await syncProdutos();
      await syncAnomalias();
      await syncConferences();
      await syncCheckLists();
      await syncDemands(); // inclui sync das fotos de término

      console.log('[DemandFinishPage] Demand finalized and synchronization completed successfully');

      setShowConfirmDialog(false);
      navigate({ to: '/demands' });
    } catch (error) {
      console.error('[DemandFinishPage] Error finalizing demand or syncing:', error);
      setShowConfirmDialog(false);
      setShowErrorDialog(true);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Finalizar Conferência"
          subtitle={`Demanda #${demandaId || 'N/A'}`}
          showBack
        />
        <div className="p-4">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer hasBottomBar>
      <PageHeader
        title="Finalizar Conferência"
        subtitle={`Demanda #${demandaId || 'N/A'}`}
        showBack
      />

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <Card className="p-0">
          <CardContent className="p-2">
            <CardTitle className="text-base mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resumo da Conferência
            </CardTitle>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Itens</span>
              <span className="font-semibold">{summary.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Itens Conferidos</span>
              <span className="font-semibold text-green-600">{summary.checked}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Itens Pendentes</span>
              <span className="font-semibold text-yellow-600">{summary.unchecked}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Anomalias</span>
              <span className="font-semibold text-destructive">{summary.anomaliesCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Divergences */}
        {summary.hasDivergences && divergentItems.length > 0 && (
          <Card className="border-warning/50 p-0">
            <CardContent className='p-2'>
              <CardTitle className="text-base text-warning flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Divergências Encontradas
              </CardTitle>
              <p className="text-sm text-muted-foreground mb-3">
                Os seguintes produtos apresentam diferença entre quantidade esperada e conferida:
              </p>
              <div className="space-y-2">
                {divergentItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex-1">
                      <p className="font-mono text-sm font-medium">{item.sku}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="text-xs text-warning mt-1 space-y-0.5">
                        <div>
                          <span className="font-medium">Conferido:</span>{' '}
                          {item.checkedBoxQuantity !== undefined && item.checkedBoxQuantity > 0 && (
                            <span>{item.checkedBoxQuantity} cx</span>
                          )}
                          {item.checkedBoxQuantity !== undefined && item.checkedBoxQuantity > 0 && item.checkedQuantity > 0 && ' • '}
                          {item.checkedQuantity > 0 && <span>{item.checkedQuantity} un</span>}
                          {(!item.checkedBoxQuantity || item.checkedBoxQuantity === 0) && item.checkedQuantity === 0 && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                        {item.lote && (
                          <div>
                            <span className="font-medium">Lote:</span> <span>{item.lote}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unchecked Items Warning */}
        {uncheckedItemsCount > 0 && (
          <Card className="border-destructive/50 p-0">
            <CardContent className='p-4'>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Itens Não Conferidos
              </CardTitle>
              <p className="text-sm text-muted-foreground mb-3">
                Existem {uncheckedItemsCount} item(s) que ainda não foram conferidos.
              </p>
              <Button variant="outline" size="sm" onClick={navigateToEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Voltar para Editar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Fotos de término (opcional) */}
        <Card className="p-0">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Fotos de término (opcional)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione fotos para documentar o encerramento da demanda. Serão sincronizadas ao finalizar.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {finishPhotos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Foto término ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                      onClick={() => handleFinishPhotoRemove(index)}
                      aria-label="Remover foto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleFinishPhotoAdd}
                  />
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Adicionar</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success State */}
        {showSuccessCard && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">Conferência Completa</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Todos os itens foram conferidos sem divergências.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomActionBar>
        <Button
          variant="outline"
          className="flex-1"
          onClick={navigateToEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button
          className="flex-1"
          onClick={() => setShowConfirmDialog(true)}
        >
          Confirmar Finalização
        </Button>
      </BottomActionBar>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Finalização</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja finalizar a demanda #{demandaId}?
              {uncheckedItemsCount > 0 && (
                <span className="block mt-2 text-warning">
                  Atenção: Existem {uncheckedItemsCount} item(s) não conferido(s).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isFinalizing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmFinalization}
              disabled={isFinalizing}
            >
              {isFinalizing ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Erro na Sincronização
            </DialogTitle>
            <DialogDescription>
              Não foi possível sincronizar. Tente mais tarde.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowErrorDialog(false);
                navigate({ to: '/demands' });
              }}
              className="w-full"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

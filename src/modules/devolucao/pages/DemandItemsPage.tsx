import { CheckCircle, Circle, Package, RefreshCw, WifiOff, Plus, AlertTriangle } from 'lucide-react';
import { useParams } from '@tanstack/react-router';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { BottomActionBar } from '@/_shared/components/layout/BottomActionBar';
import { EmptyState } from '@/_shared/components/ui/EmptyState';
import { Button } from '@/_shared/components/ui/button';
import { Switch } from '@/_shared/components/ui/switch';
import { Label } from '@/_shared/components/ui/label';
import { useDemandItems } from '../hooks/useDemandItems';
import { FilterInput } from '../components/FilterInput';
import { ItemCard } from '../components/ItemCard';

export default function DemandItemsPage() {
  const params = useParams({ strict: false });
  const demandaId = params.id as string;

  const {
    displayItems,
    stats,
    filters,
    isLoadingApi,
    isApiError,
    hasLocalData,
    isSyncing,
    toggleFilter,
    toggleUncheckedFilter,
    toggleAnomaliesFilter,
    setSearchFilter,
    navigateToConference,
    navigateToAddExtra,
    handleFinishConference,
    refetchApiItems,
  } = useDemandItems(demandaId);

  const totalCount = stats.total;
  const checkedCount = stats.checked;
  const canFinish = checkedCount > 0;

    return (
      <PageContainer hasBottomBar={canFinish}>
        <PageHeader
          title="Itens da Demanda"
          subtitle={`#${demandaId || 'N/A'} • ${checkedCount}/${totalCount} conferidos`}
          showBack
          rightContent={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={navigateToAddExtra}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Item Extra
            </Button>
          }
        />

        <div className="p-4 space-y-4">
          <FilterInput
            placeholder="Buscar por SKU ou descrição..."
            value={filters.searchTerm}
            onChange={setSearchFilter}
          />

          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-checked" className="text-sm font-medium text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Mostrar apenas conferidos
              </Label>
              <Switch
                id="show-checked"
                checked={filters.showOnlyChecked}
                onCheckedChange={toggleFilter}
              />
            </div>
            
            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <Label htmlFor="show-unchecked" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Circle className="h-4 w-4 text-muted-foreground" />
                Mostrar apenas não conferidos
              </Label>
              <Switch
                id="show-unchecked"
                checked={filters.showOnlyUnchecked}
                onCheckedChange={toggleUncheckedFilter}
              />
            </div>
            
            <div className="h-px bg-border" />
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-anomalies" className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Mostrar apenas com anomalias
              </Label>
              <Switch
                id="show-anomalies"
                checked={filters.showOnlyAnomalies}
                onCheckedChange={toggleAnomaliesFilter}
              />
            </div>
          </div>

          {isLoadingApi && !hasLocalData && !isApiError ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando itens...
            </div>
          ) : displayItems.length === 0 ? (
            isApiError && !hasLocalData ? (
              <EmptyState
                icon={<WifiOff className="h-8 w-8" />}
                title="Offline e sem dados locais"
                description="Não foi possível carregar os itens e não há dados salvos localmente."
                action={
                  <Button onClick={() => refetchApiItems()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={
                  filters.showOnlyAnomalies ? <AlertTriangle className="h-8 w-8" /> 
                    : filters.showOnlyUnchecked ? <Circle className="h-8 w-8" /> 
                    : <Package className="h-8 w-8" />
                }
                title={
                  filters.searchTerm 
                    ? 'Nenhum item encontrado' 
                    : filters.showOnlyAnomalies 
                    ? 'Nenhum item com anomalias' 
                    : filters.showOnlyUnchecked
                    ? 'Nenhum item não conferido'
                    : 'Nenhum item'
                }
                description={
                  filters.searchTerm 
                    ? 'Tente buscar por outro termo.' 
                    : filters.showOnlyAnomalies
                    ? 'Não há itens com anomalias registradas nesta demanda.'
                    : filters.showOnlyUnchecked
                    ? 'Todos os itens desta demanda já foram conferidos.'
                    : 'Não há itens nesta demanda.'
                }
              />
            )
          ) : (
            <div className="space-y-3">
              {displayItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => navigateToConference(item.id)}
                />
              ))}
            </div>
          )}
        </div>

          <BottomActionBar>
            <Button
              className="flex-1"
              onClick={handleFinishConference}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Conferência
                </>
              )}
            </Button>
          </BottomActionBar>
      </PageContainer>
    );
  }

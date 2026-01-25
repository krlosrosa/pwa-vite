import { useState } from 'react';
import { User, Building2, LogOut, Check, RefreshCw, Bug } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/_shared/components/ui/button';
import { Badge } from '@/_shared/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/_shared/components/ui/sheet';
import { useIdentityStore } from '@/_shared/stores/identityStore';
import { useAuth } from '@/auth/auth-provider';
import { useDemandStore } from '@/_shared/stores/demandStore';
import { useChecklistStore } from '@/_shared/stores/checklistStore';
import { useProdutoStore } from '@/_shared/stores/produtoStore';
import { useSyncDemand } from '@/hooks/logic/use-sync-demand';
import { useSyncCheckList } from '@/hooks/logic/use-sync-check-list';
import { useSyncConferencia } from '@/hooks/logic/use-sync-conferencia';
import { useSyncAnomalia } from '@/hooks/logic/use-sync-anomalia';
import { useSyncProdutos } from '@/hooks/logic/use-sync-produtos';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCenterSelection, setShowCenterSelection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  
  const { user, selectedCenter, availableCenters, setSelectedCenter } = useIdentityStore();
  const { logout } = useAuth();
  const { clearCache: clearDemandCache } = useDemandStore();
  const { clearCurrentChecklist } = useChecklistStore();
  const { clear: clearProdutoCache } = useProdutoStore();
  const { syncDemands } = useSyncDemand();
  const { syncCheckLists } = useSyncCheckList();
  const { syncAnomalias } = useSyncAnomalia();  
  const { syncConferences } = useSyncConferencia();
  const { syncProdutos } = useSyncProdutos();
  const handleCenterChange = (newCenter: string) => {
    setSelectedCenter(newCenter);
    setShowCenterSelection(false);
    
    // Clear all caches to prevent data contamination between centers
    clearDemandCache();
    clearCurrentChecklist();
    clearProdutoCache();
    
    // Refresh the current page by reloading
    window.location.reload();
  };

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Sync all data: conferences, checklists, and demands
      await syncProdutos(); 
      await   syncAnomalias();
      await syncConferences();
      await syncCheckLists();
      await syncDemands();
      // Show success feedback (you can add a toast here if needed)
      console.log('[UserMenu] Synchronization completed successfully');
    } catch (error) {
      console.error('[UserMenu] Synchronization failed:', error);
      // You can add error toast here if needed
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    // Clear all Zustand stores
    clearDemandCache();
    clearCurrentChecklist();
    clearProdutoCache();
    useIdentityStore.getState().clearIdentity();
    
    // Logout from auth
    logout();
    
    // Navigate to login (or let ProtectedRoute handle it)
    navigate({ to: '/' });
  };

  const userDisplayName = user?.name || 'Usuário';
  const userEmail = user?.id || '';

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-11 w-11 rounded-full bg-background border shadow-lg hover:bg-accent"
        aria-label="Menu do usuário"
      >
        <User className="h-5 w-5" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] rounded-t-2xl pb-safe pb-8">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil do Usuário
            </SheetTitle>
            <SheetDescription>
              Gerencie suas configurações e preferências
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6 px-4 py-4">
            {/* User Info Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Informações
              </h3>
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <div>
                  <p className="text-sm font-medium">{userDisplayName}</p>
                  {userEmail && (
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Current Center Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Centro Atual
              </h3>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {selectedCenter || 'Não selecionado'}
                    </span>
                  </div>
                  {selectedCenter && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Ativo
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Change Center Section */}
            {!showCenterSelection ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Ações
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}
                  </Button>
                  {availableCenters.length > 1 && (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12"
                      onClick={() => setShowCenterSelection(true)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Trocar Centro
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Selecione um Centro
                </h3>
                <div className="space-y-2">
                  {availableCenters.map((center) => (
                    <Button
                      key={center}
                      variant={selectedCenter === center ? 'default' : 'outline'}
                      className="w-full justify-start h-12"
                      onClick={() => handleCenterChange(center)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {center}
                      {selectedCenter === center && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full h-12"
                    onClick={() => setShowCenterSelection(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <SheetFooter className="px-4 pb-4 pt-4 border-t flex-col gap-2">
            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
            {/* Hidden Debug Button - Very discreet */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate({ to: '/debug' });
              }}
              className="text-xs text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors flex items-center gap-1 px-2 py-1"
              aria-label="Debug"
            >
              <Bug className="h-2.5 w-2.5" />
              <span className="opacity-0 w-0 overflow-hidden">Debug</span>
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

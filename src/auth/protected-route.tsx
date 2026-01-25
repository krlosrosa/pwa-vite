import { type ReactNode, useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { keycloak } from './keycloak-config';
import { hasValidToken } from './token-storage';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component with offline-first approach
 * Allows access if user has valid stored token, even when offline
 * Only triggers login if online and no valid token exists
 * 
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authenticated, loading, login } = useAuth();
  const [hasCheckedInit, setHasCheckedInit] = useState(false);
  const [loginTriggered, setLoginTriggered] = useState(false);

  // Check if Keycloak has completed initialization
  useEffect(() => {
    // Small delay to ensure local state initialization has completed
    const checkInit = setTimeout(() => {
      setHasCheckedInit(true);
    }, 100);

    return () => clearTimeout(checkInit);
  }, []);

  // OFFLINE-FIRST: Only trigger login if online and no valid token
  useEffect(() => {
    const isOnline = navigator.onLine;
    const hasStoredToken = hasValidToken();
    const keycloakAuthenticated = keycloak.authenticated || !!keycloak.token;
    const isActuallyAuthenticated = authenticated || keycloakAuthenticated || hasStoredToken;

    // Reset loginTriggered if user becomes authenticated
    if (isActuallyAuthenticated && loginTriggered) {
      setLoginTriggered(false);
      return;
    }

    // Check if we're already in the process of logging in (check URL for auth params)
    const hasAuthCode = window.location.search.includes('code=') || 
                        window.location.hash.includes('code=') ||
                        window.location.search.includes('state=') ||
                        window.location.hash.includes('state=');
    
    // OFFLINE-FIRST: Only trigger login if:
    // 1. Online (can't login offline)
    // 2. Not authenticated
    // 3. No stored valid token
    // 4. Loading is complete
    // 5. Not already triggered
    // 6. Not already in login flow
    if (
      isOnline && 
      !isActuallyAuthenticated && 
      !hasStoredToken &&
      !loading && 
      hasCheckedInit && 
      !loginTriggered && 
      !hasAuthCode
    ) {
      setLoginTriggered(true);
      // Only trigger login if online
      login();
    }
  }, [authenticated, loading, hasCheckedInit, loginTriggered, login]);

  // OFFLINE-FIRST: Check multiple sources for authentication
  const hasStoredToken = hasValidToken();
  const keycloakAuthenticated = keycloak.authenticated || !!keycloak.token;
  const isActuallyAuthenticated = authenticated || keycloakAuthenticated || hasStoredToken;

  // Priority 1: If authenticated (by context, Keycloak, OR stored token), render children
  // This includes offline access with stored token
  if (isActuallyAuthenticated) {
    return <>{children}</>;
  }

  // Priority 2: While loading OR checking init, don't show anything
  // This prevents the flash of "Authentication Required" screen
  if (loading || !hasCheckedInit) {
    return null;
  }

  // Priority 3: If offline and no stored token, show offline message
  if (!navigator.onLine && !hasStoredToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Você está offline e não possui uma sessão válida.</p>
          <p className="text-gray-500 text-sm">Por favor, conecte-se à internet para fazer login.</p>
        </div>
      </div>
    );
  }

  // Priority 4: While login is being triggered, don't render anything
  // The login() call will redirect to Keycloak
  if (loginTriggered) {
    return null;
  }

  // Priority 5: Online but not authenticated - show login prompt
  // (This should rarely happen due to auto-login, but serves as fallback)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Autenticação necessária</p>
        <button
          onClick={() => login()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Fazer Login
        </button>
      </div>
    </div>
  );
}

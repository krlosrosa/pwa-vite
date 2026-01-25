import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { keycloak, keycloakInitOptions, getInitializationPromise } from './keycloak-config';
import type Keycloak from 'keycloak-js';
import { 
  getToken as getStoredToken, 
  hasValidToken, 
  saveToken, 
  clearToken, 
  getUser, 
  saveUser 
} from './token-storage';
import { useIdentityStore } from '@/_shared/stores/identityStore';

interface AuthContextType {
  keycloak: Keycloak;
  authenticated: boolean;
  loading: boolean;
  user?: Keycloak.KeycloakTokenParsed;
  login: () => void;
  logout: () => void;
  getToken: () => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Clear authorization parameters from URL (both query string and hash)
 */
function clearAuthParamsFromUrl(): void {
  const url = new URL(window.location.href);
  const hadCodeInQuery = url.searchParams.has('code');
  const hadStateInQuery = url.searchParams.has('state');
  
  // Check hash fragment for Keycloak params
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  const hadCodeInHash = hashParams.has('code');
  const hadStateInHash = hashParams.has('state') || hashParams.has('session_state');
  
  const hasAnyParams = hadCodeInQuery || hadStateInQuery || hadCodeInHash || hadStateInHash;
  
  if (hasAnyParams) {
    // Clear query params
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('session_state');
    
    // Clear hash params
    hashParams.delete('code');
    hashParams.delete('state');
    hashParams.delete('session_state');
    
    // Reconstruct URL without hash params
    const newHash = hashParams.toString() ? '#' + hashParams.toString() : '';
    const cleanUrl = url.toString().split('#')[0] + newHash;
    
    window.history.replaceState({}, '', cleanUrl);
  }
}

/**
 * Check if URL has authorization code (in query string or hash)
 */
function hasAuthCodeInUrl(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const hasInQuery = urlParams.has('code') || urlParams.has('state');
  
  // Also check hash fragment
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  const hasInHash = hashParams.has('code') || hashParams.has('state') || hashParams.has('session_state');
  
  return hasInQuery || hasInHash;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // OFFLINE-FIRST: Check localStorage/IndexedDB BEFORE keycloak.init
  // This runs synchronously before first render
  const hasStoredToken = hasValidToken();
  const storedUser = hasStoredToken ? getUser() : null;
  const storedToken = hasStoredToken ? getStoredToken() : null;
  
  // Check Keycloak state as fallback
  const keycloakAuthCheck = keycloak.authenticated || !!keycloak.token;
  
  // If we have a valid stored token, consider authenticated immediately
  const initialAuthCheck = hasStoredToken || keycloakAuthCheck;
  
  const [authenticated, setAuthenticated] = useState(initialAuthCheck);
  const [loading, setLoading] = useState(true); // Loading for local state initialization only
  const [user, setUser] = useState<Keycloak.KeycloakTokenParsed | undefined>(
    initialAuthCheck 
      ? (keycloak.tokenParsed || storedUser || undefined)
      : undefined
  );

  useEffect(() => {
    let mounted = true;

    // OFFLINE-FIRST: If we have a valid stored token, authenticate immediately
    // This allows offline access without waiting for Keycloak server
    if (hasStoredToken && storedToken) {
      setAuthenticated(true);
      setLoading(false);
      setUser(storedUser || keycloak.tokenParsed || undefined);
      
      // Try to restore token to Keycloak instance if possible
      if (storedToken && !keycloak.token) {
        try {
          // Keycloak doesn't allow setting token directly, but we can try to use it
          // The token will be validated when we try to use it
        } catch (error) {
          // Silent fail - we'll rely on stored token for offline access
        }
      }
    } else if (keycloak.authenticated || keycloak.token) {
      // Fallback: if Keycloak already has token, use it
      setAuthenticated(true);
      setLoading(false);
      setUser(keycloak.tokenParsed || undefined);
      
      // Save token to storage for offline access
      if (keycloak.token) {
        saveToken(keycloak.token);
        if (keycloak.tokenParsed) {
          saveUser(keycloak.tokenParsed);
        }
      }
    }

    // Check for auth params in both query and hash
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    
    const hasStateInHash = hashParams.has('state') || hashParams.has('session_state');
    const hasCodeInQuery = urlParams.has('code');
    const hasCodeInHash = hashParams.has('code');
    
    // If we have state/session_state in hash but no code, this might be a stale callback
    if ((hasStateInHash || urlParams.has('state')) && !hasCodeInQuery && !hasCodeInHash) {
      clearAuthParamsFromUrl();
    }

    // Initialize loading state - this is for LOCAL state initialization only
    // Not waiting for server response
    setLoading(false);

    // Only initialize Keycloak if we're online or don't have a stored token
    // If offline with valid token, skip Keycloak init
    const isOnline = navigator.onLine;
    const shouldInitKeycloak = isOnline || !hasStoredToken;

    if (!shouldInitKeycloak) {
      // Offline with valid token - skip Keycloak init
      // We already set authenticated state above
      return;
    }

    // Use the shared initialization promise to prevent multiple initializations
    getInitializationPromise(keycloakInitOptions)
      .then((initAuthenticated) => {
        if (!mounted) return;

        // Check multiple sources to determine authentication status
        const isAuthenticated = initAuthenticated || keycloak.authenticated || !!keycloak.token || hasValidToken();
        
        // Update state
        if (isAuthenticated) {
          setAuthenticated(true);
          
          // Save token to storage for offline access
          if (keycloak.token) {
            saveToken(keycloak.token);
            if (keycloak.tokenParsed) {
              saveUser(keycloak.tokenParsed);
              setUser(keycloak.tokenParsed);
            }
          } else if (hasValidToken()) {
            // Use stored token
            const storedTokenValue = getToken();
            const storedUserValue = getUser();
            if (storedUserValue) {
              setUser(storedUserValue);
            }
          }
        } else {
          setAuthenticated(false);
        }

        if (isAuthenticated) {
          // Clear auth params from URL on success
          clearAuthParamsFromUrl();

          // Set up token refresh (only if online)
          if (isOnline) {
            keycloak.onTokenExpired = () => {
              if (!navigator.onLine) {
                // If offline, check if stored token is still valid
                if (hasValidToken()) {
                  return; // Keep using stored token
                }
              }
              
              keycloak
                .updateToken(30)
                .then((refreshed) => {
                  if (refreshed && mounted && keycloak.token) {
                    saveToken(keycloak.token);
                    if (keycloak.tokenParsed) {
                      saveUser(keycloak.tokenParsed);
                      setUser(keycloak.tokenParsed);
                    }
                  }
                })
                .catch(() => {
                  // If offline or refresh fails, check stored token
                  if (hasValidToken() && mounted) {
                    // Keep authenticated with stored token
                    return;
                  }
                  if (mounted) {
                    setAuthenticated(false);
                    setUser(undefined);
                  }
                });
            };
          }
        } else {
          // If not authenticated, check if there's an authorization code in URL
          if (hasAuthCodeInUrl()) {
            const isAuth = keycloak.authenticated || !!keycloak.token || hasValidToken();
            if (mounted) {
              setAuthenticated(isAuth);
              if (isAuth) {
                clearAuthParamsFromUrl();
                if (keycloak.tokenParsed) {
                  setUser(keycloak.tokenParsed);
                  saveToken(keycloak.token!);
                  saveUser(keycloak.tokenParsed);
                } else if (hasValidToken()) {
                  setUser(getUser() || undefined);
                }
              }
            }
          }
        }
      })
      .catch((error) => {
        // If Keycloak is already initialized, this is not a real error
        if (error.message && error.message.includes('can only be initialized once')) {
          const isAuth = keycloak.authenticated || !!keycloak.token;
          setAuthenticated(isAuth);
          if (isAuth) {
            setUser(keycloak.tokenParsed || undefined);
          }
          setLoading(false);
          return;
        }
        
        // Check if error is related to invalid authorization code (401)
        const isNetworkError = error.message?.includes('NetworkError') || 
                              error.message?.includes('401') || 
                              error.message?.includes('Unauthorized') ||
                              error.message?.includes('invalid status');
        
        const hasAuthParams = hasAuthCodeInUrl();
        
        if (isNetworkError) {
          // Always clear auth params on 401 - they're invalid or already consumed
          if (hasAuthParams) {
            clearAuthParamsFromUrl();
          }
          
          // Self-correction: Check if user is authenticated despite the error
          setTimeout(() => {
            if (mounted) {
              const isAuth = keycloak.authenticated || !!keycloak.token;
              
              if (isAuth) {
                setAuthenticated(true);
                setUser(keycloak.tokenParsed || undefined);
              } else {
                setAuthenticated(false);
              }
              setLoading(false);
            }
          }, 1000);
          return;
        }
        
        if (mounted) {
          setLoading(false);
          setAuthenticated(false);
        }
      });

    // Handle authentication state changes
    keycloak.onAuthSuccess = () => {
      if (!mounted) return;
      
      const isAuth = keycloak.authenticated || !!keycloak.token;
      clearAuthParamsFromUrl();
      setAuthenticated(isAuth);
      
      if (keycloak.tokenParsed) {
        setUser(keycloak.tokenParsed);
        if (keycloak.token) {
          saveToken(keycloak.token);
          saveUser(keycloak.tokenParsed);
        }
      }
    };

    keycloak.onAuthError = () => {
      // Clear invalid authorization parameters from URL
      if (hasAuthCodeInUrl()) {
        clearAuthParamsFromUrl();
      }
      
      // OFFLINE-FIRST: Check stored token before marking as unauthenticated
      if (hasValidToken()) {
        setAuthenticated(true);
        setUser(getUser() || undefined);
      } else if (mounted) {
        setAuthenticated(false);
        setUser(undefined);
      }
    };

    keycloak.onAuthLogout = () => {
      if (mounted) {
        clearToken(); // Clear stored token on logout
        setAuthenticated(false);
        setUser(undefined);
      }
    };

    // Double-check auth state immediately (handles redirect from login)
    const checkAuthState = () => {
      if (mounted) {
        const isAuth = keycloak.authenticated || !!keycloak.token || hasValidToken();
        if (isAuth !== authenticated) {
          setAuthenticated(isAuth);
          if (isAuth) {
            clearAuthParamsFromUrl();
            if (keycloak.tokenParsed) {
              setUser(keycloak.tokenParsed);
              if (keycloak.token) {
                saveToken(keycloak.token);
                saveUser(keycloak.tokenParsed);
              }
            } else if (hasValidToken()) {
              setUser(getUser() || undefined);
            }
          } else {
            setUser(undefined);
          }
        }
      }
    };

    // Check immediately
    checkAuthState();
    
    // Also check after a short delay for edge cases (only if not already authenticated)
    let redirectCheckTimeout: NodeJS.Timeout | null = null;
    if (!initialAuthCheck) {
      redirectCheckTimeout = setTimeout(checkAuthState, 200);
    }

    // Listen for window focus (happens after redirect from login)
    const handleFocus = () => {
      if (mounted && keycloak) {
        const isAuth = keycloak.authenticated || !!keycloak.token || hasValidToken();
        if (isAuth !== authenticated) {
          setAuthenticated(isAuth);
          if (isAuth) {
            clearAuthParamsFromUrl();
            if (keycloak.tokenParsed) {
              setUser(keycloak.tokenParsed);
              if (keycloak.token) {
                saveToken(keycloak.token);
                saveUser(keycloak.tokenParsed);
              }
            } else if (hasValidToken()) {
              setUser(getUser() || undefined);
            }
          } else {
            setUser(undefined);
          }
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    // Listen for online/offline events
    const handleOnline = () => {
      if (mounted) {
        // When coming back online, try to sync with Keycloak
        checkAuthState();
      }
    };
    
    const handleOffline = () => {
      if (mounted) {
        // When going offline, rely on stored token
        if (hasValidToken()) {
          setAuthenticated(true);
          setUser(getUser() || undefined);
        }
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      mounted = false;
      if (redirectCheckTimeout) {
        clearTimeout(redirectCheckTimeout);
      }
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      keycloak.onTokenExpired = undefined;
      keycloak.onAuthSuccess = undefined;
      keycloak.onAuthError = undefined;
      keycloak.onAuthLogout = undefined;
    };
  }, []); // Empty deps - only run once on mount

  const login = () => {
    // Clear any existing auth parameters from URL before login
    clearAuthParamsFromUrl();
    keycloak.login();
  };

  const logout = () => {
    clearToken(); // Clear stored token
    useIdentityStore.getState().clearIdentity(); // Clear identity store
    keycloak.logout();
  };

  const getToken = async (): Promise<string | undefined> => {
    try {
      // OFFLINE-FIRST: Check stored token first
      if (!navigator.onLine && hasValidToken()) {
        const storedToken = getStoredToken();
        if (storedToken) {
          return storedToken;
        }
      }
      
      // If online, try to refresh Keycloak token
      if (navigator.onLine && keycloak.token) {
        // Check if token needs refresh
        if (keycloak.isTokenExpired(30)) {
          await keycloak.updateToken(30);
          if (keycloak.token) {
            saveToken(keycloak.token); // Save refreshed token
            if (keycloak.tokenParsed) {
              saveUser(keycloak.tokenParsed);
            }
          }
        }
        return keycloak.token;
      }
      
      // Fallback to stored token
      if (hasValidToken()) {
        return getStoredToken() || undefined;
      }
      
      return undefined;
    } catch (error) {
      // If refresh fails, try stored token
      if (hasValidToken()) {
        return getStoredToken() || undefined;
      }
      return undefined;
    }
  };

  const value: AuthContextType = {
    keycloak,
    authenticated,
    loading,
    user,
    login,
    logout,
    getToken,
  };

  // Loading is only for local state initialization, not server response
  // Render children immediately - ProtectedRoute handles auth checks
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

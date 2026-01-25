import Keycloak from 'keycloak-js';

/**
 * Keycloak configuration using environment variables
 * IMPORTANT: For public clients (frontend apps), DO NOT use clientSecret
 * The client must be configured as "Public" in Keycloak admin console
 * 
 * Make sure to set these in your .env.local file:
 * - VITE_KEYLOAK_URL: The base URL of your Keycloak server
 * - VITE_KEYLOAK_REALM: The realm name
 * - VITE_KEYLOAK_CLIENT_ID: The client ID configured in Keycloak
 */
const keycloakConfig = {
  url: import.meta.env.VITE_KEYLOAK_URL || 'https://auth.lilog.app',
  realm: import.meta.env.VITE_KEYLOAK_REALM || 'lilog',
  clientId: import.meta.env.VITE_KEYLOAK_CLIENT_ID || 'vite',
  // REMOVED: clientSecret - Public clients (frontend apps) should NOT have a secret
  // The client must be configured as "Public" in Keycloak admin console
};

// Validate configuration
if (!keycloakConfig.url || !keycloakConfig.realm || !keycloakConfig.clientId) {
  console.warn(
    'Keycloak configuration is incomplete. Please set VITE_KEYLOAK_URL, VITE_KEYLOAK_REALM, and VITE_KEYLOAK_CLIENT_ID in your .env.local file.'
  );
}

/**
 * Initialize Keycloak instance
 */
export const keycloak = new Keycloak(keycloakConfig);

/**
 * Track if Keycloak has been initialized to prevent multiple initializations
 * This is a module-level variable that persists across component re-renders
 */
let initializationPromise: Promise<boolean> | null = null;
let isInitialized = false;

/**
 * Check if Keycloak is already initialized
 */
export function isKeycloakInitialized(): boolean {
  return isInitialized;
}

/**
 * Mark Keycloak as initialized
 */
export function setKeycloakInitialized(value: boolean): void {
  isInitialized = value;
}

/**
 * Check if URL has authorization code that needs processing
 */
function hasAuthCodeToProcess(): boolean {
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  return hashParams.has('code') || new URLSearchParams(window.location.search).has('code');
}

/**
 * Move authorization code from hash to query string if present
 * IMPORTANT: Preserves the original pathname to match the redirect_uri used in login
 */
function moveCodeFromHashToQuery(): void {
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  
  if (hashParams.has('code') && !new URLSearchParams(window.location.search).has('code')) {
    const code = hashParams.get('code');
    const state = hashParams.get('state');
    const sessionState = hashParams.get('session_state');
    
    // Preserve the full URL including pathname - this is critical for redirect_uri matching
    const currentUrl = window.location.href.split('#')[0];
    const url = new URL(currentUrl);
    
    // Preserve existing query params if any
    const existingParams = new URLSearchParams(url.search);
    
    if (code) existingParams.set('code', code);
    if (state) existingParams.set('state', state);
    if (sessionState) existingParams.set('session_state', sessionState);
    
    // Rebuild URL with preserved pathname
    url.search = existingParams.toString();
    
    // Clear hash params
    hashParams.delete('code');
    hashParams.delete('state');
    hashParams.delete('session_state');
    hashParams.delete('iss');
    
    const newHash = hashParams.toString() ? '#' + hashParams.toString() : '';
    const newUrl = url.toString() + newHash;
    
    window.history.replaceState({}, '', newUrl);
  }
}

/**
 * Get or create initialization promise to prevent multiple initializations
 */
export function getInitializationPromise(initOptions: Keycloak.KeycloakInitOptions): Promise<boolean> {
  const hasCode = hasAuthCodeToProcess();
  
  // Check if already initialized (Strict Mode guard)
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // With PKCE, Keycloak typically uses hash fragments, not query strings
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  const codeInHash = hashParams.has('code');
  const codeInQuery = new URLSearchParams(window.location.search).has('code');
  
  if (hasCode) {
    if (codeInHash && !codeInQuery) {
      // Don't move - let Keycloak process from hash (PKCE flow)
    } else if (codeInQuery) {
      // Already in query string
    } else {
      // Fallback: move from hash to query if needed
      moveCodeFromHashToQuery();
    }
  }
  
  initializationPromise = keycloak.init(initOptions)
    .then((authenticated) => {
      isInitialized = true;
      return authenticated;
    })
    .catch((error) => {
      // If error is 401 and we had a code, the code was likely consumed or invalid
      const isAuthError = error.message?.includes('401') || 
                         error.message?.includes('Unauthorized') ||
                         error.message?.includes('invalid status');
      
      // Don't reset promise on 401 with code - it means code was consumed
      // Only reset on other errors
      if (!isAuthError || !hasCode) {
        initializationPromise = null; // Reset on error so we can retry
      }
      
      throw error;
    });
  
  return initializationPromise;
}

/**
 * Keycloak initialization options
 */
export const keycloakInitOptions: Keycloak.KeycloakInitOptions = {
  onLoad: 'check-sso', // Check SSO on load, but don't redirect if not authenticated
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256', // Use PKCE for better security
  checkLoginIframe: false, // Disabled - causes 403 Forbidden errors and not needed for public clients
  enableLogging: import.meta.env.DEV, // Enable logging in development
};

/**
 * Authentication module exports
 * Centralized exports for Keycloak authentication functionality
 */

export { AuthProvider, useAuth } from './auth-provider';
export { ProtectedRoute } from './protected-route';
export { keycloak, keycloakInitOptions } from './keycloak-config';

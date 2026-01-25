/**
 * Token storage utilities for offline-first authentication
 * Manages token persistence in localStorage and IndexedDB
 */

const TOKEN_STORAGE_KEY = 'keycloak_token';
const TOKEN_EXPIRY_KEY = 'keycloak_token_expiry';
const USER_STORAGE_KEY = 'keycloak_user';

/**
 * Decode JWT token to extract payload
 */
function decodeJWT(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;
  
  return currentTime >= (expiryTime - bufferTime);
}

/**
 * Save token to localStorage
 */
export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    
    const decoded = decodeJWT(token);
    if (decoded?.exp) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, decoded.exp.toString());
    }
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
  }
}

/**
 * Get token from localStorage
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return null;
  }
}

/**
 * Check if we have a valid (non-expired) token in storage
 */
export function hasValidToken(bufferSeconds: number = 30): boolean {
  const token = getToken();
  if (!token) return false;
  
  return !isTokenExpired(token, bufferSeconds);
}

/**
 * Remove token from storage
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing token from localStorage:', error);
  }
}

/**
 * Save user info to localStorage
 */
export function saveUser(user: any): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
}

/**
 * Get user info from localStorage
 */
export function getUser(): any | null {
  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error reading user from localStorage:', error);
    return null;
  }
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(): number | null {
  try {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiryStr ? parseInt(expiryStr, 10) : null;
  } catch (error) {
    console.error('Error reading token expiry from localStorage:', error);
    return null;
  }
}

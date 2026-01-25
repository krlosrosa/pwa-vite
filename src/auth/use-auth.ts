import { useAuth as useAuthContext } from './auth-provider';

/**
 * Custom hook to access authentication state and functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { authenticated, user, login, logout } = useAuth();
 *   
 *   if (!authenticated) {
 *     return <button onClick={login}>Login</button>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user?.preferred_username}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  return useAuthContext();
}

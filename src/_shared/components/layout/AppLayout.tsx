import { Outlet } from '@tanstack/react-router';
import { UserMenu } from './UserMenu';

/**
 * AppLayout wraps all pages and provides:
 * - Global user menu button (floating or fixed)
 * - Consistent layout structure
 * - User menu accessible from any page
 * 
 * Note: Individual pages still use their own PageHeader components.
 * This layout just ensures the UserMenu is always accessible.
 */
export function AppLayout() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Page Content */}
      <Outlet />
      
      {/* Floating User Menu Button - Always accessible */}
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>
    </div>
  );
}

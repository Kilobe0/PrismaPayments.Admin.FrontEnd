import { tokenStorage } from '$appmod/services/storage/tokenStorage';
import { redirect } from '@sveltejs/kit';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'VIEWER';

const ROLE_LEVELS: Record<AdminRole, number> = {
  VIEWER: 1,
  SUPPORT: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

export function hasPermission(
  userRole: AdminRole | null,
  requiredRole: AdminRole
): boolean {
  if (!userRole) return false;
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

export function requireAuth(): void {
  const token = tokenStorage.getAccessToken();
  if (!token) {
    throw redirect(303, '/login');
  }
}

export function requireRole(requiredRole: AdminRole): void {
  requireAuth();
  const role = tokenStorage.getAdminRole() as AdminRole | null;
  if (!hasPermission(role, requiredRole)) {
    throw redirect(303, '/dashboard');
  }
}

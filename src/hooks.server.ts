import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';

const PUBLIC_ROUTES = ['/login', '/logout', '/api/internal/sync-token'];

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const isPublic = PUBLIC_ROUTES.some(r => path.startsWith(r));

  const token = event.cookies.get('access_token') ?? null;
  event.locals.accessToken = token;
  event.locals.adminRole = null;

  if (token) {
    try {
      const payload = jwtDecode<{ role?: string }>(token);
      event.locals.adminRole = payload.role ?? null;
    } catch {
      event.locals.adminRole = null;
    }
  }

  if (!isPublic && !token) {
    throw redirect(303, '/login');
  }

  const response = await resolve(event);
  return response;
};

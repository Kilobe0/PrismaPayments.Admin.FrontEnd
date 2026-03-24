import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const PUBLIC_ROUTES = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const isPublic = PUBLIC_ROUTES.some(r => path.startsWith(r));

  if (!isPublic) {
    const token = event.cookies.get('access_token');
    if (!token) {
      throw redirect(303, '/login');
    }
  }

  const response = await resolve(event);
  return response;
};

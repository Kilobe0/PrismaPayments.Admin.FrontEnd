import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ cookies }) => {
    cookies.delete('access_token', { path: '/' });
    cookies.delete('refresh_token', { path: '/' });
    throw redirect(303, '/login');
  }
};

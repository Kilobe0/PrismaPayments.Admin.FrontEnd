import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '');
    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      return fail(400, { error: 'E-mail ou senha inválidos.' });
    }

    let res: Response;
    try {
      res = await fetch(`${privateEnv.PRIVATE_API_BASE_URL}/api/v1/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'client-secret': privateEnv.PRIVATE_CLIENT_SECRET
        },
        body: JSON.stringify({ email, password })
      });
    } catch {
      return fail(503, { error: 'Falha ao conectar. Tente novamente.' });
    }

    let body: {
      responseType?: string;
      data?: { accessToken: string; refreshToken: string; expiresIn?: number };
      message?: string;
    };
    try {
      body = await res.json();
    } catch {
      return fail(503, { error: 'Falha ao conectar. Tente novamente.' });
    }

    if (!body?.data?.accessToken) {
      return fail(401, { error: body.message ?? 'E-mail ou senha inválidos.' });
    }

    const secure = process.env.NODE_ENV === 'production';
    const maxAge = body.data.expiresIn ?? 3600;

    cookies.set('access_token', body.data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      maxAge
    });

    cookies.set('refresh_token', body.data.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    // Return tokens for the enhance callback to save to sessionStorage.
    // Navigation to /dashboard is handled by the client via goto().
    return {
      success: true,
      accessToken: body.data.accessToken,
      refreshToken: body.data.refreshToken
    };
  },

  logout: async ({ cookies }) => {
    cookies.delete('access_token', { path: '/' });
    cookies.delete('refresh_token', { path: '/' });
    return { success: true };
  }
};

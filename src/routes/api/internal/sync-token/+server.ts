import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { accessToken?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid body' }, { status: 400 });
  }

  if (!body?.accessToken) {
    return json({ error: 'accessToken required' }, { status: 400 });
  }

  const secure = process.env.NODE_ENV === 'production';
  cookies.set('access_token', body.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 3600
  });

  return json({ ok: true });
};

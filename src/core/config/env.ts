import { PUBLIC_API_BASE_URL, PUBLIC_CLIENT_SECRET } from '$env/static/public';

export const env = {
  apiBaseUrl: PUBLIC_API_BASE_URL ?? 'http://localhost:5000',
  clientSecret: PUBLIC_CLIENT_SECRET ?? ''
} as const;

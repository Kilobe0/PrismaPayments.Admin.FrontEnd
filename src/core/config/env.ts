import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const env = {
  apiBaseUrl: PUBLIC_API_BASE_URL ?? 'http://localhost:5000'
} as const;

import Constants from 'expo-constants';

/**
 * Where the Django API lives.
 *
 * 1. EXPO_PUBLIC_API_URL in a .env file wins (use it once Django is deployed).
 * 2. Otherwise, in development, we reuse the IP address of the computer
 *    running "npx expo start". Django must run on that same computer with:
 *        python manage.py runserver 0.0.0.0:8000
 */
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];
  if (host) return `http://${host}:8000/api/v1`;

  return 'http://localhost:8000/api/v1';
}

export const API_URL = resolveApiUrl();
export const SITE_URL = API_URL.replace(/\/api\/v1$/, '');

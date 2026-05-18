const AUTH_TOKEN_KEY = 'salvexa_auth_token';
const AUTH_USER_KEY = 'salvexa_auth_user';

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
}

export function getApiBaseUrlCandidates() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  const hostname =
    typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : 'localhost';

  const candidates = [
    configured,
    `http://${hostname}:5000/api`,
    `http://${hostname}:5001/api`,
  ].filter(Boolean) as string[];

  return Array.from(new Set(candidates));
}

export function saveAuthSession(token: string, user: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthUser<T = { id: number; name: string; email: string }>() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

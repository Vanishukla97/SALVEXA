import { clearAuthSession, getApiBaseUrlCandidates, getAuthToken } from './auth';

type ApiRequestOptions = {
  token?: string | null;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  isFormData?: boolean;
  signal?: AbortSignal;
};

async function tryFetchFromBase(
  baseUrl: string,
  path: string,
  options: ApiRequestOptions
) {
  const headers: Record<string, string> = { ...(options.headers || {}) };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const hasBody = options.body !== undefined;

  const isFormData = options.isFormData || false;
  if (hasBody && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    credentials: options.credentials || 'include',
    body: hasBody ? (isFormData ? (options.body as FormData) : JSON.stringify(options.body)) : undefined,
    ...(options.signal ? { signal: options.signal } : {}),
  });
  return response;
}

export async function fetchApiJson<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<{ response: Response; payload: T }> {
  const baseUrls = getApiBaseUrlCandidates();
  let lastNetworkError: Error | null = null;

  for (const baseUrl of baseUrls) {
    try {
      const response = await tryFetchFromBase(baseUrl, path, options);
      if (response.status === 401 && typeof window !== 'undefined') {
        const hadToken = Boolean(getAuthToken());
        if (hadToken) {
          clearAuthSession();
          const { pathname } = window.location;
          if (pathname !== '/login' && pathname !== '/register') {
            window.location.href = '/login';
          }
        }
      }
      const payload = (await response.json().catch(() => ({}))) as T;
      return { response, payload };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      lastNetworkError =
        error instanceof Error ? error : new Error('Unknown network error');
    }
  }

  throw lastNetworkError || new Error('Failed to connect to backend service.');
}

let accessTokenInMemory: string | null = null;
let onSessionExpiredCallback: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessTokenInMemory = token;
}

export function getAccessToken(): string | null {
  return accessTokenInMemory;
}

export function setOnSessionExpired(callback: () => void) {
  onSessionExpiredCallback = callback;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// Support Vite environment variable VITE_API_URL or fall back to /api/v1
const rawEnvUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
export const API_BASE_URL = rawEnvUrl ? rawEnvUrl.replace(/\/+$/, '') : '/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; message?: string; meta?: any; error?: any }> {
  let url: string;
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url = `${API_BASE_URL}${cleanEndpoint}`;
  }

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessTokenInMemory) {
    headers['Authorization'] = `Bearer ${accessTokenInMemory}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Send httpOnly refresh cookie
    });
  } catch (netErr: any) {
    throw {
      success: false,
      message: `Network error connecting to API: ${netErr?.message || 'Failed to fetch'}. Please verify backend server is running and accessible.`,
    };
  }

  // If 401 and not already a login or refresh request, try silent refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshUrl = `${API_BASE_URL}/auth/refresh`;
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshText = await refreshRes.text();
        const refreshData = refreshText ? JSON.parse(refreshText) : {};
        const newToken = refreshData.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          // Retry original request
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      } else {
        setAccessToken(null);
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback();
        }
      }
    } catch {
      setAccessToken(null);
      if (onSessionExpiredCallback) {
        onSessionExpiredCallback();
      }
    }
  }

  // Safe parsing to prevent "Unexpected end of JSON input" on HTML or empty responses
  let json: any;
  const rawText = await response.text();
  try {
    json = rawText ? JSON.parse(rawText) : {};
  } catch {
    json = {
      success: false,
      message:
        rawText && rawText.length < 200
          ? rawText
          : `Server returned non-JSON response (Status ${response.status}: ${response.statusText || 'Error'})`,
    };
  }

  if (!response.ok) {
    throw json;
  }

  return json;
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) =>
    apiRequest<T>(endpoint, { method: 'GET', params }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

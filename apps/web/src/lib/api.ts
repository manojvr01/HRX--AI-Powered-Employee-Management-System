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

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; message?: string; meta?: any; error?: any }> {
  let url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

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

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Send httpOnly refresh cookie
  });

  // If 401 and not already a login or refresh request, try silent refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
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
        // Refresh failed, session expired
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

  const json = await response.json();
  if (!response.ok) {
    throw json;
  }

  return json;
}

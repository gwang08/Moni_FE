const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: number | undefined,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

interface AuthStorage {
  state: { token?: string; expiryTime?: string; isAuthenticated?: boolean; user?: unknown };
}

function getStoredAuth(): AuthStorage['state'] {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return {};
    return JSON.parse(raw).state || {};
  } catch { return {}; }
}

function setStoredToken(token: string, expiryTime: string) {
  try {
    const raw = localStorage.getItem('auth-storage');
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    parsed.state.token = token;
    parsed.state.expiryTime = expiryTime;
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
  } catch { /* ignore */ }
}

function clearStoredAuth() {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.state = { token: null, expiryTime: null, user: null, isAuthenticated: false };
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
  } catch { /* ignore */ }
}

/** Fires a custom event so the UI can show a session-expired dialog. */
function fireSessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('session-expired'));
  }
}

export class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return getStoredAuth().token || null;
  }

  /** Try to refresh the token. Deduplicates concurrent calls. */
  private async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const currentToken = this.getAuthToken();
      if (!currentToken) return null;

      try {
        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newToken = data.result?.token;
        const newExpiry = data.result?.expiryTime;
        if (!newToken) return null;
        setStoredToken(newToken, newExpiry);
        return newToken as string;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { requiresAuth = false, headers = {}, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: { 'Content-Type': 'application/json', ...headers },
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (!token) throw new ApiError(401, undefined, 'Chưa đăng nhập');
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    }

    const url = `${this.baseUrl}${endpoint}`;
    let response = await fetch(url, config);

    // Auto-refresh on 401 for authenticated requests
    if (response.status === 401 && requiresAuth) {
      const newToken = await this.refreshToken();
      if (newToken) {
        config.headers = { ...config.headers, Authorization: `Bearer ${newToken}` };
        response = await fetch(url, config);
      } else {
        clearStoredAuth();
        fireSessionExpired();
        throw new ApiError(401, undefined, 'Phiên đăng nhập đã hết hạn');
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) throw new ApiError(response.status, undefined, 'Lỗi server');
      return {} as T;
    }

    const data = await response.json();
    if (!response.ok) throw new ApiError(response.status, data.code, data.message || 'Yêu cầu thất bại');
    return data;
  }

  async get<T>(endpoint: string, requiresAuth = false, options?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth, signal: options?.signal });
  }

  async post<T>(endpoint: string, body?: unknown, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      requiresAuth,
    });
  }

  async put<T>(endpoint: string, body?: unknown, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }

  async upload<T>(endpoint: string, file: File): Promise<T> {
    const token = this.getAuthToken();
    if (!token) throw new ApiError(401, undefined, 'Chưa đăng nhập');

    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}${endpoint}`;
    let response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    // Auto-refresh on 401 for upload
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        response = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${newToken}` },
          body: formData,
        });
      } else {
        clearStoredAuth();
        fireSessionExpired();
        throw new ApiError(401, undefined, 'Phiên đăng nhập đã hết hạn');
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) throw new ApiError(response.status, undefined, 'Tải lên thất bại');
      return {} as T;
    }

    const data = await response.json();
    if (!response.ok) throw new ApiError(response.status, data.code, data.message || 'Tải lên thất bại');
    return data;
  }
}

export const apiClient = new ApiClient();

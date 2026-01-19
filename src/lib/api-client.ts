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

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    // Access Zustand store from localStorage
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;

    try {
      const { state } = JSON.parse(stored);
      return state?.token || null;
    } catch {
      return null;
    }
  }

  async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { requiresAuth = false, headers = {}, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = this.getAuthToken();
      if (!token) {
        throw new ApiError(401, undefined, 'No authentication token found');
      }
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(
          response.status,
          undefined,
          'Server error - non-JSON response'
        );
      }
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.code,
        data.message || 'Request failed'
      );
    }

    return data;
  }

  // Convenience methods
  async get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      requiresAuth,
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

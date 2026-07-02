import { safeStorage } from '../storage/safeStorage';

const TOKEN_KEY = 'schoolchat:token';

/** Thrown when the API returns a non-success response. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/** HTTP client for the shared School Chat API. */
export const apiClient = {
  /** Registers a callback for 401 responses. */
  setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    onUnauthorized = handler;
  },

  getToken(): string | null {
    return safeStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string | null): void {
    if (token) {
      safeStorage.setItem(TOKEN_KEY, token);
    } else {
      safeStorage.removeItem(TOKEN_KEY);
    }
  },

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${import.meta.env.BASE_URL}api${path}`, {
      ...options,
      headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
      throw new ApiError(payload.error ?? 'Request failed.', response.status);
    }

    return payload as T;
  },

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  },
};

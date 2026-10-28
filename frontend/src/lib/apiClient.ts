import { ApiResponse, ProblemDetail, SystemStatus } from '@/types/api';

export class ApiClientError extends Error {
  public problem: ProblemDetail;

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title || 'API Request Failed');
    this.name = 'ApiClientError';
    this.problem = problem;
  }
}

// Environment-specific backend base URL (fallback to local dev proxy)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Double-submit CSRF cookie support for mutating requests
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken && !headers.has('X-XSRF-TOKEN')) {
    headers.set('X-XSRF-TOKEN', csrfToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensure session cookies (JSESSIONID) are dispatched
  });

  if (!response.ok) {
    let problem: ProblemDetail;
    try {
      problem = await response.json();
    } catch {
      problem = {
        title: response.statusText || 'HTTP Error',
        status: response.status,
        detail: `The server responded with status code ${response.status}`,
      };
    }
    throw new ApiClientError(problem);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  // Health and System Diagnostics
  getSystemStatus: () =>
    request<ApiResponse<SystemStatus>>('/system/status', { method: 'GET' }),
};

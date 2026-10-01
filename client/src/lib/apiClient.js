import { supabase, isDevPlaceholderSupabase } from './supabase.js';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' &&
   window.location.hostname !== 'localhost' &&
   window.location.hostname !== '127.0.0.1'
    ? 'https://wandershot-api.onrender.com/api'
    : '/api');

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 400, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function getAuthToken() {
  if (isDevPlaceholderSupabase) {
    // Return saved local session token
    const demoToken = localStorage.getItem('wandershot_demo_token');
    return demoToken || 'demo-user-00000000-0000-0000-0000-000000000001';
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export async function request(endpoint, options = {}) {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (res.status === 401 && !endpoint.includes('/share/')) {
      if (!isDevPlaceholderSupabase) {
        await supabase.auth.signOut();
      }
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.success === false) {
      const err = json.error || {};
      throw new ApiError(
        err.message || `Request failed with status ${res.status}`,
        err.code || 'UNKNOWN_ERROR',
        res.status,
        err.details
      );
    }

    return json.data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network request failed', 'NETWORK_ERROR', 0);
  }
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;

import {
  LoginRequest,
  LoginResponse,
  User,
  HostedZone,
  HostedZoneCreate,
  HostedZoneUpdate,
  DNSRecord,
  DNSRecordCreate,
  DNSRecordUpdate,
  PaginatedResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Core fetch wrapper ──────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Auth API ────────────────────────────────────────────

export const authAPI = {
  login: (data: LoginRequest) =>
    apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiFetch<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  getSession: () => apiFetch<User>('/api/auth/session'),
};

// ─── Hosted Zones API ────────────────────────────────────

export interface HostedZoneListParams {
  search?: string;
  type?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const hostedZonesAPI = {
  list: (params: HostedZoneListParams = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.type) query.set('type', params.type);
    if (params.page) query.set('page', params.page.toString());
    if (params.per_page) query.set('per_page', params.per_page.toString());
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    return apiFetch<PaginatedResponse<HostedZone>>(`/api/hosted-zones?${query.toString()}`);
  },

  get: (id: string) => apiFetch<HostedZone>(`/api/hosted-zones/${id}`),

  create: (data: HostedZoneCreate) =>
    apiFetch<HostedZone>('/api/hosted-zones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: HostedZoneUpdate) =>
    apiFetch<HostedZone>(`/api/hosted-zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/hosted-zones/${id}`, {
      method: 'DELETE',
    }),
};

// ─── DNS Records API ─────────────────────────────────────

export interface RecordListParams {
  search?: string;
  type?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const recordsAPI = {
  list: (zoneId: string, params: RecordListParams = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.type) query.set('type', params.type);
    if (params.page) query.set('page', params.page.toString());
    if (params.per_page) query.set('per_page', params.per_page.toString());
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    return apiFetch<PaginatedResponse<DNSRecord>>(`/api/hosted-zones/${zoneId}/records?${query.toString()}`);
  },

  get: (recordId: string) => apiFetch<DNSRecord>(`/api/records/${recordId}`),

  create: (zoneId: string, data: DNSRecordCreate) =>
    apiFetch<DNSRecord>(`/api/hosted-zones/${zoneId}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (recordId: string, data: DNSRecordUpdate) =>
    apiFetch<DNSRecord>(`/api/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (recordId: string) =>
    apiFetch<void>(`/api/records/${recordId}`, {
      method: 'DELETE',
    }),
};

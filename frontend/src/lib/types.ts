// ─── User & Auth ─────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string | null;
  account_id: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Hosted Zone ─────────────────────────────────────────

export interface HostedZone {
  id: string;
  zone_id: string;
  name: string;
  type: 'Public' | 'Private';
  comment: string;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface HostedZoneCreate {
  name: string;
  type: 'Public' | 'Private';
  comment?: string;
}

export interface HostedZoneUpdate {
  comment?: string;
}

// ─── DNS Record ──────────────────────────────────────────

export type RecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'PTR' | 'SRV' | 'CAA' | 'SOA';

export type RoutingPolicy = 'Simple' | 'Weighted' | 'Latency' | 'Failover' | 'Geolocation';

export interface DNSRecord {
  id: string;
  record_id: string;
  hosted_zone_id: string;
  name: string;
  type: RecordType;
  value: string;
  ttl: number;
  routing_policy: RoutingPolicy;
  weight: number | null;
  set_identifier: string | null;
  created_at: string;
  updated_at: string;
}

export interface DNSRecordCreate {
  name: string;
  type: RecordType;
  value: string;
  ttl?: number;
  routing_policy?: RoutingPolicy;
  weight?: number;
  set_identifier?: string;
}

export interface DNSRecordUpdate {
  name?: string;
  type?: RecordType;
  value?: string;
  ttl?: number;
  routing_policy?: RoutingPolicy;
  weight?: number;
  set_identifier?: string;
}

// ─── Pagination ──────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ─── API Error ───────────────────────────────────────────

export interface APIError {
  detail: string;
}

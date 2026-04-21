const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// ---- Auth ----
export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { name: string; email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),
};

// ---- Agents ----
export interface Agent {
  _id: string;
  id?: string;
  name: string;
  status: 'active' | 'inactive' | 'training';
  type: string;
  callsHandled: number;
  avgDuration: string;
  successRate: number;
  createdAt: string;
  language: string;
  voice?: string;
  instructions?: string;
  phoneNumber?: string;
}

export const agents = {
  list: () => request<Agent[]>('/agents'),
  get: (id: string) => request<Agent>(`/agents/${id}`),
  create: (data: { name: string; type: string; language: string; voice: string; instructions?: string; phoneNumber?: string }) =>
    request<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Agent>) =>
    request<Agent>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/agents/${id}`, { method: 'DELETE' }),
  toggle: (id: string) =>
    request<Agent>(`/agents/${id}/toggle`, { method: 'PATCH' }),
  startCall: (id: string, phoneNumber?: string) =>
    request<{ message: string; roomName: string }>(`/agents/${id}/call`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),
};

// ---- Conversations ----
export interface Conversation {
  _id: string;
  id?: string;
  agentName: string;
  customerName: string;
  duration: string;
  outcome: 'success' | 'transferred' | 'failed';
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  transcript?: { role: string; text: string; timestamp?: string }[];
  createdAt: string;
  timestamp?: string;
}

export const conversations = {
  list: (params?: { search?: string; outcome?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.outcome) query.set('outcome', params.outcome);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<{ conversations: Conversation[]; pagination: any }>(`/conversations${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<Conversation>(`/conversations/${id}`),
  getTranscript: (id: string) =>
    request<{ agentName: string; customerName: string; transcript: any[] }>(`/conversations/${id}/transcript`),
  export: (params?: { search?: string; outcome?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.outcome) query.set('outcome', params.outcome);
    return `${API_BASE}/conversations/export?${query.toString()}`;
  },
};

// ---- Analytics ----
export const analytics = {
  dashboard: () =>
    request<{
      totalCallsToday: number;
      callChange: number;
      successRate: number;
      avgDuration: string;
      activeAgents: number;
      trainingAgents: number;
    }>('/analytics/dashboard'),
  callVolume: (days = 7) =>
    request<{ date: string; calls: number }[]>(`/analytics/call-volume?days=${days}`),
  successRate: (days = 7) =>
    request<{ date: string; rate: number }[]>(`/analytics/success-rate?days=${days}`),
  duration: (days = 7) =>
    request<{ date: string; minutes: number }[]>(`/analytics/duration?days=${days}`),
  agentPerformance: () =>
    request<{ name: string; calls: number; success: number }[]>('/analytics/agents'),
  recent: () => request<Conversation[]>('/analytics/recent'),
};

// ---- Settings ----
export const settings = {
  get: () => request<any>('/settings'),
  update: (data: any) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getApiKeys: () => request<any[]>('/settings/api-keys'),
  revealApiKey: (keyId: string) => request<{ key: string; type: string }>(`/settings/api-keys/${keyId}/reveal`),
  generateApiKey: (type: string) =>
    request<any>('/settings/api-keys/generate', { method: 'POST', body: JSON.stringify({ type }) }),
  revokeApiKey: (keyId: string) =>
    request<any>(`/settings/api-keys/${keyId}`, { method: 'DELETE' }),
};

// ---- Team ----
export const team = {
  list: () => request<any[]>('/team'),
  invite: (data: { name: string; email: string; role: string; password: string }) =>
    request<any>('/team/invite', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: string, role: string) =>
    request<any>(`/team/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  remove: (id: string) =>
    request<any>(`/team/${id}`, { method: 'DELETE' }),
};

// ---- Calls (LiveKit + SIP) ----
export const calls = {
  initiate: (data: { phoneNumber: string; agentId: string; agentName: string; customerName?: string }) =>
    request<any>('/calls/initiate', { method: 'POST', body: JSON.stringify(data) }),
  terminate: (data: { roomName: string; participantIdentity: string }) =>
    request<any>('/calls/terminate', { method: 'POST', body: JSON.stringify(data) }),
  getActiveRooms: () => request<any[]>('/calls/rooms'),
  getToken: (data: { roomName: string; identity: string; name: string }) =>
    request<{ token: string; livekitUrl: string }>('/calls/token', { method: 'POST', body: JSON.stringify(data) }),
  getTrunks: () => request<any[]>('/calls/trunks'),
};

// ---- Logs ----
export const logs = {
  list: (params?: { status?: string; type?: string; agentName?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    if (params?.agentName) query.set('agentName', params.agentName);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<{ logs: any[]; pagination: any }>(`/logs${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/logs/${id}`),
  stats: (days = 7) => request<any>(`/logs/stats?days=${days}`),
};

// ---- Webhooks ----
export const webhooks = {
  test: () => request<any>('/webhooks/test', { method: 'POST' }),
};

// ---- Members ----
export interface Member {
  _id: string;
  name: string;
  rollNumber: string;
  year: string;
  degree: string;
  email: string;
  role: string;
  project?: string;
  hobbies?: string;
  certificate?: string;
  internship?: string;
  aboutYourAim?: string;
  image?: string;
  createdAt: string;
}

async function requestForm<T>(path: string, data: FormData): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: data });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export const members = {
  list: () => request<Member[]>('/members'),
  get: (id: string) => request<Member>(`/members/${id}`),
  create: (data: FormData) => requestForm<Member>('/members', data),
  delete: (id: string) => request<{ message: string }>(`/members/${id}`, { method: 'DELETE' }),
};

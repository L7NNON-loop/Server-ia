import { randomUUID } from 'node:crypto';

/**
 * Store com fallback local em memória e suporte opcional a Firebase RTDB via REST.
 * Se FIREBASE_DATABASE_URL existir, ele tenta usar REST (sem SDK externo).
 */
export class DataStore {
  constructor() {
    this.baseUrl = process.env.FIREBASE_DATABASE_URL || '';
    this.auth = process.env.FIREBASE_DATABASE_SECRET || '';
    this.memory = {
      services: {},
      logs: {},
      users: {},
      wallets: {}
    };
  }

  isRemoteEnabled() {
    return Boolean(this.baseUrl);
  }

  buildUrl(path) {
    const cleanBase = this.baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    const authQuery = this.auth ? `?auth=${encodeURIComponent(this.auth)}` : '';
    return `${cleanBase}/${cleanPath}.json${authQuery}`;
  }

  async set(path, data) {
    if (!this.isRemoteEnabled()) return this.localSet(path, data);
    const res = await fetch(this.buildUrl(path), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Firebase set falhou: ${res.status}`);
    return data;
  }

  async patch(path, data) {
    if (!this.isRemoteEnabled()) return this.localPatch(path, data);
    const res = await fetch(this.buildUrl(path), {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Firebase patch falhou: ${res.status}`);
    return data;
  }

  async get(path) {
    if (!this.isRemoteEnabled()) return this.localGet(path);
    const res = await fetch(this.buildUrl(path));
    if (!res.ok) throw new Error(`Firebase get falhou: ${res.status}`);
    return res.json();
  }

  async push(path, data) {
    if (!this.isRemoteEnabled()) {
      const id = randomUUID();
      await this.localSet(`${path}/${id}`, data);
      return { name: id };
    }
    const res = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Firebase push falhou: ${res.status}`);
    return res.json();
  }

  localGet(path) {
    const chunks = path.split('/').filter(Boolean);
    let curr = this.memory;
    for (const part of chunks) {
      if (curr == null || typeof curr !== 'object') return null;
      curr = curr[part];
    }
    return curr ?? null;
  }

  localSet(path, value) {
    const chunks = path.split('/').filter(Boolean);
    let curr = this.memory;
    for (let i = 0; i < chunks.length - 1; i += 1) {
      const key = chunks[i];
      if (!curr[key] || typeof curr[key] !== 'object') curr[key] = {};
      curr = curr[key];
    }
    curr[chunks[chunks.length - 1]] = value;
    return value;
  }

  localPatch(path, patch) {
    const current = this.localGet(path) || {};
    return this.localSet(path, { ...current, ...patch });
  }
}

export const store = new DataStore();

export async function addLog(entry) {
  const payload = { ...entry, createdAt: Date.now() };
  const created = await store.push('logs', payload);
  return { id: created.name, ...payload };
}

import { store } from './firebase.js';

export function nextCrashMultiplier(rng = Math.random) {
  const r = Math.max(0.000001, Math.min(0.999999, rng()));
  const houseEdge = 0.03;
  const result = (1 - houseEdge) / (1 - r);
  return Number(Math.max(1, result).toFixed(2));
}

export async function ensureUser(userId) {
  const user = (await store.get(`users/${userId}`)) || { id: userId, createdAt: Date.now() };
  const balance = (await store.get(`wallets/${userId}`)) ?? 0;
  await store.set(`users/${userId}`, user);
  await store.set(`wallets/${userId}`, balance);
  return { user, balance };
}

export async function registerBet(userId, amount) {
  if (!userId) throw new Error('userId obrigatório');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount inválido');

  await ensureUser(userId);
  const currentBalance = Number((await store.get(`wallets/${userId}`)) ?? 0);
  if (currentBalance < amount) throw new Error('Saldo insuficiente');

  const next = Number((currentBalance - amount).toFixed(2));
  await store.set(`wallets/${userId}`, next);
  return { userId, amount, status: 'accepted', balance: next };
}

export async function cashout(userId, amount, multiplier) {
  if (!Number.isFinite(multiplier) || multiplier < 1) throw new Error('multiplier inválido');
  await ensureUser(userId);

  const prize = Number((amount * multiplier).toFixed(2));
  const currentBalance = Number((await store.get(`wallets/${userId}`)) ?? 0);
  const next = Number((currentBalance + prize).toFixed(2));
  await store.set(`wallets/${userId}`, next);
  return { userId, amount, multiplier, prize, balance: next };
}

export async function getPlatformStats() {
  const users = (await store.get('users')) || {};
  const wallets = (await store.get('wallets')) || {};
  const activeUsers = Object.keys(users).length;
  const totalBalance = Object.values(wallets).reduce((sum, val) => sum + Number(val || 0), 0);
  return { activeUsers, totalBalance: Number(totalBalance.toFixed(2)) };
}

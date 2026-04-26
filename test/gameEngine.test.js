import test from 'node:test';
import assert from 'node:assert/strict';
import { nextCrashMultiplier, ensureUser, registerBet, cashout, getPlatformStats } from '../src/gameEngine.js';
import { store } from '../src/firebase.js';

test('nextCrashMultiplier returns number >= 1', () => {
  const val = nextCrashMultiplier(() => 0.5);
  assert.equal(typeof val, 'number');
  assert.ok(val >= 1);
});

test('bet/cashout flow updates balance and stats', async () => {
  await ensureUser('tester');
  await store.set('wallets/tester', 100);

  const bet = await registerBet('tester', 10);
  assert.equal(bet.status, 'accepted');
  assert.equal(bet.balance, 90);

  const result = await cashout('tester', 10, 2);
  assert.equal(result.prize, 20);
  assert.equal(result.balance, 110);

  const stats = await getPlatformStats();
  assert.ok(stats.activeUsers >= 1);
  assert.ok(stats.totalBalance >= 110);
});

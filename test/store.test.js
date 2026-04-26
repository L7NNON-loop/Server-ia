import test from 'node:test';
import assert from 'node:assert/strict';
import { DataStore } from '../src/firebase.js';

test('DataStore local set/get/patch works', async () => {
  const s = new DataStore();
  await s.set('services/a', { status: 'online' });
  assert.deepEqual(await s.get('services/a'), { status: 'online' });

  await s.patch('services/a', { status: 'offline' });
  assert.deepEqual(await s.get('services/a'), { status: 'offline' });
});

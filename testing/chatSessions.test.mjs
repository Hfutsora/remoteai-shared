import assert from 'node:assert/strict';
import test from 'node:test';
import { ChatSessionsFixture } from './chatSessions.mjs';

const socket = () => ({ readyState: 1, frames: [], send(data) { this.frames.push(JSON.parse(data)); },
  close(code) { this.readyState = 3; this.closeCode = code; } });
const identity = role => ({ role, ownerId: 'owner', deviceId: 'computer', expiresAt: 1000 });

test('pairs only the selected account, forwards signalling and relay, and closes departed sessions', () => {
  const sessions = new ChatSessionsFixture();
  const desktop = socket(); const mobile = socket(); const stranger = socket();
  sessions.join(desktop, identity('desktop'), { transportVersion: 1 });
  sessions.join(stranger, { ...identity('mobile'), ownerId: 'another-owner' }, {});
  assert.equal(stranger.closeCode, 4004);
  sessions.join(mobile, identity('mobile'), { publicKey: 'public-test-key' });
  const paired = mobile.frames.at(-1);
  assert.equal(paired.type, 'paired');
  assert.equal(desktop.frames.at(-1).publicKey, 'public-test-key');
  const signal = { type: 'signal', sessionId: paired.sessionId, payload: { kind: 'key' } };
  sessions.route(desktop, signal);
  assert.deepEqual(mobile.frames.at(-1), signal);
  assert.throws(() => sessions.route(stranger, signal), /Unknown fixture session/);
  const relay = { ...signal, type: 'relay', payload: 'opaque-encrypted-data' };
  assert.throws(() => sessions.route(mobile, relay), /Unsupported fixture frame/);
  sessions.route(mobile, { ...signal, type: 'relay-request' });
  assert.equal(desktop.frames.at(-1).type, 'relay-ready');
  sessions.route(mobile, relay);
  assert.deepEqual(desktop.frames.at(-1), relay);
  sessions.disconnect(mobile);
  assert.equal(desktop.frames.at(-1).type, 'peer-close');
  assert.throws(() => sessions.route(desktop, signal), /Unknown fixture session/);
});

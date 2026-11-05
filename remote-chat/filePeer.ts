import { HotPeer, type RecoverySignal } from './hotPeer';
import type { LinkOptions } from './linkOptions';
import type { BulkTransport } from './bulkTransport';
import type { Channel } from './protocol';

/** Independent ICE generations and keepalives ensure file recovery never replaces the chat peer. */
export class FilePeer {
  private readonly peer: HotPeer;
  private channel?: Channel;
  private lastPong = 0;
  private lastPing = 0;
  constructor(options: LinkOptions, bulk: BulkTransport) {
    this.peer = new HotPeer({ desktop: options.desktop, iceServers: options.iceServers,
      createPeer: options.createPeer,
      signal: signal => options.signal({ type: 'signal', sessionId: options.sessionId,
        payload: { ...signal, lane: 'file' } }),
      bulkChannel: channel => bulk.attach(channel),
      disconnected: () => { this.lastPong = 0; },
      channel: channel => {
        this.channel?.close(); this.channel = channel; this.lastPong = 0;
        channel.onMessage(text => {
          if (this.channel !== channel) return;
          try {
            if (text === 'ping') channel.send('pong');
            if (text === 'pong') this.lastPong = Date.now();
          } catch { channel.close(); }
        });
      },
    });
    if (!options.desktop) void this.peer.offer();
  }
  accept(signal: RecoverySignal) { return this.peer.accept(signal); }
  tick(signaling: boolean) {
    const now = Date.now();
    if (this.channel?.readyState === 'open' && now - this.lastPing >= 1000) {
      this.lastPing = now;
      try { this.channel.send('ping'); } catch { this.channel.close(); }
    }
    this.peer.recover(now - this.lastPong < 3000, signaling);
  }
  close() { this.peer.close(); this.channel?.close(); }
}

import { describe, expect, it } from 'vitest';
import { ProxyModelAvailabilityStore } from '@/modules/proxy-gateway/server/proxy-model-availability-store';

describe('ProxyModelAvailabilityStore', () => {
  it('clears only image capability failures when an account is manually refreshed', () => {
    const store = new ProxyModelAvailabilityStore();

    store.mark('acc-1', 'gemini-3-pro-image', 'model_not_supported');
    store.mark('acc-1', 'gemini-3-flash-image', 'model_forbidden');
    store.mark('acc-1', 'gemini-3-pro', 'quota_exhausted');
    store.clearCapabilityFailures('acc-1');

    expect(store.getSnapshot()).toEqual([
      expect.objectContaining({
        accountId: 'acc-1',
        modelId: 'gemini-3-pro',
        reason: 'quota_exhausted',
      }),
    ]);
  });
});

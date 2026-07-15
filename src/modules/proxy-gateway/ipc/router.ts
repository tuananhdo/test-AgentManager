/**
 * Gateway ORPC Router
 * Provides routes for controlling the API Gateway service
 */
import { os } from '@orpc/server';
import { z } from 'zod';
import { startGateway, stopGateway, getGatewayStatus, generateApiKey } from './handlers';
import { proxyModelAvailabilityStore } from '../server/proxy-model-availability-store';

export const gatewayRouter = os.prefix('/gateway').router({
  start: os
    .input(z.object({ port: z.number().int().min(1024).max(65535) }))
    .handler(async ({ input }) => {
      return startGateway(input.port);
    }),

  stop: os.handler(async () => {
    const success = await stopGateway();
    if (!success) {
      throw new Error('Failed to stop gateway');
    }
    return { success };
  }),

  status: os.handler(async () => {
    return getGatewayStatus();
  }),

  generateKey: os.handler(async () => {
    const newKey = await generateApiKey();
    return { api_key: newKey };
  }),

  modelAvailability: os
    .output(
      z.array(
        z.object({
          accountId: z.string(),
          modelId: z.string(),
          reason: z.enum([
            'model_not_supported',
            'model_forbidden',
            'quota_exhausted',
            'rate_limited',
          ]),
          unavailableUntil: z.number(),
        }),
      ),
    )
    .handler(async () => {
      return proxyModelAvailabilityStore.getSnapshot();
    }),
});

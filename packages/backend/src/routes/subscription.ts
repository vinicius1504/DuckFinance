import type { FastifyInstance } from 'fastify';
import { getSubscription, processWebhook, createSubscriptionCheckout } from '../services/subscription.service.js';

const ABACATE_WEBHOOK_SECRET = process.env.ABACATE_WEBHOOK_SECRET || '';

export default async function subscriptionRoutes(app: FastifyInstance) {
  // Get current user's subscription
  app.get('/subscription', { preHandler: [app.authenticate] }, async (request) => {
    return getSubscription(app, request.user.sub);
  });

  // Create checkout for subscription (redirect user to AbacatePay)
  app.post('/subscription/checkout', { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = await createSubscriptionCheckout(app, request.user.sub);
    if (!result.url) {
      return reply.status(400).send({ error: result.error || 'Failed to create checkout' });
    }
    return { url: result.url };
  });

  // AbacatePay webhook (public, validate by secret in query string)
  app.post('/subscription/webhook', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const secret = query.webhookSecret || '';

    if (ABACATE_WEBHOOK_SECRET && secret !== ABACATE_WEBHOOK_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as Record<string, unknown>;

    await processWebhook(app, {
      event: body.event as string,
      devMode: body.devMode as boolean,
      data: (body.data || body) as Record<string, unknown>,
    });

    return { received: true };
  });
}

import type { FastifyInstance } from 'fastify';
import { generateLinkCode, processIncoming, getQrCode, getConnectionState, restartInstance, logoutInstance } from '../services/whatsapp.service.js';

export default async function whatsappRoutes(app: FastifyInstance) {
  // Generate link code (authenticated)
  app.post('/whatsapp/link-code', { preHandler: [app.authenticate] }, async (request) => {
    const code = await generateLinkCode(app, request.user.sub);
    return { code };
  });

  // QR Code - get or create instance + generate QR
  app.get('/whatsapp/qrcode', { preHandler: [app.authenticate] }, async (request) => {
    return getQrCode(app, request.user.sub);
  });

  // Connection status
  app.get('/whatsapp/status', { preHandler: [app.authenticate] }, async (request) => {
    return getConnectionState(app, request.user.sub);
  });

  // Restart instance
  app.post('/whatsapp/restart', { preHandler: [app.authenticate] }, async (request) => {
    return restartInstance(app, request.user.sub);
  });

  // Logout / disconnect
  app.post('/whatsapp/logout', { preHandler: [app.authenticate] }, async (request) => {
    return logoutInstance(app, request.user.sub);
  });

  // Webhook from Evolution API (no JWT, validate by apikey header)
  app.post('/whatsapp/webhook', async (request, reply) => {
    const apiKey = (request.headers['apikey'] || request.headers['x-api-key']) as string;
    const expectedKey = process.env.EVOLUTION_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as Record<string, unknown>;

    // Evolution API sends different event types
    if (body.event === 'messages.upsert') {
      const data = body.data as Record<string, unknown>;
      const message = data?.message as Record<string, unknown>;
      const key = data?.key as Record<string, unknown>;
      const instanceName = (body.instance as string)
        || ((body as Record<string, unknown>).instance as Record<string, unknown>)?.instanceName as string
        || 'duckfinance';

      if (key && message) {
        const remoteJid = key.remoteJid as string;
        const textContent = (message.conversation as string)
          || (message.extendedTextMessage as Record<string, unknown>)?.text as string
          || '';

        processIncoming(app, instanceName, {
          remoteJid,
          body: textContent,
          participant: key.participant as string,
        }).catch((err) => app.log.error(err, 'WhatsApp processing error'));
      }
    }

    return { received: true };
  });
}

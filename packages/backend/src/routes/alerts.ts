import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as alertService from '../services/alert.service.js';

const createSchema = z.object({
  type: z.enum(['bill_due', 'budget_exceeded', 'low_balance', 'general']),
  title: z.string().min(1),
  message: z.string().min(1),
  referenceId: z.string().uuid().optional(),
  triggerDate: z.string(),
});

const filtersSchema = z.object({
  isRead: z.coerce.boolean().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export default async function alertRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/alerts', async (request) => {
    const filters = filtersSchema.parse(request.query);
    return alertService.getAlerts(app, request.user.sub, filters);
  });

  app.get('/alerts/unread-count', async (request) => {
    return alertService.getUnreadCount(app, request.user.sub);
  });

  app.post('/alerts', async (request, reply) => {
    const body = createSchema.parse(request.body);
    const alert = await alertService.createAlert(app, request.user.sub, body);
    return reply.status(201).send(alert);
  });

  app.put('/alerts/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string };
    const alert = await alertService.markAsRead(app, request.user.sub, id);
    if (!alert) return reply.status(404).send({ error: 'Alert not found' });
    return alert;
  });

  app.put('/alerts/read-all', async (request) => {
    return alertService.markAllAsRead(app, request.user.sub);
  });

  app.delete('/alerts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const alert = await alertService.deleteAlert(app, request.user.sub, id);
    if (!alert) return reply.status(404).send({ error: 'Alert not found' });
    return { success: true };
  });
}

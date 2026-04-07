import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as dashboardService from '../services/dashboard.service.js';

const statsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

const historySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional(),
});

export default async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/dashboard/stats', async (request) => {
    const { month, year } = statsSchema.parse(request.query);
    return dashboardService.getMonthlyStats(app, request.user.sub, month, year);
  });

  app.get('/dashboard/history', async (request) => {
    const { months } = historySchema.parse(request.query);
    return dashboardService.getMonthlyHistory(app, request.user.sub, months || 6);
  });
}

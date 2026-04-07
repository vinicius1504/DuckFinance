import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as reportService from '../services/report.service.js';

const periodSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  type: z.enum(['income', 'expense']).optional(),
});

export default async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/reports/category-breakdown', async (request) => {
    const { startDate, endDate, type } = periodSchema.parse(request.query);
    return reportService.getCategoryBreakdown(app, request.user.sub, startDate, endDate, type);
  });

  app.get('/reports/cash-flow', async (request) => {
    const { startDate, endDate } = periodSchema.parse(request.query);
    return reportService.getCashFlow(app, request.user.sub, startDate, endDate);
  });

  app.get('/reports/export-csv', async (request, reply) => {
    const { startDate, endDate } = periodSchema.parse(request.query);
    const csv = await reportService.exportCsv(app, request.user.sub, startDate, endDate);
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="transacoes_${startDate}_${endDate}.csv"`)
      .send(csv);
  });
}

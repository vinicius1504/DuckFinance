import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as budgetService from '../services/budget.service.js';

const createSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

const updateSchema = z.object({
  amount: z.number().positive(),
});

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export default async function budgetRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/budgets', async (request) => {
    const { month, year } = querySchema.parse(request.query);
    return budgetService.getBudgets(app, request.user.sub, month, year);
  });

  app.post('/budgets', async (request, reply) => {
    const body = createSchema.parse(request.body);
    const budget = await budgetService.createBudget(app, request.user.sub, body);
    return reply.status(201).send(budget);
  });

  app.put('/budgets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateSchema.parse(request.body);
    const budget = await budgetService.updateBudget(app, request.user.sub, id, body);
    if (!budget) return reply.status(404).send({ error: 'Budget not found' });
    return budget;
  });

  app.delete('/budgets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const budget = await budgetService.deleteBudget(app, request.user.sub, id);
    if (!budget) return reply.status(404).send({ error: 'Budget not found' });
    return { success: true };
  });

  app.post('/budgets/copy-previous', async (request) => {
    const body = querySchema.parse(request.body);
    return budgetService.copyBudgetsFromPreviousMonth(app, request.user.sub, body.month, body.year);
  });
}

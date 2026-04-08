import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as transactionService from '../services/transaction.service.js';

const createSchema = z.object({
  accountId: z.string().uuid(),
  toAccountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  creditCardId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string(),
  isPaid: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  notes: z.string().optional(),
}).refine(
  (d) => d.type !== 'transfer' || (!!d.toAccountId && d.toAccountId !== d.accountId),
  { message: 'Transferência requer toAccountId diferente de accountId', path: ['toAccountId'] },
);

const updateSchema = z.object({
  accountId: z.string().uuid().optional(),
  toAccountId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  creditCardId: z.string().uuid().nullable().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  isPaid: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

const filtersSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  creditCardId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPaid: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export default async function transactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/transactions', async (request) => {
    const filters = filtersSchema.parse(request.query);
    return transactionService.getTransactions(app, request.user.sub, filters);
  });

  app.post('/transactions', async (request, reply) => {
    const body = createSchema.parse(request.body);
    try {
      const transaction = await transactionService.createTransaction(app, request.user.sub, body);
      return reply.status(201).send(transaction);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.put('/transactions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateSchema.parse(request.body);
    try {
      const transaction = await transactionService.updateTransaction(app, request.user.sub, id, body);
      if (!transaction) return reply.status(404).send({ error: 'Transaction not found' });
      return transaction;
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.delete('/transactions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const transaction = await transactionService.deleteTransaction(app, request.user.sub, id);
    if (!transaction) return reply.status(404).send({ error: 'Transaction not found' });
    return { success: true };
  });
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import categoryRoutes from './routes/categories.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import alertRoutes from './routes/alerts.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import chatRoutes from './routes/chat.js';
import whatsappRoutes from './routes/whatsapp.js';
import subscriptionRoutes from './routes/subscription.js';
import { ZodError } from 'zod';

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Error handler for Zod validation
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation error',
        details: error.errors,
      });
    }
    app.log.error(error);
    const statusCode = (error as any).statusCode || 500;
    const message = (error as Error).message || 'Internal server error';
    return reply.status(statusCode).send({ error: message });
  });

  // Plugins
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  await app.register(dbPlugin);
  await app.register(authPlugin);

  // Routes
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(accountRoutes, { prefix: '/api' });
  await app.register(categoryRoutes, { prefix: '/api' });
  await app.register(transactionRoutes, { prefix: '/api' });
  await app.register(budgetRoutes, { prefix: '/api' });
  await app.register(alertRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.register(reportRoutes, { prefix: '/api' });
  await app.register(chatRoutes, { prefix: '/api' });
  await app.register(whatsappRoutes, { prefix: '/api' });
  await app.register(subscriptionRoutes, { prefix: '/api' });

  // Health check
  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { chat } from '../services/ai.service.js';
import * as chatService from '../services/chat.service.js';

const sendSchema = z.object({
  message: z.string().min(1).max(2000),
});

const historySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export default async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Send message and get AI response
  app.post('/chat', async (request) => {
    const { message } = sendSchema.parse(request.body);
    const reply = await chat(app, request.user.sub, message);
    return { reply };
  });

  // Get chat history
  app.get('/chat/history', async (request) => {
    const { limit } = historySchema.parse(request.query);
    return chatService.getHistory(app, request.user.sub, limit || 50);
  });

  // Clear chat history
  app.delete('/chat/history', async (request) => {
    await chatService.clearHistory(app, request.user.sub);
    return { success: true };
  });
}

import { eq, and } from 'drizzle-orm';
import { whatsappLinks, users } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';
import { chat } from './ai.service.js';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

/** Gera nome da instancia a partir do nome do usuario (slug) */
function toInstanceName(userName: string): string {
  return userName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

async function getUserName(app: FastifyInstance, userId: string): Promise<string> {
  const [user] = await app.db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  return user?.name || 'duckfinance';
}

/** Verifica se instancia existe na Evolution API */
async function instanceExists(instanceName: string): Promise<boolean> {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_API_KEY },
    });
    const data = await res.json() as Array<Record<string, unknown>>;
    return data.some((inst) => {
      const name = (inst.instance as Record<string, unknown>)?.instanceName || inst.name;
      return name === instanceName;
    });
  } catch {
    return false;
  }
}

/** Extrai base64 do QR de qualquer formato de resposta da Evolution API */
function extractQrBase64(data: Record<string, unknown>): string | null {
  // Direto: { base64: "data:image/..." }
  if (typeof data.base64 === 'string' && data.base64) return data.base64;
  // Nested: { qrcode: { base64: "..." } }
  const qr = data.qrcode as Record<string, unknown> | undefined;
  if (qr && typeof qr.base64 === 'string' && qr.base64) return qr.base64;
  // Nested: { qrcode: "data:image/..." }
  if (typeof data.qrcode === 'string' && data.qrcode.startsWith('data:')) return data.qrcode;
  // Some versions nest under data.instance
  const inst = data.instance as Record<string, unknown> | undefined;
  if (inst) return extractQrBase64(inst);
  return null;
}

/** Deleta instancia na Evolution API */
async function deleteInstance(instanceName: string): Promise<boolean> {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: EVOLUTION_API_KEY },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Cria instancia na Evolution API — retorna QR base64 se disponivel */
async function createInstance(instanceName: string): Promise<{ ok: boolean; qrcode: string | null }> {
  try {
    const webhookUrl = process.env.EVOLUTION_WEBHOOK_URL || 'http://host.docker.internal:3000/api/whatsapp/webhook';
    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        webhook: {
          url: webhookUrl,
          byEvents: false,
          base64: true,
          events: ['MESSAGES_UPSERT'],
        },
      }),
    });
    if (!res.ok) return { ok: false, qrcode: null };
    const data = await res.json() as Record<string, unknown>;
    console.log('[Evolution] create response:', JSON.stringify(data).slice(0, 500));
    return { ok: true, qrcode: extractQrBase64(data) };
  } catch {
    return { ok: false, qrcode: null };
  }
}

export async function getConnectionState(app: FastifyInstance, userId: string): Promise<{ connected: boolean; state: string; instanceName: string }> {
  const userName = await getUserName(app, userId);
  const instanceName = toInstanceName(userName);

  const exists = await instanceExists(instanceName);
  if (!exists) {
    return { connected: false, state: 'not_found', instanceName };
  }

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY },
    });
    const data = await res.json() as Record<string, unknown>;
    const instance = data.instance as Record<string, unknown> | undefined;
    const state = (instance?.state as string) || (data.state as string) || 'close';
    return { connected: state === 'open', state, instanceName };
  } catch {
    return { connected: false, state: 'error', instanceName };
  }
}

/** Tenta GET /instance/connect e extrair QR base64 */
async function tryConnect(instanceName: string): Promise<string | null> {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY },
    });
    const data = await res.json() as Record<string, unknown>;
    console.log('[Evolution] connect response:', JSON.stringify(data).slice(0, 300));
    return extractQrBase64(data);
  } catch {
    return null;
  }
}

export async function getQrCode(app: FastifyInstance, userId: string): Promise<{ qrcode: string | null; connected: boolean; state: string; instanceName: string }> {
  const userName = await getUserName(app, userId);
  const instanceName = toInstanceName(userName);

  const exists = await instanceExists(instanceName);

  // 1. Se nao existe, deleta restos e cria do zero
  if (!exists) {
    const result = await createInstance(instanceName);
    if (!result.ok) {
      return { qrcode: null, connected: false, state: 'error', instanceName };
    }
    if (result.qrcode) {
      return { qrcode: result.qrcode, connected: false, state: 'qrcode', instanceName };
    }
    // Baileys precisa de tempo pra inicializar o WebSocket — tentar connect com retry
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const qr = await tryConnect(instanceName);
      if (qr) return { qrcode: qr, connected: false, state: 'qrcode', instanceName };
    }
    return { qrcode: null, connected: false, state: 'waiting', instanceName };
  }

  // 2. Existe — verifica estado
  try {
    const stateRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY },
    });
    const stateData = await stateRes.json() as Record<string, unknown>;
    const inst = stateData.instance as Record<string, unknown> | undefined;
    const currentState = (inst?.state as string) || (stateData.state as string) || 'close';

    if (currentState === 'open') {
      return { qrcode: null, connected: true, state: 'open', instanceName };
    }
  } catch {
    // continue
  }

  // 3. Existe mas desconectada — tenta connect direto
  const qr = await tryConnect(instanceName);
  if (qr) {
    return { qrcode: qr, connected: false, state: 'qrcode', instanceName };
  }

  // 4. Connect retornou {"count":0} — instancia travada, deleta e recria
  console.log('[Evolution] instance stuck, deleting and recreating...');
  await deleteInstance(instanceName);
  await new Promise((r) => setTimeout(r, 2000));

  const result = await createInstance(instanceName);
  if (!result.ok) {
    return { qrcode: null, connected: false, state: 'error', instanceName };
  }
  if (result.qrcode) {
    return { qrcode: result.qrcode, connected: false, state: 'qrcode', instanceName };
  }

  // Retry connect com delay para Baileys inicializar
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const retryQr = await tryConnect(instanceName);
    if (retryQr) return { qrcode: retryQr, connected: false, state: 'qrcode', instanceName };
  }

  return { qrcode: null, connected: false, state: 'error', instanceName };
}

export async function restartInstance(app: FastifyInstance, userId: string): Promise<{ success: boolean }> {
  const userName = await getUserName(app, userId);
  const instanceName = toInstanceName(userName);
  try {
    await fetch(`${EVOLUTION_API_URL}/instance/restart/${instanceName}`, {
      method: 'PUT',
      headers: { apikey: EVOLUTION_API_KEY },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function logoutInstance(app: FastifyInstance, userId: string): Promise<{ success: boolean }> {
  const userName = await getUserName(app, userId);
  const instanceName = toInstanceName(userName);
  try {
    await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: EVOLUTION_API_KEY },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function generateLinkCode(app: FastifyInstance, userId: string): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Deactivate previous codes
  await app.db
    .update(whatsappLinks)
    .set({ isActive: false })
    .where(and(eq(whatsappLinks.userId, userId), eq(whatsappLinks.isActive, true)));

  // Create new code
  await app.db.insert(whatsappLinks).values({
    userId,
    linkCode: code,
    isActive: true,
  });

  return code;
}

export async function linkGroup(app: FastifyInstance, linkCode: string, groupId: string) {
  const [link] = await app.db
    .select()
    .from(whatsappLinks)
    .where(and(eq(whatsappLinks.linkCode, linkCode), eq(whatsappLinks.isActive, true)));

  if (!link) return null;

  const [updated] = await app.db
    .update(whatsappLinks)
    .set({ groupId })
    .where(eq(whatsappLinks.id, link.id))
    .returning();

  return updated;
}

export async function getUserByGroup(app: FastifyInstance, groupId: string) {
  const [link] = await app.db
    .select()
    .from(whatsappLinks)
    .where(and(eq(whatsappLinks.groupId, groupId), eq(whatsappLinks.isActive, true)));

  return link?.userId || null;
}

export async function sendMessage(instanceName: string, groupId: string, text: string) {
  try {
    await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: groupId,
        text,
      }),
    });
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err);
  }
}

export async function processIncoming(app: FastifyInstance, instanceName: string, message: {
  remoteJid: string;
  body: string;
  participant?: string;
}) {
  const { remoteJid, body } = message;
  if (!body) return;

  // Check for /duck prefix or @DuckBot mention
  const isDuckCommand = body.startsWith('/duck') || body.toLowerCase().includes('@duckbot');
  if (!isDuckCommand) return;

  // Handle link command: /duck vincular CODIGO
  const linkMatch = body.match(/\/duck\s+vincular\s+(\d{6})/i);
  if (linkMatch) {
    const code = linkMatch[1];
    const result = await linkGroup(app, code, remoteJid);
    if (result) {
      await sendMessage(instanceName, remoteJid, '✅ Grupo vinculado com sucesso! Agora voce pode me perguntar sobre suas financas.');
    } else {
      await sendMessage(instanceName, remoteJid, '❌ Codigo invalido ou expirado. Gere um novo codigo nas Configuracoes do DuckFinance.');
    }
    return;
  }

  // Find user by group
  const userId = await getUserByGroup(app, remoteJid);
  if (!userId) {
    await sendMessage(instanceName, remoteJid, '⚠️ Este grupo nao esta vinculado. Use /duck vincular CODIGO para vincular.');
    return;
  }

  // Extract the actual question (remove prefix)
  const question = body.replace(/^\/duck\s*/i, '').replace(/@duckbot\s*/i, '').trim();
  if (!question) {
    await sendMessage(instanceName, remoteJid, '🦆 Ola! Me pergunte algo sobre suas financas. Ex: "quanto gastei esse mes?"');
    return;
  }

  // Get AI response
  const reply = await chat(app, userId, question);
  await sendMessage(instanceName, remoteJid, reply);
}

import { eq } from 'drizzle-orm';
import { subscriptions, users } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

const ABACATE_API_URL = 'https://api.abacatepay.com/v1';
const ABACATE_API_KEY = process.env.ABACATE_API_KEY || '';

export interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriod: number;
  expiresAt: string | null;
  canceledAt: string | null;
}

export async function getSubscription(app: FastifyInstance, userId: string): Promise<SubscriptionInfo> {
  const [sub] = await app.db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub) {
    return { plan: 'free', status: 'active', currentPeriod: 0, expiresAt: null, canceledAt: null };
  }

  return {
    plan: sub.plan,
    status: sub.status,
    currentPeriod: sub.currentPeriod,
    expiresAt: sub.expiresAt?.toISOString() || null,
    canceledAt: sub.canceledAt?.toISOString() || null,
  };
}

/** Cria um customer no AbacatePay */
export async function createCustomer(name: string, email: string, taxId?: string) {
  const res = await fetch(`${ABACATE_API_URL}/customer/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ABACATE_API_KEY}`,
    },
    body: JSON.stringify({ name, email, taxId: taxId || '000.000.000-00', cellphone: '' }),
  });
  const data = await res.json() as { data?: { id: string }; error?: string };
  return data.data?.id || null;
}

/** Cria um checkout de assinatura no AbacatePay */
export async function createSubscriptionCheckout(app: FastifyInstance, userId: string): Promise<{ url: string | null; error?: string }> {
  const productId = process.env.ABACATE_PRODUCT_ID;
  if (!productId) return { url: null, error: 'ABACATE_PRODUCT_ID not configured' };

  // Get user info
  const [user] = await app.db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { url: null, error: 'User not found' };

  // Create or find customer
  const customerId = await createCustomer(user.name, user.email);

  try {
    const res = await fetch(`${ABACATE_API_URL}/billing/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ABACATE_API_KEY}`,
      },
      body: JSON.stringify({
        frequency: 'MONTHLY',
        methods: ['PIX'],
        products: [{ externalId: productId, quantity: 1 }],
        returnUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        completionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings`,
        ...(customerId ? { customerId } : { customer: { name: user.name, email: user.email } }),
      }),
    });
    const data = await res.json() as { data?: { url?: string; id?: string }; error?: string };
    return { url: data.data?.url || null, error: data.error || undefined };
  } catch {
    return { url: null, error: 'Failed to create checkout' };
  }
}

// ─── Webhook processing ─────────────────────────────────

interface AbacateWebhookPayload {
  event: string;
  devMode?: boolean;
  data: {
    id?: string;
    externalId?: string;
    amount?: number;
    paidAmount?: number;
    status?: string;
    customer?: {
      id?: string;
      email?: string;
    };
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  };
}

export async function processWebhook(app: FastifyInstance, payload: AbacateWebhookPayload): Promise<void> {
  const { event, data } = payload;
  const email = data.customer?.email;

  if (!email) {
    app.log.warn('AbacatePay webhook: no customer email');
    return;
  }

  // Find user by email
  const [user] = await app.db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    app.log.warn(`AbacatePay webhook: user not found for email ${email}`);
    return;
  }

  const userId = user.id;
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  switch (event) {
    case 'billing.paid':
    case 'subscription.created': {
      const [existing] = await app.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const subData = {
        plan: 'pro',
        status: 'active',
        providerOrderId: data.id,
        providerCustomerEmail: email,
        currentPeriod: existing ? existing.currentPeriod + 1 : 1,
        expiresAt,
        canceledAt: null,
        updatedAt: now,
      };

      if (existing) {
        await app.db.update(subscriptions).set(subData).where(eq(subscriptions.userId, userId));
      } else {
        await app.db.insert(subscriptions).values({ userId, ...subData });
      }
      app.log.info(`AbacatePay: activated pro for ${email}`);
      break;
    }

    case 'subscription.canceled': {
      await app.db
        .update(subscriptions)
        .set({ status: 'canceled', canceledAt: now, updatedAt: now })
        .where(eq(subscriptions.userId, userId));
      app.log.info(`AbacatePay: canceled subscription for ${email}`);
      break;
    }

    case 'billing.refunded': {
      await app.db
        .update(subscriptions)
        .set({ plan: 'free', status: 'revoked', canceledAt: now, updatedAt: now })
        .where(eq(subscriptions.userId, userId));
      app.log.info(`AbacatePay: revoked subscription for ${email}`);
      break;
    }

    case 'billing.failed': {
      await app.db
        .update(subscriptions)
        .set({ status: 'past_due', updatedAt: now })
        .where(eq(subscriptions.userId, userId));
      app.log.info(`AbacatePay: payment failed for ${email}`);
      break;
    }

    default:
      app.log.info(`AbacatePay webhook: unhandled event ${event}`);
  }
}

import Groq from 'groq-sdk';
import type { FastifyInstance } from 'fastify';
import { getAccounts, createAccount } from './account.service.js';
import { getMonthlyStats } from './dashboard.service.js';
import { getTransactions, createTransaction } from './transaction.service.js';
import { getBudgets, createBudget } from './budget.service.js';
import { getCategories, createCategory } from './category.service.js';
import { getHistory, saveMessage } from './chat.service.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/** Remove acentos e lowercase para comparacao fuzzy */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Distancia de Levenshtein entre duas strings */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

/** Busca o item com nome mais proximo. Tenta: exato normalizado → contem → menor Levenshtein */
function findBestMatch<T extends { name: string }>(items: T[], search: string): T | undefined {
  const norm = normalize(search);

  // 1. Match exato (sem acentos)
  const exact = items.find((item) => normalize(item.name) === norm);
  if (exact) return exact;

  // 2. Um contem o outro
  const partial = items.find(
    (item) => normalize(item.name).includes(norm) || norm.includes(normalize(item.name)),
  );
  if (partial) return partial;

  // 3. Menor distancia Levenshtein (max 40% da string)
  let best: T | undefined;
  let bestDist = Infinity;
  for (const item of items) {
    const dist = levenshtein(normalize(item.name), norm);
    if (dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }
  const maxDist = Math.ceil(norm.length * 0.4);
  return bestDist <= maxDist ? best : undefined;
}

const SYSTEM_PROMPT = `Voce e o DuckAI, assistente financeiro inteligente do DuckFinance.
Voce ajuda o usuario a entender e gerenciar suas financas pessoais com base nos dados reais do banco de dados dele.
Responda sempre em portugues brasileiro, de forma clara e objetiva.
Use emojis com moderacao para deixar a conversa mais amigavel.
Quando mostrar valores monetarios, use o formato R$ com duas casas decimais.
Se o usuario perguntar algo que voce nao tem dados para responder, diga que nao encontrou informacoes e sugira o que ele pode fazer.
Hoje e ${new Date().toLocaleDateString('pt-BR')}.

Voce pode REGISTRAR dados alem de consultar:
- Registrar transacoes (gastos e receitas) — use listCategories e getAccountsSummary para resolver nomes antes de criar.
- Criar contas bancarias.
- Criar orcamentos mensais.
- Criar categorias.
Apos criar algo, confirme ao usuario o que foi feito com os detalhes (valor, categoria, conta, etc).
Se o usuario nao especificar a conta, use a primeira conta disponivel.
Se o usuario nao especificar a data, use a data de hoje.`;

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getAccountsSummary',
      description: 'Retorna o saldo total e a lista de contas bancarias do usuario',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMonthlyStats',
      description: 'Retorna receita total, despesa total e gastos por categoria de um mes especifico',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number', description: 'Mes (1-12)' },
          year: { type: 'number', description: 'Ano (ex: 2026)' },
        },
        required: ['month', 'year'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getRecentTransactions',
      description: 'Retorna as transacoes mais recentes do usuario',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Quantidade de transacoes (padrao 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBudgetStatus',
      description: 'Retorna o status dos orcamentos do mes, incluindo quanto foi gasto e quanto resta',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number', description: 'Mes (1-12)' },
          year: { type: 'number', description: 'Ano (ex: 2026)' },
        },
        required: ['month', 'year'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listCategories',
      description: 'Retorna todas as categorias do usuario (id, nome, tipo). Use antes de criar transacao ou orcamento para resolver nomes em IDs.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createTransaction',
      description: 'Registra uma nova transacao (gasto ou receita) para o usuario',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Descricao da transacao' },
          amount: { type: 'number', description: 'Valor da transacao (positivo)' },
          type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo: income (receita) ou expense (despesa)' },
          categoryName: { type: 'string', description: 'Nome da categoria (opcional, resolve para ID automaticamente)' },
          accountName: { type: 'string', description: 'Nome da conta (opcional, usa a primeira conta se nao informado)' },
          date: { type: 'string', description: 'Data no formato YYYY-MM-DD (opcional, padrao hoje)' },
        },
        required: ['description', 'amount', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createAccount',
      description: 'Cria uma nova conta bancaria para o usuario',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome da conta (ex: Nubank, Itau)' },
          type: { type: 'string', enum: ['checking', 'savings', 'investment', 'other'], description: 'Tipo da conta' },
          balance: { type: 'number', description: 'Saldo inicial' },
          institution: { type: 'string', description: 'Instituicao financeira (opcional)' },
        },
        required: ['name', 'type', 'balance'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createBudget',
      description: 'Cria um orcamento mensal para uma categoria',
      parameters: {
        type: 'object',
        properties: {
          categoryName: { type: 'string', description: 'Nome da categoria' },
          amount: { type: 'number', description: 'Valor limite do orcamento' },
          month: { type: 'number', description: 'Mes (1-12), padrao mes atual' },
          year: { type: 'number', description: 'Ano, padrao ano atual' },
        },
        required: ['categoryName', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCategory',
      description: 'Cria uma nova categoria de transacao',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome da categoria' },
          type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo: income (receita) ou expense (despesa)' },
        },
        required: ['name', 'type'],
      },
    },
  },
];

async function executeToolCall(
  app: FastifyInstance,
  userId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  switch (name) {
    case 'getAccountsSummary': {
      const accs = await getAccounts(app, userId);
      const total = accs.reduce((sum, a) => sum + Number(a.balance), 0);
      return JSON.stringify({
        totalBalance: total,
        accounts: accs.map((a) => ({
          name: a.name,
          type: a.type,
          balance: Number(a.balance),
          institution: a.institution,
        })),
      });
    }
    case 'getMonthlyStats': {
      const month = (args.month as number) || currentMonth;
      const year = (args.year as number) || currentYear;
      const stats = await getMonthlyStats(app, userId, month, year);
      return JSON.stringify(stats);
    }
    case 'getRecentTransactions': {
      const limit = (args.limit as number) || 10;
      const result = await getTransactions(app, userId, { limit, page: 1 });
      return JSON.stringify(
        result.data.map((t) => ({
          description: t.description,
          amount: Number(t.amount),
          type: t.type,
          date: t.date,
          isPaid: t.isPaid,
        })),
      );
    }
    case 'getBudgetStatus': {
      const month = (args.month as number) || currentMonth;
      const year = (args.year as number) || currentYear;
      const budgets = await getBudgets(app, userId, month, year);
      return JSON.stringify(
        budgets.map((b) => ({
          category: b.categoryName,
          budgeted: b.budget.amount,
          spent: b.budget.spent,
          remaining: b.remaining,
          percentage: b.percentage,
        })),
      );
    }
    case 'listCategories': {
      const cats = await getCategories(app, userId);
      return JSON.stringify(
        cats.map((c) => ({ id: c.id, name: c.name, type: c.type })),
      );
    }
    case 'createTransaction': {
      const accs = await getAccounts(app, userId);
      let accountId: string;
      if (args.accountName) {
        const found = findBestMatch(accs, args.accountName as string);
        accountId = found ? found.id : accs[0]?.id;
      } else {
        accountId = accs[0]?.id;
      }
      if (!accountId) return JSON.stringify({ error: 'Nenhuma conta encontrada. Crie uma conta primeiro.' });

      let categoryId: string | undefined;
      if (args.categoryName) {
        const cats = await getCategories(app, userId);
        const found = findBestMatch(cats, args.categoryName as string);
        categoryId = found?.id;
      }

      const date = (args.date as string) || new Date().toISOString().split('T')[0];
      const tx = await createTransaction(app, userId, {
        accountId,
        categoryId,
        type: args.type as string,
        amount: args.amount as number,
        description: args.description as string,
        date,
        isPaid: true,
      });
      return JSON.stringify({ success: true, id: tx.id, description: tx.description, amount: Number(tx.amount), type: tx.type, date: tx.date });
    }
    case 'createAccount': {
      const acc = await createAccount(app, userId, {
        name: args.name as string,
        type: args.type as string,
        balance: args.balance as number,
        institution: args.institution as string | undefined,
      });
      return JSON.stringify({ success: true, id: acc.id, name: acc.name, type: acc.type, balance: Number(acc.balance) });
    }
    case 'createBudget': {
      const cats = await getCategories(app, userId);
      const found = findBestMatch(cats, args.categoryName as string);
      if (!found) return JSON.stringify({ error: `Categoria "${args.categoryName}" nao encontrada. Crie a categoria primeiro.` });

      const month = (args.month as number) || (now.getMonth() + 1);
      const year = (args.year as number) || now.getFullYear();
      const budget = await createBudget(app, userId, {
        categoryId: found.id,
        amount: args.amount as number,
        month,
        year,
      });
      return JSON.stringify({ success: true, id: budget.id, category: found.name, amount: Number(budget.amount), month, year });
    }
    case 'createCategory': {
      const cat = await createCategory(app, userId, {
        name: args.name as string,
        type: args.type as string,
      });
      return JSON.stringify({ success: true, id: cat.id, name: cat.name, type: cat.type });
    }
    default:
      return JSON.stringify({ error: 'Ferramenta desconhecida' });
  }
}

export async function chat(app: FastifyInstance, userId: string, userMessage: string): Promise<string> {
  // Save user message
  await saveMessage(app, userId, 'user', userMessage);

  // Load recent history for context
  const history = await getHistory(app, userId, 20);

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // First call — may request tool calls
  let response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    tools,
    tool_choice: 'auto',
    max_tokens: 1024,
  });

  let assistantMessage = response.choices[0]?.message;

  // Handle tool calls (up to 3 rounds)
  let rounds = 0;
  while (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0 && rounds < 3) {
    rounds++;
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const result = await executeToolCall(app, userId, toolCall.function.name, args);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1024,
    });

    assistantMessage = response.choices[0]?.message;
  }

  const reply = assistantMessage?.content || 'Desculpe, nao consegui processar sua mensagem.';

  // Save assistant reply
  await saveMessage(app, userId, 'assistant', reply);

  return reply;
}

import { api } from './client.js';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  PaginatedResponse,
  BudgetProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  Alert,
  CreateAlertRequest,
} from '@duckfinance/shared';

// Auth
export const authApi = {
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// Accounts
export const accountsApi = {
  list: () => api.get<Account[]>('/accounts').then((r) => r.data),
  get: (id: string) => api.get<Account>(`/accounts/${id}`).then((r) => r.data),
  create: (data: CreateAccountRequest) => api.post<Account>('/accounts', data).then((r) => r.data),
  update: (id: string, data: UpdateAccountRequest) => api.put<Account>(`/accounts/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/accounts/${id}`).then((r) => r.data),
};

// Categories
export const categoriesApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),
  get: (id: string) => api.get<Category>(`/categories/${id}`).then((r) => r.data),
  create: (data: CreateCategoryRequest) => api.post<Category>('/categories', data).then((r) => r.data),
  update: (id: string, data: UpdateCategoryRequest) => api.put<Category>(`/categories/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
};

// Transactions
export const transactionsApi = {
  list: (filters?: TransactionFilters) =>
    api.get<PaginatedResponse<Transaction>>('/transactions', { params: filters }).then((r) => r.data),
  create: (data: CreateTransactionRequest) => api.post<Transaction>('/transactions', data).then((r) => r.data),
  update: (id: string, data: UpdateTransactionRequest) =>
    api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/transactions/${id}`).then((r) => r.data),
};

// Budgets
export const budgetsApi = {
  list: (month: number, year: number) =>
    api.get<BudgetProgress[]>('/budgets', { params: { month, year } }).then((r) => r.data),
  create: (data: CreateBudgetRequest) => api.post('/budgets', data).then((r) => r.data),
  update: (id: string, data: UpdateBudgetRequest) => api.put(`/budgets/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/budgets/${id}`).then((r) => r.data),
  copyPrevious: (month: number, year: number) =>
    api.post('/budgets/copy-previous', { month, year }).then((r) => r.data),
};

// Alerts
export const alertsApi = {
  list: (filters?: { isRead?: boolean; type?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Alert>>('/alerts', { params: filters }).then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/alerts/unread-count').then((r) => r.data),
  create: (data: CreateAlertRequest) => api.post<Alert>('/alerts', data).then((r) => r.data),
  markAsRead: (id: string) => api.put<Alert>(`/alerts/${id}/read`).then((r) => r.data),
  markAllAsRead: () => api.put('/alerts/read-all').then((r) => r.data),
  delete: (id: string) => api.delete(`/alerts/${id}`).then((r) => r.data),
};

// Dashboard
export const dashboardApi = {
  stats: (month: number, year: number) =>
    api.get<{ totalIncome: number; totalExpense: number; spendingByCategory: { categoryName: string; categoryColor: string; total: number }[] }>(
      '/dashboard/stats', { params: { month, year } },
    ).then((r) => r.data),
  history: (months?: number) =>
    api.get<{ month: number; year: number; income: number; expense: number }[]>(
      '/dashboard/history', { params: { months } },
    ).then((r) => r.data),
};

// Chat (DuckAI)
export const chatApi = {
  send: (message: string) => api.post<{ reply: string }>('/chat', { message }).then((r) => r.data),
  history: (limit?: number) =>
    api.get<{ id: string; role: string; content: string; createdAt: string }[]>(
      '/chat/history', { params: { limit } },
    ).then((r) => r.data),
  clear: () => api.delete('/chat/history').then((r) => r.data),
};

// WhatsApp
export const whatsappApi = {
  generateLinkCode: () => api.post<{ code: string }>('/whatsapp/link-code').then((r) => r.data),
  qrcode: () => api.get<{ qrcode: string | null; connected: boolean; state: string; instanceName: string }>('/whatsapp/qrcode').then((r) => r.data),
  status: () => api.get<{ connected: boolean; state: string; instanceName: string }>('/whatsapp/status').then((r) => r.data),
  restart: () => api.post<{ success: boolean }>('/whatsapp/restart').then((r) => r.data),
  logout: () => api.post<{ success: boolean }>('/whatsapp/logout').then((r) => r.data),
};

// Subscription
export const subscriptionApi = {
  get: () => api.get<{ plan: string; status: string; currentPeriod: number; expiresAt: string | null; canceledAt: string | null }>('/subscription').then((r) => r.data),
  checkout: () => api.post<{ url: string }>('/subscription/checkout').then((r) => r.data),
};

// Reports
export const reportsApi = {
  categoryBreakdown: (startDate: string, endDate: string, type?: string) =>
    api.get<{ categoryId: string; categoryName: string; categoryColor: string; total: number; count: number }[]>(
      '/reports/category-breakdown', { params: { startDate, endDate, type } },
    ).then((r) => r.data),
  cashFlow: (startDate: string, endDate: string) =>
    api.get<{ date: string; income: number; expense: number }[]>(
      '/reports/cash-flow', { params: { startDate, endDate } },
    ).then((r) => r.data),
  exportCsv: (startDate: string, endDate: string) =>
    api.get('/reports/export-csv', { params: { startDate, endDate }, responseType: 'blob' }).then((r) => r.data),
};

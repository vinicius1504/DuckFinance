export interface CreditCard {
  id: string;
  userId: string;
  accountId: string | null;
  name: string;
  lastFourDigits: string;
  brand: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditCardRequest {
  accountId?: string;
  name: string;
  lastFourDigits: string;
  brand: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  color?: string;
}

export interface UpdateCreditCardRequest {
  accountId?: string | null;
  name?: string;
  lastFourDigits?: string;
  brand?: string;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
  color?: string;
  isActive?: boolean;
}

export interface CardInvoice {
  cardId: string;
  month: number;
  year: number;
  total: number;
  transactions: import('./transaction').Transaction[];
  isPaid: boolean;
  dueDate: string;
}

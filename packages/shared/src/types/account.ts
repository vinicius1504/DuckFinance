export type AccountType = 'checking' | 'savings' | 'investment' | 'cash' | 'other';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  institution: string | null;
  pluggyItemId: string | null;
  pluggyAccountId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
  institution?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: AccountType;
  balance?: number;
  color?: string;
  institution?: string;
  isActive?: boolean;
}

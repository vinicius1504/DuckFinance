export type AlertType = 'bill_due' | 'budget_exceeded' | 'low_balance' | 'general';

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  isRead: boolean;
  referenceId: string | null;
  triggerDate: string;
  createdAt: string;
}

export interface CreateAlertRequest {
  type: AlertType;
  title: string;
  message: string;
  referenceId?: string;
  triggerDate: string;
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../api/endpoints.js';

export function useAlerts(filters?: { isRead?: boolean; type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => alertsApi.list(filters),
  });
}

export function useUnreadAlertCount() {
  return useQuery({
    queryKey: ['alerts', 'unread-count'],
    queryFn: () => alertsApi.unreadCount(),
    refetchInterval: 30000,
  });
}

export function useMarkAlertAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useMarkAllAlertsAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => alertsApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

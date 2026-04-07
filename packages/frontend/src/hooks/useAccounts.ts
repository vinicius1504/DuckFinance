import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/endpoints.js';
import type { CreateAccountRequest, UpdateAccountRequest } from '@duckfinance/shared';

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
}

export function useAccount(id: string) {
  return useQuery({ queryKey: ['accounts', id], queryFn: () => accountsApi.get(id), enabled: !!id });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountRequest }) => accountsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

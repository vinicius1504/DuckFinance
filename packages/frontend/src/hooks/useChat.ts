import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/endpoints.js';

type ChatMessage = { id: string; role: string; content: string; createdAt: string };

export function useChatHistory() {
  return useQuery({
    queryKey: ['chat', 'history'],
    queryFn: () => chatApi.history(50),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => chatApi.send(message),
    onMutate: async (message) => {
      await qc.cancelQueries({ queryKey: ['chat', 'history'] });
      const previous = qc.getQueryData<ChatMessage[]>(['chat', 'history']);

      // Optimistically add user message
      qc.setQueryData<ChatMessage[]>(['chat', 'history'], (old = []) => [
        ...old,
        { id: `temp-${Date.now()}`, role: 'user', content: message, createdAt: new Date().toISOString() },
      ]);

      return { previous };
    },
    onSuccess: () => {
      // Refetch to get the real messages (user + assistant) from server
      qc.refetchQueries({ queryKey: ['chat', 'history'] });
    },
    onError: (_err, _msg, context) => {
      if (context?.previous) {
        qc.setQueryData(['chat', 'history'], context.previous);
      }
    },
  });
}

export function useClearChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.clear(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['chat', 'history'] });
      qc.setQueryData(['chat', 'history'], []);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'history'] });
    },
  });
}

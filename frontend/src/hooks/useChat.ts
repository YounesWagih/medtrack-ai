import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types/api';

export function useChatSessions() {
  const queryClient = useQueryClient();

  const {
    data: sessions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatService.listSessions(),
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: () => chatService.createSession(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      toast.success('New chat started');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create session');
    },
  });

  return {
    sessions,
    isLoading,
    refetch,
    createSession: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useChatMessages(sessionId: string) {
  const queryClient = useQueryClient();

  const {
    data: messages = [] as ChatMessage[],
    isLoading,
  } = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => chatService.getMessages(sessionId),
    enabled: !!sessionId,
    staleTime: 0, // always refetch on focus for chat
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send message');
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}

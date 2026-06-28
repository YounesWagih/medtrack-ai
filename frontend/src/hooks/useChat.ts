import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';

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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => chatService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  return {
    sessions,
    isLoading,
    refetch,
    createSession: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteSession: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useChatMessages(sessionId: string) {
  const queryClient = useQueryClient();

  const {
    data: sessionData,
    isLoading,
  } = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => chatService.getMessages(sessionId),
    enabled: !!sessionId,
    staleTime: 0, // always refetch on focus for chat
  });

  const messages = Array.isArray(sessionData) ? sessionData : sessionData?.messages || [];

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}

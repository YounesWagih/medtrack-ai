import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { ChatSessionList } from '@/components/chat/ChatSessionList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatSessions, useChatMessages } from '@/hooks/useChat';
import { chatService } from '@/services/chat.service';
import { toast } from 'sonner';
import type { ChatSession } from '@/types/api';

export function ChatPage() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const { sessions, createSession: createSessionMutation, deleteSession, isCreating, isDeleting } = useChatSessions();
  const [isSendingFirst, setIsSendingFirst] = useState(false);

  // Hook for active session messages (only fetches when activeSessionId exists)
  const { sendMessage: sendToActiveSession, isSending: isSendingActive } = useChatMessages(activeSessionId || '');

  const handleNewSession = () => {
    setActiveSessionId(undefined);
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(undefined);
      }
    } catch {
      toast.error('Failed to delete chat session');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (activeSessionId) {
      try {
        await sendToActiveSession(content);
      } catch (error: any) {
        toast.error(error.message || 'Failed to send message');
        throw error;
      }
    } else {
      setIsSendingFirst(true);
      try {
        // Use the mutation to create session - it auto-invalidates the sessions list
        const newSession = await createSessionMutation();
        setActiveSessionId(newSession.id);
        // Send the first message using the service directly
        await chatService.sendMessage(newSession.id, content);
        // Invalidate messages for the new session so UI updates
        await queryClient.invalidateQueries({ queryKey: ['chat-messages', newSession.id] });
      } catch (error: any) {
        toast.error(error.message || 'Failed to send message');
        throw error;
      } finally {
        setIsSendingFirst(false);
      }
    }
  };

  const isLoading = isCreating || isDeleting || isSendingFirst || isSendingActive;

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex gap-4 p-6">
        <div className="w-[280px] flex-shrink-0">
          <ChatSessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="h-full bg-gradient-to-br from-white via-white to-blue-50/30 rounded-2xl shadow-xl border border-white/50 backdrop-blur-sm overflow-hidden">
            <ChatWindow
              sessionId={activeSessionId}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
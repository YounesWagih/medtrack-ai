import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ChatSessionList } from '@/components/chat/ChatSessionList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatSessions } from '@/hooks/useChat';
import { toast } from 'sonner';
import type { ChatSession } from '@/types/api';

export function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const { sessions, createSession, isCreating } = useChatSessions();

  const handleNewSession = async () => {
    try {
      const newSession = await createSession();
      setActiveSessionId(newSession.id);
      toast.success('New chat started');
    } catch {
      toast.error('Failed to create chat session');
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex border border-border rounded-[12px] overflow-hidden bg-surface">
        <ChatSessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
        />

        <div className="flex-1">
          <ChatWindow
            sessionId={activeSessionId}
            isLoading={isCreating}
          />
        </div>
      </div>
    </Layout>
  );
}
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

  const handleSendMessage = async (content: string) => {
    // This will be handled by ChatWindow's internal hook, but we could add extra logic here
    return;
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex border rounded-lg overflow-hidden">
        {/* Sessions sidebar */}
        <div className="w-64 hidden md:block">
          <ChatSessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        </div>

        {/* Main chat window */}
        <div className="flex-1">
          <ChatWindow
            sessionId={activeSessionId}
            onSendMessage={handleSendMessage}
            isLoading={isCreating}
          />
        </div>
      </div>
    </Layout>
  );
}

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ChatSessionList } from '@/components/chat/ChatSessionList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatSessions, useChatMessages } from '@/hooks/useChat';
import { chatService } from '@/services/chat.service';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { MessageSquareText } from 'lucide-react';

export function ChatPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSessionId = searchParams.get('session') || undefined;
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const { sessions, createSession: createSessionMutation, deleteSession, isCreating, isDeleting } = useChatSessions();
  const [isSendingFirst, setIsSendingFirst] = useState(false);

  // Hook for active session messages (only fetches when activeSessionId exists)
  const { sendMessage: sendToActiveSession, isSending: isSendingActive } = useChatMessages(activeSessionId || '');

  const handleNewSession = () => {
    setSearchParams((params) => {
      const nextParams = new URLSearchParams(params);
      nextParams.delete('session');
      return nextParams;
    });
    setIsSessionsOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    setSearchParams((params) => {
      const nextParams = new URLSearchParams(params);
      nextParams.set('session', sessionId);
      return nextParams;
    });
    setIsSessionsOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      if (activeSessionId === sessionId) {
        setSearchParams((params) => {
          const nextParams = new URLSearchParams(params);
          nextParams.delete('session');
          return nextParams;
        });
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete chat session'));
    }
  };

  const handleSendMessage = async (content: string) => {
    if (activeSessionId) {
      try {
        await sendToActiveSession(content);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'Failed to send message'));
        throw error;
      }
    } else {
      setIsSendingFirst(true);
      try {
        // Use the mutation to create session - it auto-invalidates the sessions list
        const newSession = await createSessionMutation();
        setSearchParams((params) => {
          const nextParams = new URLSearchParams(params);
          nextParams.set('session', newSession.id);
          return nextParams;
        });
        // Send the first message using the service directly
        await chatService.sendMessage(newSession.id, content);
        // Invalidate messages for the new session so UI updates
        await queryClient.invalidateQueries({ queryKey: ['chat-messages', newSession.id] });
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'Failed to send message'));
        throw error;
      } finally {
        setIsSendingFirst(false);
      }
    }
  };

  const isLoading = isCreating || isDeleting || isSendingFirst || isSendingActive;

  return (
    <Layout>
      <div className="h-[calc(100vh-7rem)] flex flex-col gap-3 lg:flex-row lg:gap-4">
        <div className="flex items-center justify-end lg:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSessionsOpen(true)}
            aria-label="Open chat sessions"
          >
            <MessageSquareText className="h-4 w-4" />
            Chats
          </Button>
        </div>

        <Sheet open={isSessionsOpen} onOpenChange={setIsSessionsOpen}>
          <SheetContent className="left-auto right-0 w-[320px] max-w-[88vw] border-l border-r-0 p-0">
            <SheetTitle className="sr-only">Chat sessions</SheetTitle>
            <ChatSessionList
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
              layout="sidebar"
            />
          </SheetContent>
        </Sheet>

        <div className="hidden w-full lg:block lg:w-[280px] lg:flex-shrink-0 lg:h-full">
          <ChatSessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
          />
        </div>

        <div className="flex-1 min-w-0 min-h-0">
          <div className="h-full bg-surface rounded-xl shadow-soft border border-border overflow-hidden">
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

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatMessages } from '@/hooks/useChat';
import type { ChatMessage as ChatMessageType } from '@/types/api';
import { ChatMessageRole } from '@/types/api';

interface ChatWindowProps {
  sessionId?: string;
  onSendMessage?: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export function ChatWindow({ sessionId, onSendMessage, isLoading = false }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages: sessionData, sendMessage, isSending } = useChatMessages(sessionId || '');
  const messages = Array.isArray(sessionData) ? sessionData : sessionData?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content: string) => {
    if (onSendMessage) {
      await onSendMessage(content);
    } else if (sessionId) {
      await sendMessage(content);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500 p-8 text-center">
        <div className="space-y-2">
          <p className="text-lg font-medium">Select a chat session or start a new one</p>
          <p className="text-sm">Messages will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg: ChatMessageType) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isSending && (
            <ChatMessage
              message={{
                id: 'streaming',
                sessionId,
                role: ChatMessageRole.ASSISTANT,
                content: '',
                createdAt: new Date().toISOString(),
              }}
              isStreaming
            />
          )}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isSending || isLoading} />
    </div>
  );
}

import { useRef, useEffect, useState } from 'react';
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
  const { messages, sendMessage } = useChatMessages(sessionId || '');
  const [pendingInfo, setPendingInfo] = useState<{ content: string; time: number } | null>(null);
  const prevMsgCountRef = useRef(0);

  // Update prev count and clear pending if user message acknowledged
  useEffect(() => {
    if (!pendingInfo) {
      prevMsgCountRef.current = messages.length;
      return;
    }

    const previousCount = prevMsgCountRef.current;
    const newCount = messages.length;

    if (newCount > previousCount) {
      const newMessages = messages.slice(previousCount);
      const hasAck = newMessages.some(
        (m: ChatMessageType) =>
          m.role === ChatMessageRole.USER &&
          m.content === pendingInfo.content
      );
      if (hasAck) {
        setPendingInfo(null);
      }
    }

    // Update ref for next comparison
    prevMsgCountRef.current = newCount;
  }, [messages, pendingInfo]);

  // Reset pending if session changes
  useEffect(() => {
    setPendingInfo(null);
  }, [sessionId]);

  const handleSend = async (content: string) => {
    setPendingInfo({ content, time: Date.now() });
    try {
      if (onSendMessage) {
        await onSendMessage(content);
      } else if (sessionId) {
        await sendMessage(content);
      }
    } catch (err) {
      setPendingInfo(null);
      throw err;
    }
  };

  // Determine if we should show the pending user message
  // Hide if new server messages include the user's message (optimistic ack)
  const showPending = (() => {
    if (!pendingInfo) return false;
    const previousCount = prevMsgCountRef.current;
    if (messages.length > previousCount) {
      const newMessages = messages.slice(previousCount);
      const hasAck = newMessages.some(
        (m: ChatMessageType) =>
          m.role === ChatMessageRole.USER &&
          m.content === pendingInfo.content
      );
      if (hasAck) return false;
    }
    return true;
  })();

  // Build the list of messages to render: server messages + pending (if any)
  const allMessages = showPending && pendingInfo
    ? [
        ...messages,
        {
          id: 'pending-user',
          sessionId: sessionId || '',
          role: ChatMessageRole.USER,
          content: pendingInfo.content,
          createdAt: new Date().toISOString(),
        } as ChatMessageType,
      ]
    : messages;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {!sessionId ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-center">
              <div className="space-y-2">
                <p className="text-lg font-medium">Start a new conversation</p>
                <p className="text-sm">Type your message below to begin</p>
              </div>
            </div>
          ) : (
            <>
              {allMessages.map((msg: ChatMessageType) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {sessionId && isLoading && (
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
            </>
          )}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

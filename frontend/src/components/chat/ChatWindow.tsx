import { useRef, useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatMessages } from '@/hooks/useChat';
import { useMedicines } from '@/hooks/useMedicines';
import type { ChatMessage as ChatMessageType } from '@/types/api';
import { ChatMessageRole } from '@/types/api';
import { Clock, Info, Lightbulb, MessageSquare, Pill } from 'lucide-react';

interface ChatWindowProps {
  sessionId?: string;
  onSendMessage?: (content: string) => Promise<void>;
  isLoading?: boolean;
}

const starterPrompts = [
  {
    icon: Pill,
    label: 'Medicine Info',
    prompt: 'هل عندي دواء للكحة؟',
  },
  {
    icon: Clock,
    label: 'Expiry Check',
    prompt: 'ما هي أدويتي المنتهية الصلاحية؟',
  },
  {
    icon: Info,
    label: 'Medicine Details',
    prompt: 'أخبرني عن دواء الأسبرين',
  },
];

export function ChatWindow({ sessionId, onSendMessage, isLoading = false }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage } = useChatMessages(sessionId || '');
  const { medicines } = useMedicines({ limit: 100 });
  const [pendingInfo, setPendingInfo] = useState<{ content: string; time: number } | null>(null);
  const prevMsgCountRef = useRef(0);

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
        (message: ChatMessageType) =>
          message.role === ChatMessageRole.USER &&
          message.content === pendingInfo.content
      );
      if (hasAck) {
        setPendingInfo(null);
      }
    }

    prevMsgCountRef.current = newCount;
  }, [messages, pendingInfo]);

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

  const showPending = (() => {
    if (!pendingInfo) return false;
    const previousCount = prevMsgCountRef.current;
    if (messages.length > previousCount) {
      const newMessages = messages.slice(previousCount);
      const hasAck = newMessages.some(
        (message: ChatMessageType) =>
          message.role === ChatMessageRole.USER &&
          message.content === pendingInfo.content
      );
      if (hasAck) return false;
    }
    return true;
  })();

  const allMessages = useMemo(() => {
    if (!showPending || !pendingInfo) return messages;

    return [
      ...messages,
      {
        id: 'pending-user',
        sessionId: sessionId || '',
        role: ChatMessageRole.USER,
        content: pendingInfo.content,
        createdAt: new Date().toISOString(),
      } as ChatMessageType,
    ];
  }, [messages, pendingInfo, sessionId, showPending]);

  useEffect(() => {
    const scrollArea = scrollRef.current;
    if (scrollArea) {
      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [allMessages]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="min-h-full">
          {!sessionId ? (
            <div className="flex items-center justify-center min-h-full px-6 py-6">
              <div className="text-center space-y-4 max-w-2xl">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-soft">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-textPrimary">Welcome to your AI Assistant</h2>
                  <p className="text-sm text-textSecondary leading-relaxed">
                    Start a conversation to get help with medicine recommendations, health advice, and more.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">Medicine Info</span>
                  <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">Health Tips</span>
                  <span className="px-2 py-1 bg-muted text-textSecondary rounded-full text-xs font-medium">Recommendations</span>
                </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                      <Lightbulb className="h-3 w-3" />
                      Try asking:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {starterPrompts.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.prompt}
                          onClick={() => handleSend(item.prompt)}
                          className="group p-4 bg-surface border border-border rounded-xl text-right text-textPrimary hover:border-primary/30 hover:shadow-md transition-all duration-200 text-sm font-medium"
                          dir="rtl"
                          type="button"
                        >
                          <div className="flex items-center justify-between mb-2" dir="ltr">
                            <span className="text-xs text-textSecondary">{item.label}</span>
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="block leading-relaxed">{item.prompt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {allMessages.map((message: ChatMessageType) => (
                <ChatMessage key={message.id} message={message} medicines={medicines} />
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
                  medicines={medicines}
                  isStreaming
                />
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

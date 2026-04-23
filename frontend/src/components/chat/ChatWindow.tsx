import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatMessages } from '@/hooks/useChat';
import type { ChatMessage as ChatMessageType } from '@/types/api';
import { ChatMessageRole } from '@/types/api';
import { MessageSquare } from 'lucide-react';

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

  // Auto-scroll to bottom when new messages arrive
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
            <div className="flex items-center justify-center min-h-full px-8 py-6">
              <div className="text-center space-y-4 max-w-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-800">Welcome to your AI Assistant</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">Start a conversation to get help with medicine recommendations, health advice, and more.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Medicine Info</span>
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">Health Tips</span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">Recommendations</span>
                </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                      💡 Try asking:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                    <button
                      onClick={() => handleSend("هل عندي دواء للكحة")}
                      className="group relative p-4 bg-gradient-to-r from-white to-blue-50/30 border border-blue-100 rounded-xl text-right text-gray-700 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 hover:shadow-lg transition-all duration-300 text-sm font-medium shadow-md transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
                          💊
                        </span>
                      </div>
                      <span className="block leading-relaxed">هل عندي دواء للكحة</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-indigo-400/0 group-hover:from-blue-400/5 group-hover:to-indigo-400/5 rounded-xl transition-all duration-300" />
                    </button>
                    <button
                      onClick={() => handleSend("ما هي أدويتي المنتهية الصلاحية")}
                      className="group relative p-4 bg-gradient-to-r from-white to-green-50/30 border border-green-100 rounded-xl text-right text-gray-700 hover:from-green-50 hover:to-emerald-50 hover:border-green-200 hover:shadow-lg transition-all duration-300 text-sm font-medium shadow-md transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 group-hover:text-green-600 transition-colors duration-200">
                          ⏰
                        </span>
                      </div>
                      <span className="block leading-relaxed">ما هي أدويتي المنتهية الصلاحية</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 to-emerald-400/0 group-hover:from-green-400/5 group-hover:to-emerald-400/5 rounded-xl transition-all duration-300" />
                    </button>
                    <button
                      onClick={() => handleSend("أخبرني عن دواء الأسبرين")}
                      className="group relative p-4 bg-gradient-to-r from-white to-purple-50/30 border border-purple-100 rounded-xl text-right text-gray-700 hover:from-purple-50 hover:to-violet-50 hover:border-purple-200 hover:shadow-lg transition-all duration-300 text-sm font-medium shadow-md transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 group-hover:text-purple-600 transition-colors duration-200">
                          ℹ️
                        </span>
                      </div>
                      <span className="block leading-relaxed">أخبرني عن دواء الأسبرين</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 to-violet-400/0 group-hover:from-purple-400/5 group-hover:to-violet-400/5 rounded-xl transition-all duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
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
            </div>
          )}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

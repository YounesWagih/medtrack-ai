import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType, ChatResponseData, ChatRecommendationMedicine } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  responseData?: ChatResponseData;
}

export function ChatMessage({ message, isStreaming = false, responseData }: ChatMessageProps) {
  const isUser = message.role === 'USER';

  const renderRecommendations = (medicines: ChatRecommendationMedicine[]) => {
    return (
      <div className="space-y-3 mt-2">
        {medicines.map((med, idx) => (
          <Card key={idx} className="bg-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-textPrimary">{med.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm space-y-1">
              <p><span className="font-medium">Dosage:</span> {med.dosage}</p>
              <p><span className="font-medium">Frequency:</span> {med.frequency}</p>
              <p><span className="font-medium">Recommendation:</span> {med.recommendation}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex gap-4 animate-fade-in-up',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
        </div>
      )}

      <div className={cn('max-w-[75%] space-y-2', isUser && 'order-1')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 shadow-sm relative',
          isUser
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-12'
            : 'bg-white text-gray-800 border border-gray-100 mr-12 shadow-md'
        )}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1 align-middle rounded-full" />
            )}
          </p>

          {/* Message tail */}
          <div className={cn(
            'absolute top-3 w-3 h-3 rotate-45',
            isUser
              ? 'right-[-6px] bg-gradient-to-r from-blue-600 to-indigo-600'
              : 'left-[-6px] bg-white border-l border-t border-gray-100'
          )} />
        </div>

        {!isUser && responseData?.type === 'recommendation' && responseData.medicines && (
          <div className="animate-fade-in-up">
            {renderRecommendations(responseData.medicines)}
          </div>
        )}

        <span className={cn(
          'text-xs text-gray-500 block px-1',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="flex-shrink-0 order-2">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-lg">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
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
        'flex gap-3 py-4 px-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-muted text-textPrimary">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn('max-w-[70%]', isUser && 'order-1')}>
        <div className={cn(
          'rounded-[12px] px-4 py-2',
          isUser 
            ? 'bg-primary text-white' 
            : 'bg-muted text-textPrimary'
        )}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
            )}
          </p>
        </div>
        
        {!isUser && responseData?.type === 'recommendation' && responseData.medicines && (
          renderRecommendations(responseData.medicines)
        )}
        
        <span className={cn(
          'text-xs text-textSecondary mt-1 block',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-primary text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
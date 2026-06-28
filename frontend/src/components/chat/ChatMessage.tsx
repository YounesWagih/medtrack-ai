import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChatMessage as ChatMessageType, ChatResponseData, ChatRecommendationMedicine, Medicine } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  responseData?: ChatResponseData;
  medicines?: Medicine[];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderLinkedContent(content: string, medicines: Medicine[]) {
  const linkableMedicines = medicines
    .filter((medicine) => medicine.name.trim().length > 0)
    .sort((a, b) => b.name.length - a.name.length);

  if (linkableMedicines.length === 0) {
    return content;
  }

  const medicinePattern = new RegExp(
    `(${linkableMedicines.map((medicine) => escapeRegExp(medicine.name)).join('|')})`,
    'gi'
  );

  return content.split(medicinePattern).map((part, index) => {
    const matchedMedicine = linkableMedicines.find(
      (medicine) => medicine.name.toLowerCase() === part.toLowerCase()
    );

    if (!matchedMedicine) {
      return part;
    }

    return (
      <Link
        key={`${matchedMedicine.id}-${index}`}
        to={`/medicines/view/${matchedMedicine.id}`}
        className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {part}
      </Link>
    );
  });
}

export function ChatMessage({ message, isStreaming = false, responseData, medicines = [] }: ChatMessageProps) {
  const isUser = message.role === 'USER';
  const content = !isUser ? renderLinkedContent(message.content, medicines) : message.content;

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
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-soft">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      )}

      <div className={cn('max-w-[75%] space-y-2', isUser && 'order-1')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 shadow-sm relative',
          isUser
            ? 'bg-primary text-primary-foreground ml-12'
            : 'bg-surface text-textPrimary border border-border mr-12 shadow-soft'
        )}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1 align-middle rounded-full" />
            )}
          </p>

          {/* Message tail */}
          <div className={cn(
            'absolute top-3 w-3 h-3 rotate-45',
            isUser
              ? 'right-[-6px] bg-primary'
              : 'left-[-6px] bg-surface border-l border-t border-border'
          )} />
        </div>

        {!isUser && responseData?.type === 'recommendation' && responseData.medicines && (
          <div className="animate-fade-in-up">
            {renderRecommendations(responseData.medicines)}
          </div>
        )}

        <span className={cn(
          'text-xs text-muted-foreground block px-1',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="flex-shrink-0 order-2">
          <div className="w-10 h-10 bg-textPrimary rounded-full flex items-center justify-center shadow-soft">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

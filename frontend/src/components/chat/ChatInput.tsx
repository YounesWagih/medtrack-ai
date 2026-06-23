import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = 'Type your message...' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSend(message.trim());
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 p-4 sm:p-6 bg-surface border-t border-border">
      <div className="flex-1 relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          className="min-h-[52px] max-h-[160px] resize-none border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 pr-32 text-sm transition-all duration-200 bg-surface shadow-sm"
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          Press Enter to send
        </div>
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || disabled || isSubmitting}
        className="h-12 w-12 shadow-soft transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:transform-none rounded-xl"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
}

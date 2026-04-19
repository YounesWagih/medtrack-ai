import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MessageSquare, Plus } from 'lucide-react';
import type { ChatSession } from '@/types/api';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
}: ChatSessionListProps) {
  return (
    <div className="w-full h-full flex flex-col border-r bg-gray-50">
      <div className="p-4">
        <Button onClick={onNewSession} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate',
                activeSessionId === session.id
                  ? 'bg-secondary font-medium'
                  : 'hover:bg-secondary/50'
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1">
                  Session {new Date(session.createdAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

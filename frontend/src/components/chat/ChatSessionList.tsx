import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MessageSquare, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import type { ChatSession } from '@/types/api';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatSessionListProps) {
  return (
    <div className="w-[260px] h-full flex flex-col border-r bg-background">
      <div className="p-4 border-b border-border">
        <Button onClick={onNewSession} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {sessions.length === 0 ? (
            <p className="text-sm text-textSecondary text-center py-4">No conversations yet</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-[10px] text-sm transition-colors truncate group relative',
                   activeSessionId === session.id
                     ? 'bg-primary/10 text-primary font-medium'
                     : 'hover:bg-muted text-textPrimary'
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-1">
                    Session {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  {onDeleteSession && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="ml-auto p-1 rounded-sm hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
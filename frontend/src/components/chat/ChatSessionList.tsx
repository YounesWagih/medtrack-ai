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
    <div className="h-full bg-surface rounded-xl shadow-soft border border-border overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border bg-primary/5 flex-shrink-0">
        <Button
          onClick={onNewSession}
          className="w-full shadow-soft transition-all duration-200 hover:scale-[1.02]"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0 chat-sessions-scrollbar">
        <div className="p-3 space-y-2 min-h-full">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-textSecondary font-medium">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start your first chat above</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'w-full text-left p-4 rounded-xl text-sm transition-all duration-300 group relative transform hover:scale-[1.01] cursor-pointer',
                  activeSessionId === session.id
                    ? 'bg-primary text-primary-foreground shadow-soft scale-[1.02]'
                    : 'hover:bg-primary/5 text-textPrimary hover:shadow-md border border-transparent hover:border-border'
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors duration-300",
                    activeSessionId === session.id
                      ? "bg-white/20"
                      : "bg-muted group-hover:bg-primary/10"
                  )}>
                    <MessageSquare className={cn(
                      "h-4 w-4 flex-shrink-0",
                      activeSessionId === session.id ? "text-white" : "text-textSecondary group-hover:text-primary"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="truncate block font-medium">
                      Chat {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span className={cn(
                      "text-xs block truncate",
                      activeSessionId === session.id ? "text-white/80" : "text-muted-foreground"
                    )}>
                      {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {onDeleteSession && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "p-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100",
                            activeSessionId === session.id
                              ? "hover:bg-white/20 text-white"
                              : "hover:bg-danger/10 text-muted-foreground hover:text-danger"
                          )}
                          aria-label="Open chat actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-danger hover:bg-danger/10 focus:bg-danger/10 hover:text-danger focus:text-danger transition-colors duration-200"
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
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

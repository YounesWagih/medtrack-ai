import { Button } from '@/components/ui/button';
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
  layout?: 'responsive' | 'sidebar';
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  layout = 'responsive',
}: ChatSessionListProps) {
  const isSidebar = layout === 'sidebar';

  return (
    <div className={cn(
      'h-full bg-surface overflow-hidden flex',
      isSidebar
        ? 'flex-col rounded-none border-0 shadow-none'
        : 'rounded-xl shadow-soft border border-border lg:min-h-0 lg:flex-col'
    )}>
      <div className={cn(
        'flex-shrink-0 bg-surface p-3',
        isSidebar
          ? 'border-b border-border pr-12'
          : 'flex items-center border-r border-border lg:block lg:border-r-0 lg:border-b lg:p-4'
      )}>
        <Button
          onClick={onNewSession}
          className={cn(
            'shadow-soft transition-all duration-200 hover:scale-[1.01]',
            isSidebar ? 'h-10 w-full' : 'h-14 px-4 lg:h-10 lg:w-full'
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className={cn(
        'min-h-0 flex-1',
        isSidebar
          ? 'overflow-y-auto chat-sessions-scrollbar'
          : 'chat-sessions-rail chat-sessions-scrollbar overflow-x-auto overflow-y-hidden lg:overflow-x-hidden lg:overflow-y-auto'
      )}>
        <div className={cn(
          'p-3',
          isSidebar ? 'space-y-2 min-h-full' : 'flex gap-2 lg:block lg:space-y-2 lg:min-h-full'
        )}>
          {sessions.length === 0 ? (
            <div className="min-w-full text-center py-6 px-4 lg:py-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3 lg:h-12 lg:w-12" />
              <p className="text-sm text-textSecondary font-medium">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start your first chat above</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'text-left p-3 rounded-lg text-sm transition-all duration-200 group relative cursor-pointer border',
                  isSidebar ? 'w-full' : 'min-w-[220px] lg:min-w-0 lg:w-full',
                  activeSessionId === session.id
                    ? 'bg-primary-light text-textPrimary border-primary/30 shadow-soft'
                    : 'bg-surface hover:bg-muted/60 text-textPrimary border-border hover:border-primary/20'
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "p-2 rounded-md transition-colors duration-200",
                    activeSessionId === session.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted group-hover:bg-primary/10"
                  )}>
                    <MessageSquare className={cn(
                      "h-4 w-4 flex-shrink-0",
                      activeSessionId === session.id ? "text-primary-foreground" : "text-textSecondary group-hover:text-primary"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="truncate block font-medium">
                      Chat {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span className={cn(
                      "text-xs block truncate",
                      activeSessionId === session.id ? "text-primary" : "text-muted-foreground"
                    )}>
                      {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {onDeleteSession && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "p-2 rounded-md transition-all duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
                            activeSessionId === session.id
                              ? "hover:bg-primary/10 text-primary"
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
      </div>
    </div>
  );
}

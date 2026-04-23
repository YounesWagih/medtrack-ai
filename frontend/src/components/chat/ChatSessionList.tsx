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
    <div className="h-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 flex-shrink-0">
        <Button
          onClick={onNewSession}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0 chat-sessions-scrollbar">
        <div className="p-3 space-y-2 min-h-full">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start your first chat above</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'w-full text-left p-4 rounded-xl text-sm transition-all duration-300 group relative transform hover:scale-[1.01] cursor-pointer',
                  activeSessionId === session.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-[1.02]'
                    : 'hover:bg-white/60 text-gray-700 hover:shadow-md border border-transparent hover:border-gray-100/50'
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors duration-300",
                    activeSessionId === session.id
                      ? "bg-white/20"
                      : "bg-gray-100 group-hover:bg-blue-100"
                  )}>
                    <MessageSquare className={cn(
                      "h-4 w-4 flex-shrink-0",
                      activeSessionId === session.id ? "text-white" : "text-gray-600 group-hover:text-blue-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="truncate block font-medium">
                      Chat {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span className={cn(
                      "text-xs block truncate",
                      activeSessionId === session.id ? "text-blue-100" : "text-gray-500"
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
                              : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="backdrop-blur-lg bg-white/90 border border-gray-200/50">
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700 focus:text-red-700 transition-colors duration-200"
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
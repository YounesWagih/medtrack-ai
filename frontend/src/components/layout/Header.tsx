import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Menu } from 'lucide-react';
import medTrackIcon from '@/assets/MedTrack-Ai-icon.png';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    queryClient.clear();
    logout();
  };

  return (
    <header className="fixed top-0 left-0 md:left-[280px] right-0 h-16 bg-surface/95 backdrop-blur-sm border-b border-border/50 shadow-sm z-40">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img src={medTrackIcon} alt="MedTrack AI" className="h-8 w-auto md:hidden" />
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
        </div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-10 rounded-full mr-4 hover:bg-primary/10 transition-all duration-300">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-lg border-border/50">
                <div className="flex items-center justify-start gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-textPrimary">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-textSecondary">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-danger/10 focus:bg-danger/10 focus:text-danger transition-colors">
                  <LogOut className="mr-2 h-4 w-4 text-danger" />
                  <span className="text-danger">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

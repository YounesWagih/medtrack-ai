import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  Package,
} from 'lucide-react';
import medTrackIcon from '@/assets/MedTrack-Ai-icon.png';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/medicines', icon: Package, label: 'Medicines' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-gradient-to-b from-primary/5 via-surface to-primary/5 border-r border-border/50 shadow-lg">
      <div className="flex flex-col h-full">
        <div className="p-8 border-b border-border/20">
          <Link to="/dashboard" className="flex items-center group">
            <img
              src={medTrackIcon}
              alt="MedTrack AI"
              className="h-15 w-auto group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href} className="block">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start h-12 px-4 rounded-xl transition-all duration-300 group',
                    'hover:bg-primary/10 hover:shadow-md hover:scale-[1.02]',
                    isActive && 'bg-primary/15 text-primary shadow-md scale-[1.02]'
                  )}
                >
                  <Icon className={cn(
                    'mr-4 h-6 w-6 transition-all duration-300',
                    isActive ? 'text-primary' : 'text-textSecondary group-hover:text-primary'
                  )} />
                  <span className="font-medium text-base">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Pill,
  LayoutDashboard,
  MessageSquare,
  User,
  Package,
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/medicines', icon: Package, label: 'Medicines' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-surface border-r border-border">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-textPrimary">MedTrack AI</span>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href} className="block mb-1">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                     isActive && 'bg-primary/10 text-primary'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
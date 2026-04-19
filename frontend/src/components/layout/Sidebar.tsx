import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMedicines } from '@/hooks/useMedicines';
import { MedicineStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Pill,
  Plus,
  LayoutDashboard,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  onAddMedicine?: () => void;
}

export function Sidebar({ onAddMedicine }: SidebarProps) {
  const location = useLocation();
  const { medicines } = useMedicines();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const counts = {
    ALL: medicines.length,
    ACTIVE: medicines.filter((m) => m.status === MedicineStatus.ACTIVE).length,
    EXPIRING_SOON: medicines.filter((m) => m.status === MedicineStatus.EXPIRING_SOON).length,
    EXPIRED: medicines.filter((m) => m.status === MedicineStatus.EXPIRED).length,
    REMOVED: medicines.filter((m) => m.status === MedicineStatus.REMOVED).length,
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/chat', icon: MessageSquare, label: 'AI Chat' },
  ];

  const filterItems: { href: string; label: string; status: MedicineStatus | 'ALL' }[] = [
    { href: '/dashboard?status=ALL', label: 'All Medicines', status: 'ALL' },
    { href: '/dashboard?status=ACTIVE', label: 'Active', status: MedicineStatus.ACTIVE },
    { href: '/dashboard?status=EXPIRING_SOON', label: 'Expiring Soon', status: MedicineStatus.EXPIRING_SOON },
    { href: '/dashboard?status=EXPIRED', label: 'Expired', status: MedicineStatus.EXPIRED },
    { href: '/dashboard?status=REMOVED', label: 'Removed', status: MedicineStatus.REMOVED },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Pill className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Tracker</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn('w-full justify-start', isActive && 'bg-primary text-primary-foreground')}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          <div className="mt-6 mb-2 px-2 text-sm font-semibold text-muted-foreground">
            Medicines ({counts.ALL})
          </div>
          {filterItems.map((item) => {
            const isActive = location.search.includes(`status=${item.status}`);
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start', isActive && 'bg-secondary')}
                >
                  <span className="mr-2 h-5 w-5 flex items-center justify-center text-xs">
                    {counts[item.status]}
                  </span>
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button onClick={onAddMedicine} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

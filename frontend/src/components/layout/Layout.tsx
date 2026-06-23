import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar className="fixed left-0 top-0 hidden md:block" />
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent className="p-0">
          <Sidebar className="border-r-0 shadow-none" onNavigate={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="pt-16 md:ml-[280px]">
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

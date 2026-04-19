import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  onAddMedicine?: () => void;
}

export function Layout({ children, onAddMedicine }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <div className="flex">
        <Sidebar onAddMedicine={onAddMedicine} />
        <main className="flex-1 p-6 md:p-8 lg:p-10 ml-0 md:ml-0">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

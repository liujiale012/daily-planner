import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-16 lg:pb-0">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Header />
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

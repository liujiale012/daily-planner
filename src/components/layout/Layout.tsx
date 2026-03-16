import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-3 py-4 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[32px] bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <Sidebar />
        <div className="flex flex-1 flex-col pb-16 lg:pb-0">
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Header />
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function SidebarToggle() {
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';

  return (
    <SidebarTrigger variant="outline" size="sm" className="h-8 w-auto px-2.5 gap-2">
      {isExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      <span className="text-xs sm:text-sm">{isExpanded ? 'Esconder menu' : 'Expandir menu'}</span>
    </SidebarTrigger>
  );
}

export default function AppLayout() {
  const { municipio } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 gap-4 bg-card">
            <SidebarToggle />
            <h2 className="text-sm font-heading font-semibold text-foreground">
              {municipio?.nome} - {municipio?.uf}
            </h2>
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

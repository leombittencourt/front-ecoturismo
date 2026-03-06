import {
  LayoutDashboard,
  MapPin,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Trees,
  Droplets,
  LayoutGrid,
  Moon,
  Sun,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const prefeituraItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Atrativos', url: '/gestao/atrativos', icon: MapPin },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Relatorios', url: '/relatorios', icon: FileText },
  { title: 'Parametros', url: '/parametros', icon: Settings },
];

const balnearioItems = [
  { title: 'Painel de Validacao', url: '/balneario', icon: Droplets },
  { title: 'Atrativos', url: '/gestao/atrativos', icon: MapPin },
  { title: 'Quiosques', url: '/quiosques', icon: LayoutGrid },
];

const adminOperacaoItems = [
  { title: 'Painel de Validacao', url: '/balneario', icon: Droplets },
];

const adminItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Atrativos', url: '/gestao/atrativos', icon: MapPin },
  { title: 'Quiosques', url: '/quiosques', icon: LayoutGrid },
  { title: 'Usuarios', url: '/usuarios', icon: Users },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Relatorios', url: '/relatorios', icon: FileText },
  { title: 'Administracao', url: '/admin', icon: Settings },
  { title: 'Parametros', url: '/parametros', icon: Settings },
];

export function AppSidebar() {
  const { user, municipio, logout, hasRole } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDark = (resolvedTheme ?? theme) === 'dark';
  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    // Fallback for environments where next-themes update is delayed.
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  let mainItems = prefeituraItems;
  if (hasRole(['admin'])) {
    mainItems = adminItems;
  } else if (hasRole(['balneario'])) {
    mainItems = balnearioItems;
  }

  return (
    <Sidebar className="border-r-0">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Trees className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-semibold text-sidebar-foreground truncate">EcoTurismo</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">{municipio?.nome || 'Municipio'} - {municipio?.uf || 'UF'}</p>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            {hasRole(['admin']) ? 'Administracao' : hasRole(['balneario']) ? 'Operacao' : 'Gestao'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasRole(['admin']) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Operacao</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminOperacaoItems.map(item => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-heading font-bold text-sidebar-primary">
            {user?.nome?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.nome}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={toggleTheme}
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <span className="text-xs text-sidebar-foreground/50">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

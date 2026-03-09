import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';

type PublicPageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function PublicPageHeader({ title, subtitle }: PublicPageHeaderProps) {
  const navigate = useNavigate();
  const { configs } = useConfiguracoes();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-card/95">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            {configs.logo_publica ? (
              <img src={configs.logo_publica} alt={configs.nome_sistema} className="h-7 object-contain" />
            ) : (
              <Trees className="h-6 w-6 text-primary shrink-0" />
            )}
            <span className="font-heading font-bold text-foreground truncate">{configs.nome_sistema}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:text-foreground hover:bg-muted'}`
              }
            >
              Inicio
            </NavLink>
            <NavLink
              to="/atrativos"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:text-foreground hover:bg-muted'}`
              }
            >
              Atrativos
            </NavLink>
            <NavLink
              to="/reservar"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:text-foreground hover:bg-muted'}`
              }
            >
              Reservas
            </NavLink>
            <NavLink
              to="/consultar-ticket"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:text-foreground hover:bg-muted'}`
              }
            >
              Consultar ticket
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleBack} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Area Administrativa
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm sm:text-base text-foreground/70">{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
}

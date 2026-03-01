import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, MapPin, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAtrativos, type Atrativo } from '@/services/api';

function roleLabel(role?: string) {
  const r = String(role ?? '').toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'prefeitura') return 'Prefeitura';
  if (r === 'balneario') return 'Balneario';
  return 'Publico';
}

export default function Admin() {
  const { user, municipio } = useAuth();
  const [atrativos, setAtrativos] = useState<Atrativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?.municipioId) {
          if (active) setAtrativos([]);
          return;
        }

        const data = await fetchAtrativos({ MunicipioId: user.municipioId });
        if (!active) return;
        setAtrativos(data ?? []);
      } catch (e) {
        if (!active) return;
        setError('Nao foi possivel carregar os dados de administracao.');
        console.error('Erro em Admin:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [user?.municipioId]);

  const usuariosSistema = useMemo(() => {
    if (!user) return [];
    return [user];
  }, [user]);

  const municipiosCount = municipio ? 1 : 0;
  const usuariosCount = usuariosSistema.length;
  const atrativosCount = atrativos.length;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold">Administracao</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Administracao</h1>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-heading font-bold">{municipiosCount}</p>
            <p className="text-sm text-muted-foreground">Municipios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <Users className="h-8 w-8 mx-auto text-accent mb-2" />
            <p className="text-3xl font-heading font-bold">{usuariosCount}</p>
            <p className="text-sm text-muted-foreground">Usuarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <MapPin className="h-8 w-8 mx-auto text-secondary mb-2" />
            <p className="text-3xl font-heading font-bold">{atrativosCount}</p>
            <p className="text-sm text-muted-foreground">Atrativos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Users className="h-5 w-5" /> Usuarios do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usuariosSistema.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuario disponivel.</p>
          ) : (
            <div className="space-y-2">
              {usuariosSistema.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{u.nome}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge className="capitalize">{roleLabel(u.role)}</Badge>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Listagem completa de usuarios depende de endpoint dedicado no backend.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Settings className="h-5 w-5" /> Configuracao de Atrativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {atrativos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum atrativo encontrado para este municipio.</p>
          ) : (
            <div className="space-y-2">
              {atrativos.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">Capacidade: {a.capacidadeMaxima} · Tipo: {a.tipo}</p>
                  </div>
                  <Badge className={a.status === 'ativo' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

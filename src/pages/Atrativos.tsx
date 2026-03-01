import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAtrativos } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Atrativo } from '@/data/mock-data';
import { MapPin, Users, Droplets, Mountain, TreePine, Tent } from 'lucide-react';

const tipoIcons: Record<string, React.ElementType> = {
  balneario: Droplets,
  cachoeira: Mountain,
  trilha: TreePine,
  parque: Tent,
};

function OcupacaoBadge({ ocupacao, capacidade }: { ocupacao: number; capacidade: number }) {
  const pct = Math.round((ocupacao / capacidade) * 100);
  let className = 'bg-success text-success-foreground';
  if (pct >= 80) className = 'bg-destructive text-destructive-foreground';
  else if (pct >= 50) className = 'bg-warning text-warning-foreground';
  return <Badge className={className}>{pct}% ocupado</Badge>;
}

function StatusBadge({ status }: { status: Atrativo['status'] }) {
  const map: Record<string, string> = {
    ativo: 'bg-success text-success-foreground',
    inativo: 'bg-muted text-muted-foreground',
    manutencao: 'bg-warning text-warning-foreground',
  };
  const labels: Record<string, string> = { ativo: 'Ativo', inativo: 'Inativo', manutencao: 'Manutenção' };
  return <Badge className={map[status]}>{labels[status]}</Badge>;
}

export default function Atrativos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [atrativos, setAtrativos] = useState<Atrativo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.municipioId) {
      setAtrativos([]);
      setLoading(false);
      return;
    }

    fetchAtrativos({ MunicipioId: user.municipioId })
      .then(d => { setAtrativos(d); })
      .finally(() => { setLoading(false); });
  }, [user?.municipioId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Atrativos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Atrativos Turísticos</h1>
        <p className="text-sm text-muted-foreground">{atrativos.length} cadastrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {atrativos.map(a => {
          const Icon = tipoIcons[a.tipo] || MapPin;
          return (
            <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/atrativos/${a.id}`)}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-sm">{a.nome}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{a.tipo}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.descricao}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{a.ocupacaoAtual}/{a.capacidadeMaxima}</span>
                  </div>
                  {a.status === 'ativo' && (
                    <OcupacaoBadge ocupacao={a.ocupacaoAtual} capacidade={a.capacidadeMaxima} />
                  )}
                </div>
                {a.status === 'ativo' && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (a.ocupacaoAtual / a.capacidadeMaxima) * 100)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

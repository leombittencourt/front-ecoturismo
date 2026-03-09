import { Card, CardContent } from '@/components/ui/card';
import { QuiosqueStatus, STATUS_CONFIG, Quiosque } from './types';

interface Props {
  quiosques: Quiosque[];
}

export function QuiosqueStatusCounters({ quiosques }: Props) {
  const counts: Record<QuiosqueStatus, number> = {
    disponivel: quiosques.filter(q => q.status === 'disponivel').length,
    ocupado: quiosques.filter(q => q.status === 'ocupado').length,
    manutencao: quiosques.filter(q => q.status === 'manutencao').length,
    bloqueado: quiosques.filter(q => q.status === 'bloqueado').length,
    inativo: quiosques.filter(q => q.status === 'inativo').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {(Object.entries(STATUS_CONFIG) as [QuiosqueStatus, typeof STATUS_CONFIG[QuiosqueStatus]][]).map(([key, cfg]) => {
        const Icon = cfg.icon;
        return (
          <Card key={key} className="border">
            <CardContent className="p-3 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${cfg.color}`} />
              <div>
                <p className="text-lg font-bold text-foreground">{counts[key]}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { Shield, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  isAnonymized: boolean;
}

export function LGPDBadge({ isAnonymized }: Props) {
  if (!isAnonymized) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="gap-1 text-[10px] border-accent/30 text-accent">
          <Shield className="h-3 w-3" />
          LGPD
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] text-xs">
        Dados pessoais (nome, CPF, e-mail) são anonimizados para este perfil, conforme a Lei Geral de Proteção de Dados.
      </TooltipContent>
    </Tooltip>
  );
}

export function LGPDBanner() {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20 text-sm">
      <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
      <p className="text-muted-foreground text-xs">
        <strong className="text-accent">LGPD:</strong> Dados pessoais dos visitantes estão anonimizados. Apenas dados agregados são exibidos para este perfil.
      </p>
    </div>
  );
}

import { Ban, CheckCircle, PauseCircle, XCircle, Wrench } from 'lucide-react';

export type QuiosqueStatus = 'disponivel' | 'ocupado' | 'manutencao' | 'bloqueado' | 'inativo';

export interface Quiosque {
  id: string;
  numero: number;
  tem_churrasqueira: boolean;
  status: QuiosqueStatus;
  posicao_x: number;
  posicao_y: number;
  atrativo_id: string | null;
}

export type FilterType = 'todos' | 'churrasqueira' | 'sem_churrasqueira';

export function normalizeQuiosqueStatus(value: unknown): QuiosqueStatus {
  const raw = String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (raw === 'disponivel') return 'disponivel';
  if (raw === 'ocupado') return 'ocupado';
  if (raw === 'manutencao' || raw === 'em_manutencao') return 'manutencao';
  if (raw === 'bloqueado') return 'bloqueado';
  if (raw === 'inativo') return 'inativo';
  // Compatibilidade com dados legados: "reservado" equivale a ocupado.
  if (raw === 'reservado') return 'ocupado';
  return 'disponivel';
}

export const STATUS_CONFIG: Record<QuiosqueStatus, { label: string; color: string; bgClass: string; icon: React.ElementType }> = {
  disponivel: {
    label: 'Disponivel',
    color: 'text-white',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/60',
    icon: CheckCircle,
  },
  ocupado: {
    label: 'Ocupado',
    color: 'text-red-700 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/60',
    icon: XCircle,
  },
  manutencao: {
    label: 'Em Manutencao',
    color: 'text-muted-foreground',
    bgClass: 'bg-muted border-border hover:bg-muted/80',
    icon: Wrench,
  },
  bloqueado: {
    label: 'Bloqueado',
    color: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/60',
    icon: Ban,
  },
  inativo: {
    label: 'Inativo',
    color: 'text-slate-700 dark:text-slate-400',
    bgClass: 'bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-900/60',
    icon: PauseCircle,
  },
};

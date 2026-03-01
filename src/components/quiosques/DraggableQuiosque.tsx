import { Flame, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDraggable } from '@dnd-kit/core';
import { Quiosque, STATUS_CONFIG } from './types';

interface Props {
  q: Quiosque;
  editMode: boolean;
  onOpen: (q: Quiosque) => void;
}

export function DraggableQuiosque({ q, editMode, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: q.id,
    disabled: !editMode,
  });

  const cfg = STATUS_CONFIG[q.status];
  const badgeClass =
    q.status === 'disponivel'
      ? 'text-[10px] mt-1 bg-emerald-600 text-white border border-emerald-700'
      : q.status === 'reservado'
        ? 'text-[10px] mt-1 bg-amber-500 text-white border border-amber-600'
        : q.status === 'ocupado'
          ? 'text-[10px] mt-1 bg-red-600 text-white border border-red-700'
          : q.status === 'bloqueado'
            ? 'text-[10px] mt-1 bg-orange-600 text-white border border-orange-700'
            : q.status === 'inativo'
              ? 'text-[10px] mt-1 bg-slate-700 text-white border border-slate-800'
              : 'text-[10px] mt-1 bg-slate-600 text-white border border-slate-700';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={setNodeRef}
          {...(editMode ? { ...attributes, ...listeners } : {})}
          onClick={() => !editMode && onOpen(q)}
          className={`relative h-[112px] w-full rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-1 transition-all ${cfg.bgClass} ${
            editMode ? 'cursor-grab active:cursor-grabbing ring-2 ring-primary/30' : 'cursor-pointer'
          } ${isDragging ? 'opacity-30' : ''}`}
        >
          {editMode && <GripVertical className="absolute top-1 right-1 h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm font-bold text-foreground">Q{q.numero}</span>
          <div className="h-5 w-5 flex items-center justify-center">
            {q.tem_churrasqueira ? <Flame className="h-5 w-5 text-orange-500" /> : null}
          </div>
          <Badge variant="secondary" className={badgeClass}>{cfg.label}</Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Quiosque {q.numero} - {cfg.label}</p>
        <p>{q.tem_churrasqueira ? 'Com churrasqueira' : 'Sem churrasqueira'}</p>
        {editMode && <p className="text-primary font-medium">Arraste para reposicionar</p>}
      </TooltipContent>
    </Tooltip>
  );
}

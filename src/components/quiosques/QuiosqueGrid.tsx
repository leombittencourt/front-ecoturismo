import { Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, DragOverlay,
} from '@dnd-kit/core';
import { Quiosque, QuiosqueStatus, STATUS_CONFIG } from './types';
import { DraggableQuiosque } from './DraggableQuiosque';
import { DroppableCell } from './DroppableCell';
import { useState } from 'react';

interface Props {
  quiosques: Quiosque[];
  editMode: boolean;
  onOpenDialog: (q: Quiosque) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function QuiosqueGrid({ quiosques, editMode, onOpenDialog, onDragEnd }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const orderedQuiosques = [...quiosques].sort((a, b) => {
    if (a.posicao_y !== b.posicao_y) return a.posicao_y - b.posicao_y;
    if (a.posicao_x !== b.posicao_x) return a.posicao_x - b.posicao_x;
    return a.numero - b.numero;
  });

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const activeQuiosque = activeId ? quiosques.find(q => q.id === activeId) : null;

  const gridCells = orderedQuiosques.map((q) => {
    if (editMode) {
      return (
        <DroppableCell key={q.id} x={q.posicao_x} y={q.posicao_y}>
          <DraggableQuiosque q={q} editMode={editMode} onOpen={onOpenDialog} />
        </DroppableCell>
      );
    }

    return (
      <div key={q.id} className="min-h-[100px]">
        <DraggableQuiosque q={q} editMode={false} onOpen={onOpenDialog} />
      </div>
    );
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Mapa Visual</CardTitle>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div
            className="grid gap-2 w-full"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
            }}
          >
            {gridCells}
          </div>

          <DragOverlay>
            {activeQuiosque ? (
              <div className={`h-[112px] rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-1 shadow-lg ${STATUS_CONFIG[activeQuiosque.status].bgClass} opacity-90`}>
                <span className="text-sm font-bold text-foreground">Q{activeQuiosque.numero}</span>
                <div className="h-5 w-5 flex items-center justify-center">
                  {activeQuiosque.tem_churrasqueira ? <Flame className="h-5 w-5 text-orange-500" /> : null}
                </div>
                <Badge
                  variant="secondary"
                  className={
                    activeQuiosque.status === 'disponivel'
                      ? 'text-[10px] mt-1 bg-emerald-600 text-white border border-emerald-700'
                      : activeQuiosque.status === 'reservado'
                        ? 'text-[10px] mt-1 bg-amber-500 text-white border border-amber-600'
                        : activeQuiosque.status === 'ocupado'
                          ? 'text-[10px] mt-1 bg-red-600 text-white border border-red-700'
                          : activeQuiosque.status === 'bloqueado'
                            ? 'text-[10px] mt-1 bg-orange-600 text-white border border-orange-700'
                            : activeQuiosque.status === 'inativo'
                              ? 'text-[10px] mt-1 bg-slate-700 text-white border border-slate-800'
                              : 'text-[10px] mt-1 bg-slate-600 text-white border border-slate-700'
                  }
                >
                  {STATUS_CONFIG[activeQuiosque.status].label}
                </Badge>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          {(Object.entries(STATUS_CONFIG) as [QuiosqueStatus, typeof STATUS_CONFIG[QuiosqueStatus]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`w-3 h-3 rounded-sm border ${cfg.bgClass}`} />
              {cfg.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-orange-500" />
            Churrasqueira
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

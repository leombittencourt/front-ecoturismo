import { useDroppable } from '@dnd-kit/core';

interface Props {
  x: number;
  y: number;
  children?: React.ReactNode;
}

export function DroppableCell({ x, y, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${x}-${y}` });

  return (
    <div
      ref={setNodeRef}
      className={`h-[112px] rounded-xl border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/10' : 'border-transparent'
      }`}
    >
      {children}
    </div>
  );
}

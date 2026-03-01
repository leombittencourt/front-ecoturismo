import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterType } from './types';

interface Props {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
}

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'churrasqueira', label: '🔥 Com Churrasqueira' },
  { key: 'sem_churrasqueira', label: 'Sem Churrasqueira' },
];

export function QuiosqueFilters({ filter, onFilterChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-muted-foreground" />
      {FILTER_OPTIONS.map(f => (
        <Button key={f.key} variant={filter === f.key ? 'default' : 'outline'} size="sm" onClick={() => onFilterChange(f.key)}>
          {f.label}
        </Button>
      ))}
    </div>
  );
}

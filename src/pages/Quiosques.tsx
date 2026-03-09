import { useState } from 'react';
import { MapPin, GripVertical, Lock, Unlock, Building2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterType } from '@/components/quiosques/types';
import { QuiosqueStatusCounters } from '@/components/quiosques/QuiosqueStatusCounters';
import { QuiosqueFilters } from '@/components/quiosques/QuiosqueFilters';
import { QuiosqueGrid } from '@/components/quiosques/QuiosqueGrid';
import { QuiosqueDetailDialog } from '@/components/quiosques/QuiosqueDetailDialog';
import { CreateQuiosqueDialog } from '@/components/quiosques/CreateQuiosqueDialog';
import { useQuiosques } from '@/hooks/useQuiosques';

export default function Quiosques() {
  const [filter, setFilter] = useState<FilterType>('todos');
  const [editMode, setEditMode] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { hasRole } = useAuth();
  const isStaff = hasRole(['admin', 'prefeitura', 'balneario']);

  const {
    quiosques, loading, atrativos, selectedAtrativoId, handleSelectAtrativo,
    selectedQuiosque, newStatus, setNewStatus, saving,
    handleOpenDialog, handleCloseDialog, handleSaveQuiosque, handleDragEnd,
    handleCreateQuiosque, handleDeleteQuiosque, handleInativarQuiosque,
    handleDesvincularReservasQuiosque,
    dataConsulta, dataConsultaFim,
    reservaVinculada, loadingReservaVinculada,
    canDeleteSelectedQuiosque, deleteBlockReason,
  } = useQuiosques();

  const filtered = quiosques.filter(q => {
    if (filter === 'churrasqueira') return q.tem_churrasqueira;
    if (filter === 'sem_churrasqueira') return !q.tem_churrasqueira;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Mapa de Quiosques
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visualização interativa dos quiosques e seus status</p>
        </div>
        <div className="flex items-center gap-2">
          {isStaff && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(true)}
              disabled={!selectedAtrativoId}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Novo Quiosque
            </Button>
          )}
          {isStaff && (
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode(e => !e)}
            >
              {editMode ? <><Unlock className="h-4 w-4 mr-1.5" /> Modo Edição Ativo</> : <><Lock className="h-4 w-4 mr-1.5" /> Reorganizar Mapa</>}
            </Button>
          )}
        </div>
      </div>

      {/* Seletor de local */}
      {atrativos.length > 0 && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedAtrativoId || ''} onValueChange={handleSelectAtrativo}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione o local" />
            </SelectTrigger>
            <SelectContent>
              {atrativos.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {editMode && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-primary flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          Arraste os quiosques para reorganizar suas posições no mapa. As posições são salvas automaticamente.
        </div>
      )}

      <QuiosqueStatusCounters quiosques={quiosques} />
      <QuiosqueFilters filter={filter} onFilterChange={setFilter} />
      <QuiosqueGrid quiosques={filtered} editMode={editMode} onOpenDialog={handleOpenDialog} onDragEnd={handleDragEnd} />

      <QuiosqueDetailDialog
        quiosque={selectedQuiosque}
        onClose={handleCloseDialog}
        isStaff={isStaff}
        newStatus={newStatus}
        onStatusChange={setNewStatus}
        onSave={handleSaveQuiosque}
        onDelete={() => selectedQuiosque && handleDeleteQuiosque(selectedQuiosque.id)}
        onInativar={() => selectedQuiosque && handleInativarQuiosque(selectedQuiosque.id)}
        onDesvincularReservas={(motivo) => selectedQuiosque && handleDesvincularReservasQuiosque(selectedQuiosque.id, motivo)}
        saving={saving}
        dataConsulta={dataConsulta}
        dataConsultaFim={dataConsultaFim}
        reservaVinculada={reservaVinculada}
        loadingReservaVinculada={loadingReservaVinculada}
        canDelete={canDeleteSelectedQuiosque}
        deleteBlockReason={deleteBlockReason}
      />

      <CreateQuiosqueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={async (data) => {
          await handleCreateQuiosque(data);
          setCreateOpen(false);
        }}
        saving={saving}
      />
    </div>
  );
}

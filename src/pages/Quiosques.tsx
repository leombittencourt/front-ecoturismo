import { useState } from 'react';
import { MapPin, GripVertical, Lock, Unlock, Building2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FilterType, QuiosqueStatus } from '@/components/quiosques/types';
import { QuiosqueStatusCounters } from '@/components/quiosques/QuiosqueStatusCounters';
import { QuiosqueFilters } from '@/components/quiosques/QuiosqueFilters';
import { QuiosqueGrid } from '@/components/quiosques/QuiosqueGrid';
import { QuiosqueDetailDialog } from '@/components/quiosques/QuiosqueDetailDialog';
import { CreateQuiosqueDialog } from '@/components/quiosques/CreateQuiosqueDialog';
import { useQuiosques } from '@/hooks/useQuiosques';

export default function Quiosques() {
  const [filter, setFilter] = useState<FilterType>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | QuiosqueStatus>('todos');
  const [numeroFilter, setNumeroFilter] = useState('');
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
    dataConsulta, setDataConsulta, dataConsultaFim,
    reservaVinculada, loadingReservaVinculada,
    canDeleteSelectedQuiosque, deleteBlockReason,
  } = useQuiosques();

  const filtered = quiosques.filter(q => {
    if (statusFilter !== 'todos' && q.status !== statusFilter) return false;
    if (numeroFilter.trim() && !String(q.numero).includes(numeroFilter.trim())) return false;
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
          <p className="text-sm text-muted-foreground mt-1">Visualizacao interativa dos quiosques e seus status</p>
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
              {editMode ? <><Unlock className="h-4 w-4 mr-1.5" /> Modo Edicao Ativo</> : <><Lock className="h-4 w-4 mr-1.5" /> Reorganizar Mapa</>}
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
          Arraste os quiosques para reorganizar suas posicoes no mapa. As posicoes sao salvas automaticamente.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-border bg-card p-3">
        <div className="space-y-1">
          <Label htmlFor="filtro-data">Data de referencia</Label>
          <Input
            id="filtro-data"
            type="date"
            value={dataConsulta}
            onChange={(e) => setDataConsulta(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filtro-status">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'todos' | QuiosqueStatus)}>
            <SelectTrigger id="filtro-status">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="disponivel">Disponivel</SelectItem>
              <SelectItem value="ocupado">Ocupado</SelectItem>
              <SelectItem value="manutencao">Em manutencao</SelectItem>
              <SelectItem value="bloqueado">Bloqueado</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filtro-numero">Numero do quiosque</Label>
          <Input
            id="filtro-numero"
            type="text"
            inputMode="numeric"
            placeholder="Ex.: 5"
            value={numeroFilter}
            onChange={(e) => setNumeroFilter(e.target.value.replace(/[^\d]/g, ''))}
          />
        </div>
      </div>
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




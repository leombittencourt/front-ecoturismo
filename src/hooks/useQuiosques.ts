import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Quiosque, QuiosqueStatus, normalizeQuiosqueStatus } from '@/components/quiosques/types';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  fetchAtrativos,
  fetchQuiosques,
  criarQuiosque,
  atualizarQuiosque,
  atualizarPosicaoQuiosque,
  excluirQuiosque,
  inativarQuiosque,
  desvincularReservasQuiosque,
} from '@/services/api';
import { apiClient, type QuiosqueDto, type ReservaDto } from '@/services/apiClient';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function mapQuiosque(dto: QuiosqueDto): Quiosque {
  const rawPosX =
    toNumber(dto.posicao_x) ??
    toNumber(dto.posicaoX) ??
    toNumber(dto.PosicaoX) ??
    0;
  const rawPosY =
    toNumber(dto.posicao_y) ??
    toNumber(dto.posicaoY) ??
    toNumber(dto.PosicaoY) ??
    0;

  return {
    id: dto.id,
    numero: dto.numero,
    status: normalizeQuiosqueStatus(dto.status),
    posicao_x: rawPosX,
    posicao_y: rawPosY,
    atrativo_id: dto.atrativo_id ?? dto.atrativoId ?? null,
    tem_churrasqueira: dto.tem_churrasqueira ?? dto.temChurrasqueira ?? false,
  };
}

function normalizeGridPositions(items: Quiosque[]): Quiosque[] {
  if (items.length === 0) return items;

  const sorted = [...items].sort((a, b) => {
    if (a.posicao_y !== b.posicao_y) return a.posicao_y - b.posicao_y;
    if (a.posicao_x !== b.posicao_x) return a.posicao_x - b.posicao_x;
    return a.numero - b.numero;
  });

  // Keep quiosques filling from left to right; only break line after many items.
  const cols = Math.max(1, Math.min(12, sorted.length));

  return sorted.map((q, index) => ({
    ...q,
    posicao_x: index % cols,
    posicao_y: Math.floor(index / cols),
  }));
}

type ReservaVinculada = {
  id: string;
  nomeVisitante: string;
  email: string;
  quantidadePessoas: number;
  tipo: string;
  status: string;
  statusDescricao?: string;
  data: string;
  dataFim?: string | null;
  token: string;
};

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function intersectsPeriod(
  reservaInicio: string | null,
  reservaFim: string | null,
  periodoInicio: string,
  periodoFim: string
): boolean {
  if (!reservaInicio) return false;
  const fimReserva = reservaFim ?? reservaInicio;
  return reservaInicio <= periodoFim && fimReserva >= periodoInicio;
}

function isReservaAtivaOuFutura(status: unknown, data: string | null, dataFim: string | null): boolean {
  const statusNorm = String(status ?? '').trim().toLowerCase();
  const ativa = statusNorm === 'confirmada' || statusNorm === 'em_andamento' || statusNorm === 'validada';
  if (!ativa) return false;

  const hoje = new Date().toISOString().split('T')[0];
  const fim = dataFim ?? data;
  if (!fim) return false;
  return fim >= hoje;
}

export function useQuiosques() {
  const { user } = useAuth();
  const [quiosques, setQuiosques] = useState<Quiosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [atrativos, setAtrativos] = useState<{ id: string; nome: string }[]>([]);
  const [selectedAtrativoId, setSelectedAtrativoId] = useState<string | null>(null);
  const [selectedQuiosque, setSelectedQuiosque] = useState<Quiosque | null>(null);
  const [newStatus, setNewStatus] = useState<QuiosqueStatus>('disponivel');
  const [saving, setSaving] = useState(false);
  const [dataConsulta, setDataConsulta] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dataConsultaFim, setDataConsultaFim] = useState<string>('');
  const [reservaVinculada, setReservaVinculada] = useState<ReservaVinculada[]>([]);
  const [loadingReservaVinculada, setLoadingReservaVinculada] = useState(false);
  const [canDeleteSelectedQuiosque, setCanDeleteSelectedQuiosque] = useState(true);
  const [deleteBlockReason, setDeleteBlockReason] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAtrativos = async () => {
    if (!user?.municipioId) {
      setAtrativos([]);
      return null;
    }

    const data = await fetchAtrativos({ MunicipioId: user.municipioId });
    const options = data.map((a) => ({ id: a.id, nome: a.nome }));
    setAtrativos(options);
    return options[0]?.id ?? null;
  };

  const loadQuiosques = async (atrativoId?: string) => {
    const id = atrativoId || selectedAtrativoId;
    if (!id) {
      setQuiosques([]);
      setLoading(false);
      return;
    }

    const data = await fetchQuiosques(id);
    const mapped = data.map(mapQuiosque);
    setQuiosques(normalizeGridPositions(mapped));
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const firstId = await loadAtrativos();
        if (firstId) {
          setSelectedAtrativoId(firstId);
          await loadQuiosques(firstId);
        } else {
          setQuiosques([]);
          setLoading(false);
        }
      } catch {
        setLoading(false);
        toast({ title: 'Erro', description: 'Não foi possível carregar os dados de quiosques.', variant: 'destructive' });
      }
    };

    init();
  }, [user?.municipioId, toast]);

  const handleSelectAtrativo = (id: string) => {
    setSelectedAtrativoId(id);
    setLoading(true);
    loadQuiosques(id).catch(() => {
      setLoading(false);
      toast({ title: 'Erro', description: 'Não foi possível carregar os quiosques.', variant: 'destructive' });
    });
  };

  const handleOpenDialog = (q: Quiosque) => {
    setSelectedQuiosque(q);
    setNewStatus(q.status);
  };

  const handleCloseDialog = () => setSelectedQuiosque(null);

  const loadReservaVinculada = async (q: Quiosque) => {
    if (!selectedAtrativoId) {
      setReservaVinculada([]);
      return;
    }

    setLoadingReservaVinculada(true);
    try {
      const periodoInicio = dataConsulta || new Date().toISOString().split('T')[0];
      const periodoFim = dataConsultaFim || periodoInicio;
      const reservas = await apiClient.listarReservasPorAtrativo(selectedAtrativoId);

      const vinculadas = (reservas ?? [])
        .filter((r: ReservaDto & any) => (r.quiosqueId ?? r.quiosque_id ?? null) === q.id)
        .filter((r: ReservaDto & any) =>
          intersectsPeriod(
            toIsoDate(r.data),
            toIsoDate(r.dataFim ?? r.data_fim ?? null),
            periodoInicio,
            periodoFim
          )
        )
        .map((r: ReservaDto & any) => ({
          id: r.id,
          nomeVisitante: r.nomeVisitante ?? r.nome_visitante ?? '-',
          email: r.email ?? '-',
          quantidadePessoas: Number(r.quantidadePessoas ?? r.quantidade_pessoas ?? 1),
          tipo: r.tipo ?? 'day_use',
          status: String(r.status ?? ''),
          statusDescricao: r.statusDescricao ?? r.status_descricao,
          data: toIsoDate(r.data) ?? periodoInicio,
          dataFim: toIsoDate(r.dataFim ?? r.data_fim ?? null),
          token: r.token ?? '-',
        }));

      setReservaVinculada(vinculadas);

      const vinculadasAtivasOuFuturas = (reservas ?? []).filter((r: ReservaDto & any) => {
        if ((r.quiosqueId ?? r.quiosque_id ?? null) !== q.id) return false;
        const inicio = toIsoDate(r.data);
        const fim = toIsoDate(r.dataFim ?? r.data_fim ?? null) ?? inicio;
        return isReservaAtivaOuFutura(r.status, inicio, fim);
      });

      if (vinculadasAtivasOuFuturas.length > 0) {
        setCanDeleteSelectedQuiosque(false);
        setDeleteBlockReason('Este quiosque possui reservas ativas/futuras vinculadas. Inative o quiosque em vez de excluir.');
      } else {
        setCanDeleteSelectedQuiosque(true);
        setDeleteBlockReason(null);
      }
    } catch {
      setReservaVinculada([]);
      setCanDeleteSelectedQuiosque(true);
      setDeleteBlockReason(null);
    } finally {
      setLoadingReservaVinculada(false);
    }
  };

  useEffect(() => {
    if (!selectedQuiosque) {
      setCanDeleteSelectedQuiosque(true);
      setDeleteBlockReason(null);
      return;
    }
    loadReservaVinculada(selectedQuiosque).catch(() => {
      setReservaVinculada([]);
      setLoadingReservaVinculada(false);
      setCanDeleteSelectedQuiosque(true);
      setDeleteBlockReason(null);
    });
  }, [selectedQuiosque, selectedAtrativoId, dataConsulta, dataConsultaFim]);

  const handleSaveQuiosque = async (updates: { status: QuiosqueStatus; numero: number; tem_churrasqueira: boolean }) => {
    if (!selectedQuiosque) return;
    setSaving(true);
    try {
      await atualizarQuiosque(selectedQuiosque.id, {
        status: updates.status,
        numero: updates.numero,
        temChurrasqueira: updates.tem_churrasqueira,
      });
      toast({ title: 'Quiosque atualizado', description: `Quiosque ${updates.numero} salvo com sucesso.` });
      setSelectedQuiosque(null);
      await loadQuiosques();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o quiosque.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    if (!overId.startsWith('cell-')) return;

    const [, xStr, yStr] = overId.split('-');
    const targetX = parseInt(xStr, 10);
    const targetY = parseInt(yStr, 10);
    const draggedId = active.id as string;
    const dragged = quiosques.find((q) => q.id === draggedId);
    if (!dragged || (dragged.posicao_x === targetX && dragged.posicao_y === targetY)) return;

    const occupant = quiosques.find((q) => q.posicao_x === targetX && q.posicao_y === targetY);
    if (!occupant || occupant.id === dragged.id) return;

    setQuiosques((prev) => prev.map((q) => {
      if (q.id === draggedId) return { ...q, posicao_x: targetX, posicao_y: targetY };
      if (q.id === occupant.id) return { ...q, posicao_x: dragged.posicao_x, posicao_y: dragged.posicao_y };
      return q;
    }));

    try {
      const updates = [
        atualizarPosicaoQuiosque(draggedId, { posicaoX: targetX, posicaoY: targetY }),
      ];
      updates.push(
        atualizarPosicaoQuiosque(occupant.id, { posicaoX: dragged.posicao_x, posicaoY: dragged.posicao_y })
      );

      await Promise.all(updates);
      toast({ title: 'Posição atualizada', description: `Q${dragged.numero} <-> Q${occupant.numero}` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível reposicionar.', variant: 'destructive' });
    }

    await loadQuiosques();
  };

  const handleDeleteQuiosque = async (id: string) => {
    setSaving(true);
    try {
      await excluirQuiosque(id);
      toast({ title: 'Quiosque excluído', description: 'O quiosque foi removido com sucesso.' });
      setSelectedQuiosque(null);
      await loadQuiosques();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir o quiosque.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleInativarQuiosque = async (id: string) => {
    setSaving(true);
    try {
      await inativarQuiosque(id);
      toast({ title: 'Quiosque inativado', description: 'O quiosque foi marcado como inativo.' });
      setSelectedQuiosque(null);
      await loadQuiosques();
    } catch {
      toast({ title: 'Erro', description: 'NÃ£o foi possÃ­vel inativar o quiosque.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDesvincularReservasQuiosque = async (id: string, motivo: string) => {
    setSaving(true);
    try {
      const result = await desvincularReservasQuiosque(id, motivo);
      const afetadas = Number(result?.reservasAfetadas ?? 0);
      toast({
        title: 'Reservas desvinculadas',
        description: `Operacao concluida. Reservas afetadas: ${afetadas}.`,
      });
      setSelectedQuiosque(null);
      await loadQuiosques();
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel desvincular as reservas do quiosque.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateQuiosque = async (data: { numero: number; tem_churrasqueira: boolean }) => {
    if (!selectedAtrativoId) return;
    setSaving(true);

    const maxY = quiosques.length > 0 ? Math.max(...quiosques.map((q) => q.posicao_y)) : 0;
    const maxX = quiosques.length > 0 ? Math.max(...quiosques.map((q) => q.posicao_x)) : -1;
    const lastRowCount = quiosques.filter((q) => q.posicao_y === maxY).length;
    const cols = Math.max(maxX + 1, 4);
    let posX: number;
    let posY: number;
    if (lastRowCount < cols) {
      posX = lastRowCount;
      posY = maxY;
    } else {
      posX = 0;
      posY = maxY + 1;
    }

    try {
      await criarQuiosque({
        numero: data.numero,
        temChurrasqueira: data.tem_churrasqueira,
        atrativoId: selectedAtrativoId,
        posicaoX: posX,
        posicaoY: posY,
      });
      toast({ title: 'Quiosque criado', description: `Quiosque ${data.numero} adicionado com sucesso.` });
      await loadQuiosques();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível criar o quiosque.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return {
    quiosques,
    loading,
    atrativos,
    selectedAtrativoId,
    handleSelectAtrativo,
    selectedQuiosque,
    newStatus,
    setNewStatus,
    saving,
    handleOpenDialog,
    handleCloseDialog,
    handleSaveQuiosque,
    handleDragEnd,
    handleCreateQuiosque,
    handleDeleteQuiosque,
    handleInativarQuiosque,
    handleDesvincularReservasQuiosque,
    dataConsulta,
    setDataConsulta,
    dataConsultaFim,
    setDataConsultaFim,
    reservaVinculada,
    loadingReservaVinculada,
    canDeleteSelectedQuiosque,
    deleteBlockReason,
  };
}

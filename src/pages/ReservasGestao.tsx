import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient, type ReservaDto } from '@/services/apiClient';
import { atualizarStatusReservaGestao, fetchAtrativos } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type StatusReserva = 'confirmada' | 'em_andamento' | 'concluida' | 'cancelada' | 'validada' | 'nao_compareceu';

const STATUS_LABEL: Record<StatusReserva, string> = {
  confirmada: 'Confirmada',
  em_andamento: 'Em andamento',
  concluida: 'Concluida',
  cancelada: 'Cancelada',
  validada: 'Validada',
  nao_compareceu: 'Nao compareceu',
};

const STATUS_BADGE: Record<StatusReserva, string> = {
  confirmada: 'bg-success/20 text-success',
  em_andamento: 'bg-primary/20 text-primary',
  concluida: 'bg-muted text-muted-foreground',
  cancelada: 'bg-destructive/20 text-destructive',
  validada: 'bg-secondary text-secondary-foreground',
  nao_compareceu: 'bg-warning/20 text-warning',
};

function normalizeStatus(value: unknown): StatusReserva {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'confirmada') return 'confirmada';
  if (raw === 'em_andamento') return 'em_andamento';
  if (raw === 'concluida') return 'concluida';
  if (raw === 'cancelada') return 'cancelada';
  if (raw === 'validada') return 'validada';
  return 'nao_compareceu';
}

function toDateBr(value: string | null | undefined): string {
  if (!value) return '-';
  const raw = String(value).trim();
  if (!raw) return '-';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return raw;
  return dt.toLocaleDateString('pt-BR');
}

function canCancel(status: StatusReserva): boolean {
  return status === 'confirmada' || status === 'em_andamento' || status === 'validada';
}

function canNoShow(status: StatusReserva): boolean {
  return status === 'confirmada';
}

function canReactivate(status: StatusReserva): boolean {
  return status === 'cancelada' || status === 'nao_compareceu';
}

export default function ReservasGestao() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [atrativos, setAtrativos] = useState<Array<{ id: string; nome: string }>>([]);
  const [selectedAtrativoId, setSelectedAtrativoId] = useState<string>('');
  const [reservas, setReservas] = useState<ReservaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'todos' | StatusReserva>('todos');
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [reservaAlvo, setReservaAlvo] = useState<ReservaDto | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusReserva>('cancelada');

  const loadAtrativos = async () => {
    if (!user?.municipioId) return [];
    const data = await fetchAtrativos({ MunicipioId: user.municipioId, page: 1, pageSize: 300 });
    return data.map((a) => ({ id: a.id, nome: a.nome }));
  };

  const loadReservas = async (atrativoId: string) => {
    const list = await apiClient.listarReservasPorAtrativo(atrativoId);
    setReservas(list ?? []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const data = await loadAtrativos();
        setAtrativos(data);

        const atrativoUsuario = String(user?.atrativoId ?? '').trim();
        const initialAtrativo = atrativoUsuario || data[0]?.id || '';

        setSelectedAtrativoId(initialAtrativo);
        if (initialAtrativo) {
          await loadReservas(initialAtrativo);
        } else {
          setReservas([]);
        }
      } catch {
        toast({ title: 'Erro', description: 'Nao foi possivel carregar reservas.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user?.municipioId, user?.atrativoId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reservas
      .filter((r) => {
        const status = normalizeStatus(r.status);
        if (statusFilter !== 'todos' && status !== statusFilter) return false;

        if (!term) return true;

        const nome = String(r.nomeVisitante ?? '').toLowerCase();
        const token = String(r.token ?? '').toLowerCase();
        const cpf = String(r.cpf ?? '').toLowerCase();
        return nome.includes(term) || token.includes(term) || cpf.includes(term);
      })
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
  }, [reservas, statusFilter, search]);

  const handleTrocarAtrativo = async (atrativoId: string) => {
    setSelectedAtrativoId(atrativoId);
    setLoading(true);
    try {
      await loadReservas(atrativoId);
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel carregar reservas do atrativo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (reserva: ReservaDto, statusDestino: StatusReserva) => {
    setReservaAlvo(reserva);
    setNovoStatus(statusDestino);
    setMotivo('');
    setDialogOpen(true);
  };

  const confirmarAcao = async () => {
    if (!reservaAlvo || !motivo.trim()) return;
    setSaving(true);
    try {
      await atualizarStatusReservaGestao(reservaAlvo.id, {
        status: novoStatus,
        motivo: motivo.trim(),
      });
      toast({
        title: 'Reserva atualizada',
        description: `Status alterado para ${STATUS_LABEL[novoStatus].toLowerCase()}.`,
      });
      setDialogOpen(false);
      if (selectedAtrativoId) await loadReservas(selectedAtrativoId);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Nao foi possivel atualizar o status da reserva.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Gestao de Reservas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cancele, marque nao comparecimento ou reative reservas com motivo e rastreabilidade.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Atrativo</Label>
            <Select value={selectedAtrativoId} onValueChange={handleTrocarAtrativo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o atrativo" />
              </SelectTrigger>
              <SelectContent>
                {atrativos.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'todos' | StatusReserva)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(Object.keys(STATUS_LABEL) as StatusReserva[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Busca</Label>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-2.5" />
              <Input
                className="pl-8"
                placeholder="Nome, CPF ou token"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Reservas ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada para os filtros selecionados.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => {
                const status = normalizeStatus(r.status);
                return (
                  <div key={r.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{r.nomeVisitante || '-'}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.tipo === 'camping' ? 'Camping' : 'Day Use'} · {toDateBr(r.data)}{r.dataFim ? ` -> ${toDateBr(r.dataFim)}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">Token: <span className="font-mono">{r.token || '-'}</span></p>
                      </div>
                      <Badge className={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canCancel(status) && (
                        <Button size="sm" variant="destructive" onClick={() => openActionDialog(r, 'cancelada')}>
                          Cancelar
                        </Button>
                      )}
                      {canNoShow(status) && (
                        <Button size="sm" variant="secondary" onClick={() => openActionDialog(r, 'nao_compareceu')}>
                          Nao compareceu
                        </Button>
                      )}
                      {canReactivate(status) && (
                        <Button size="sm" onClick={() => openActionDialog(r, 'confirmada')}>
                          Reativar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alteracao de status</DialogTitle>
            <DialogDescription>
              Esta acao sera auditada. Informe o motivo para alterar a reserva para <strong>{STATUS_LABEL[novoStatus].toLowerCase()}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo-gestao">Motivo</Label>
            <Textarea
              id="motivo-gestao"
              rows={4}
              placeholder="Descreva o motivo da alteracao..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={confirmarAcao} disabled={saving || !motivo.trim()}>
              {saving ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

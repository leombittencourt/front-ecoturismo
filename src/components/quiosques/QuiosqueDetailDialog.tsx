import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Quiosque, QuiosqueStatus, STATUS_CONFIG } from './types';

function formatDateBr(value: string | null | undefined): string {
  if (!value) return '-';
  const raw = String(value).trim();
  if (!raw) return '-';

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('pt-BR');
}

interface Props {
  quiosque: Quiosque | null;
  onClose: () => void;
  isStaff: boolean;
  newStatus: QuiosqueStatus;
  onStatusChange: (s: QuiosqueStatus) => void;
  onSave: (updates: { status: QuiosqueStatus; numero: number; tem_churrasqueira: boolean }) => void;
  onDelete: () => void;
  onInativar: () => void;
  onDesvincularReservas: (motivo: string) => void;
  saving: boolean;
  dataConsulta: string;
  dataConsultaFim: string;
  reservaVinculada: Array<{
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
  }>;
  loadingReservaVinculada: boolean;
  canDelete: boolean;
  deleteBlockReason: string | null;
}

export function QuiosqueDetailDialog({
  quiosque,
  onClose,
  isStaff,
  newStatus,
  onStatusChange,
  onSave,
  onDelete,
  onInativar,
  onDesvincularReservas,
  saving,
  dataConsulta,
  dataConsultaFim,
  reservaVinculada,
  loadingReservaVinculada,
  canDelete,
  deleteBlockReason,
}: Props) {
  const [editNumero, setEditNumero] = useState(quiosque?.numero ?? 0);
  const [editChurrasqueira, setEditChurrasqueira] = useState(quiosque?.tem_churrasqueira ?? false);
  const [desvincularDialogOpen, setDesvincularDialogOpen] = useState(false);
  const [motivoDesvinculo, setMotivoDesvinculo] = useState('');

  useEffect(() => {
    if (quiosque) {
      setEditNumero(quiosque.numero);
      setEditChurrasqueira(quiosque.tem_churrasqueira);
      setMotivoDesvinculo('');
      setDesvincularDialogOpen(false);
    }
  }, [quiosque]);

  return (
    <Dialog open={!!quiosque} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quiosque {quiosque?.numero}</DialogTitle>
          <DialogDescription>
            {quiosque?.tem_churrasqueira ? '🔥 Com churrasqueira' : 'Sem churrasqueira'} — Status atual: {quiosque && STATUS_CONFIG[quiosque.status].label}
          </DialogDescription>
        </DialogHeader>
        {isStaff ? (
          <div className="space-y-4">
            {quiosque?.status === 'ocupado' && (
              <div className="rounded-lg border p-3 bg-muted/40 space-y-2">
                <p className="text-sm font-medium">
                  Reserva vinculada no periodo
                  <span className="text-muted-foreground font-normal"> {formatDateBr(dataConsulta)}{dataConsultaFim ? ` -> ${formatDateBr(dataConsultaFim)}` : ''}</span>
                </p>
                {loadingReservaVinculada ? (
                  <p className="text-xs text-muted-foreground">Carregando reserva vinculada...</p>
                ) : reservaVinculada.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma reserva vinculada para este quiosque no periodo.</p>
                ) : (
                  <div className="space-y-2">
                    {reservaVinculada.map((r) => (
                      <div key={r.id} className="rounded border bg-background p-2 text-xs space-y-1">
                        <p><strong>{r.nomeVisitante}</strong> · {r.quantidadePessoas} pessoa(s)</p>
                        <p>{r.tipo === 'camping' ? 'Camping' : 'Day Use'} · {formatDateBr(r.data)}{r.dataFim ? ` -> ${formatDateBr(r.dataFim)}` : ''}</p>
                        <p>Status: <strong>{r.statusDescricao || r.status}</strong></p>
                        <p className="font-mono">{r.token}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-numero">Numero</Label>
                <Input
                  id="edit-numero"
                  type="number"
                  min={1}
                  value={editNumero}
                  onChange={e => setEditNumero(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Churrasqueira</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={editChurrasqueira}
                    onCheckedChange={setEditChurrasqueira}
                  />
                  <span className="text-sm text-muted-foreground">
                    {editChurrasqueira ? '🔥 Sim' : 'Nao'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Alterar status</label>
              <Select value={newStatus} onValueChange={(v) => onStatusChange(v as QuiosqueStatus)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_CONFIG) as [QuiosqueStatus, typeof STATUS_CONFIG[QuiosqueStatus]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {!canDelete && deleteBlockReason && (
                <div className="rounded-md border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
                  {deleteBlockReason}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={saving || !canDelete}>
                      <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Quiosque {quiosque?.numero}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acao nao pode ser desfeita. O quiosque sera removido permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Confirmar Exclusao
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {!canDelete && (
                  <>
                    <Button variant="secondary" size="sm" onClick={onInativar} disabled={saving}>
                      Inativar
                    </Button>

                    <AlertDialog open={desvincularDialogOpen} onOpenChange={setDesvincularDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={saving}>
                          Desvincular reservas
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desvincular reservas do Quiosque {quiosque?.numero}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            As reservas permanecem validas, mas sem quiosque associado. Informe o motivo para auditoria.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="motivo-desvinculo">Motivo</Label>
                          <Textarea
                            id="motivo-desvinculo"
                            rows={3}
                            value={motivoDesvinculo}
                            onChange={(e) => setMotivoDesvinculo(e.target.value)}
                            placeholder="Ex.: Quiosque com inconsistencia operacional."
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={saving || !motivoDesvinculo.trim()}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!motivoDesvinculo.trim()) return;
                              onDesvincularReservas(motivoDesvinculo.trim());
                              setDesvincularDialogOpen(false);
                              setMotivoDesvinculo('');
                            }}
                          >
                            Confirmar desvinculo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
                <Button
                  size="sm"
                  onClick={() => onSave({ status: newStatus, numero: editNumero, tem_churrasqueira: editChurrasqueira })}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Apenas funcionarios podem alterar o status dos quiosques.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2, XCircle, Ticket, Users, ScanLine, Keyboard,
  Clock, Activity, AlertTriangle, CalendarCheck, MapPin, Tent,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLGPD } from '@/hooks/useLGPD';
import { LGPDBadge, LGPDBanner } from '@/components/LGPDBadge';
import { apiClient } from '@/services/apiClient';

interface ReservaDetalhes {
  id: string;
  nome_visitante: string;
  email: string;
  tipo: string;
  quantidade_pessoas: number;
  data: string;
  data_fim: string | null;
  status: string;
  status_descricao?: string;
  token: string;
  atrativo_nome: string;
}

interface ValidationLog {
  id: string;
  token: string;
  nome: string;
  tipo: string;
  quantidade: number;
  data: string;
  valido: boolean;
  motivo?: string;
  timestamp: Date;
}

function isReservaDoDia(value: unknown, hojeIso: string): boolean {
  const raw = String(value ?? "").trim();
  if (!raw) return false;

  if (raw.startsWith(hojeIso)) return true;

  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (brMatch) {
    const iso = `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
    return iso === hojeIso;
  }

  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  const iso = dt.toISOString().split('T')[0];
  return iso === hojeIso;
}

function getReservaStatusBadge(status: unknown, statusDescricao?: string) {
  const s = String(status ?? "").toLowerCase();
  const map: Record<string, { label: string; className: string }> = {
    confirmada: { label: "Confirmada", className: "bg-success text-success-foreground" },
    em_andamento: { label: "Em Andamento", className: "bg-primary/20 text-primary" },
    concluida: { label: "Concluida", className: "bg-muted text-muted-foreground" },
    cancelada: { label: "Cancelada", className: "bg-destructive/20 text-destructive" },
    validada: { label: "Validada", className: "bg-muted text-muted-foreground" },
    nao_compareceu: { label: "Nao Compareceu", className: "bg-warning/20 text-warning" },
  };
  const cfg = map[s] ?? { label: statusDescricao || "Pendente", className: "bg-secondary text-secondary-foreground" };
  return { label: statusDescricao || cfg.label, className: cfg.className };
}

/* ───── QR Scanner ───── */
function QrScanner({ onScan }: { onScan: (code: string) => void }) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => onScan(decodedText),
        () => {},
      );
      setActive(true);
      setError(null);
    } catch {
      setError('Câmera não disponível. Use a entrada manual.');
    }
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
      setActive(false);
    }
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  return (
    <div className="space-y-3">
      <div
        id="qr-reader"
        ref={scannerRef}
        className="w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-muted/30 min-h-[280px] flex items-center justify-center"
      >
        {!active && !error && (
          <div className="text-center p-6">
            <ScanLine className="h-12 w-12 mx-auto text-primary/40 mb-3" />
            <p className="text-sm text-muted-foreground">Clique para ativar a câmera</p>
          </div>
        )}
        {error && (
          <div className="text-center p-6">
            <AlertTriangle className="h-10 w-10 mx-auto text-warning mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-2">
        {!active ? (
          <Button onClick={startScanner} variant="outline" size="sm">
            <ScanLine className="h-4 w-4 mr-2" /> Ativar Câmera
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="outline" size="sm">
            Parar Scanner
          </Button>
        )}
      </div>
    </div>
  );
}

/* ───── Validation Result with full details ───── */
function ValidationResult({ result, maskName }: {
  result: { valido: boolean; motivo?: string; reserva?: ReservaDetalhes } | null;
  maskName: (name: string) => string;
}) {
  if (!result) return null;

  return (
    <div className={`p-6 rounded-lg text-center transition-all animate-fade-in ${
      result.valido
        ? 'bg-success/10 border border-success/30'
        : 'bg-destructive/10 border border-destructive/30'
    }`}>
      {result.valido && result.reserva ? (
        <>
          <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-3" />
          <p className="text-xl font-heading font-bold text-success mb-4">Entrada Liberada!</p>
          <div className="grid grid-cols-2 gap-3 text-sm max-w-sm mx-auto text-left">
            <div className="flex items-center gap-2 col-span-2">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{maskName(result.reserva.nome_visitante)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tent className="h-4 w-4 text-primary shrink-0" />
              <span>{result.reserva.tipo === 'camping' ? 'Camping' : 'Day Use'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <span>{result.reserva.quantidade_pessoas} pessoa(s)</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
              <span>
                {result.reserva.tipo === 'camping' && result.reserva.data_fim
                  ? `${result.reserva.data} → ${result.reserva.data_fim}`
                  : result.reserva.data}
              </span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{result.reserva.atrativo_nome}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <XCircle className="h-16 w-16 mx-auto text-destructive mb-2" />
          <p className="text-xl font-heading font-bold text-destructive">
            {result.motivo === 'utilizada' ? 'Ticket Já Utilizado' : 'Ticket Inválido'}
          </p>
          <p className="text-muted-foreground mt-1">
            {result.motivo === 'utilizada'
              ? 'Este ticket já foi validado anteriormente e não pode ser reutilizado.'
              : result.motivo === 'cancelada'
                ? 'Esta reserva foi cancelada.'
                : 'Token não encontrado no sistema.'}
          </p>
        </>
      )}
    </div>
  );
}

/* ───── Main Page ───── */
export default function Balneario() {
  const { user } = useAuth();
  const { canSeePII, maskName, isPrefeitura } = useLGPD();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ valido: boolean; motivo?: string; reserva?: ReservaDetalhes } | null>(null);
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [tab, setTab] = useState('scanner');
  const [reservasHoje, setReservasHoje] = useState<ReservaDetalhes[]>([]);
  const [stats, setStats] = useState<{
    validadas: number | null;
    recusadas: number | null;
    pendentes: number | null;
    totalReservasDia: number | null;
    ocupacao: number;
    capacidade: number;
    atrativoNome: string;
  }>({ validadas: null, recusadas: null, pendentes: null, totalReservasDia: null, ocupacao: 0, capacidade: 0, atrativoNome: '' });

    const hoje = new Date().toISOString().split('T')[0];
  const atrativoId = String(user?.atrativoId ?? '').trim();

  const fetchReservasHoje = useCallback(async () => {
    if (!atrativoId) {
      setReservasHoje([]);
      setStats(prev => ({ ...prev, ocupacao: 0, capacidade: 0, atrativoNome: '' }));
      return;
    }

    try {
      const [painel, atrativo] = await Promise.all([
        apiClient.obterPainelValidacao(atrativoId, hoje, true),
        apiClient.obterAtrativo(atrativoId),
      ]);

      const atrativoNome =
        painel?.nomeAtrativo ??
        painel?.NomeAtrativo ??
        painel?.atrativoNome ??
        painel?.AtrativoNome ??
        atrativo?.nome ??
        'Atrativo';
      const reservasFonte = (
        painel?.reservasDoDia ??
        painel?.ReservasDoDia ??
        painel?.reservas ??
        painel?.Reservas ??
        []
      ) as any[];
      const reservasDoDia: ReservaDetalhes[] = reservasFonte
        .filter((r: any) => isReservaDoDia(r.data ?? painel?.data ?? painel?.Data ?? hoje, hoje))
        .map((r: any) => ({
          id: r.id,
          nome_visitante: r.nomeVisitante ?? r.nome_visitante ?? '-',
          email: r.email ?? '',
          tipo: r.tipo ?? 'day_use',
          quantidade_pessoas: r.quantidadePessoas ?? r.quantidade_pessoas ?? 1,
          data: r.data ?? painel?.data ?? painel?.Data ?? hoje,
          data_fim: r.dataFim ?? r.data_fim ?? null,
          status: r.status ?? 'confirmada',
          status_descricao: r.statusDescricao ?? r.status_descricao,
          token: r.token ?? '',
          atrativo_nome: atrativoNome,
        }));

      setReservasHoje(reservasDoDia);
      setStats(prev => ({
        ...prev,
        validadas: painel?.validadas ?? painel?.Validadas ?? null,
        recusadas: painel?.recusadas ?? painel?.Recusadas ?? null,
        pendentes: painel?.pendentes ?? painel?.Pendentes ?? null,
        totalReservasDia: painel?.totalReservasDia ?? painel?.TotalReservasDia ?? reservasDoDia.length,
        ocupacao: painel?.ocupacao ?? painel?.Ocupacao ?? painel?.ocupacaoAtual ?? painel?.OcupacaoAtual ?? atrativo?.ocupacaoAtual ?? 0,
        capacidade: painel?.capacidade ?? painel?.Capacidade ?? painel?.capacidadeMaxima ?? painel?.CapacidadeMaxima ?? atrativo?.capacidadeMaxima ?? 0,
        atrativoNome,
      }));
    } catch {
      setReservasHoje([]);
      setStats(prev => ({ ...prev, ocupacao: 0, capacidade: 0 }));
    }
  }, [atrativoId, hoje]);

  useEffect(() => {
    fetchReservasHoje();
    const timer = window.setInterval(fetchReservasHoje, 30000);
    return () => window.clearInterval(timer);
  }, [fetchReservasHoje]);

  const pctOcupacao = stats.capacidade > 0
    ? Math.round((stats.ocupacao / stats.capacidade) * 100)
    : 0;

  const validadas = stats.validadas ?? logs.filter(l => l.valido).length;
  const pendentes = stats.pendentes ?? reservasHoje.filter(r => String(r.status).toLowerCase() === 'confirmada').length;
  const totalReservasDia = stats.totalReservasDia ?? reservasHoje.length;

  const handleValidar = useCallback(async (inputToken: string) => {
    const cleanToken = inputToken.trim().toUpperCase();
    if (!cleanToken || loading) return;
    setLoading(true);

    try {
      const response = await apiClient.validarTicket({
        Token: cleanToken,
        AtrativoId: atrativoId || null,
      });

      const valido = response?.valido ?? response?.isValid ?? false;
      const reserva = (response as any)?.reserva;

      if (!valido || !reserva?.id) {
        const mensagem = ((response as any)?.mensagem ?? '').toString().toLowerCase();
        const motivo = mensagem.includes('utilizado') ? 'utilizada' : 'nao_encontrado';

        setResult({ valido: false, motivo });
        setLogs(prev => [{
          id: String(Date.now()),
          token: cleanToken,
          nome: 'Desconhecido',
          tipo: '-',
          quantidade: 0,
          data: '-',
          valido: false,
          motivo,
          timestamp: new Date(),
        }, ...prev].slice(0, 50));
      } else {
        const detalhes: ReservaDetalhes = {
          id: reserva.id,
          nome_visitante: reserva.nomeVisitante ?? reserva.nome_visitante ?? '-',
          email: reserva.email ?? '',
          tipo: reserva.tipo ?? 'day_use',
          quantidade_pessoas: reserva.quantidadePessoas ?? reserva.quantidade_pessoas ?? 1,
          data: reserva.data ?? '',
          data_fim: reserva.dataFim ?? reserva.data_fim ?? null,
          status: reserva.status ?? 'utilizada',
          token: reserva.token ?? cleanToken,
          atrativo_nome: stats.atrativoNome || 'Atrativo',
        };

        setResult({ valido: true, reserva: detalhes });
        setLogs(prev => [{
          id: String(Date.now()),
          token: cleanToken,
          nome: detalhes.nome_visitante,
          tipo: detalhes.tipo,
          quantidade: detalhes.quantidade_pessoas,
          data: detalhes.data,
          valido: true,
          timestamp: new Date(),
        }, ...prev].slice(0, 50));
      }
    } catch {
      setResult({ valido: false, motivo: 'erro' });
    }

    setToken('');
    setLoading(false);
    setTimeout(() => setResult(null), 5000);
  }, [atrativoId, loading, stats.atrativoNome]);

  const handleManualSubmit = () => handleValidar(token);
  const handleQrScan = useCallback((code: string) => handleValidar(code), [handleValidar]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-heading font-bold">Painel de Validação</h1>
        <div className="flex items-center gap-2">
          <LGPDBadge isAnonymized={isPrefeitura} />
          <Badge className="bg-success/20 text-success border border-success/30 gap-1">
            <Activity className="h-3 w-3" /> Atualizacao automatica
          </Badge>
        </div>
      </div>

      {isPrefeitura && <LGPDBanner />}

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Atrativo</p>
            <p className="text-sm font-heading font-bold mt-1 truncate">{stats.atrativoNome || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Ocupação</p>
            <p className="text-2xl font-heading font-bold mt-1">{pctOcupacao}%</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.ocupacao} / {stats.capacidade}</p>
            <div className="w-full bg-muted rounded-full h-2 mt-1.5">
              <div
                className={`h-2 rounded-full transition-all ${pctOcupacao >= 90 ? 'bg-destructive' : pctOcupacao >= 70 ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, pctOcupacao)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Validadas</p>
            <p className="text-2xl font-heading font-bold text-success mt-1">{validadas}</p>
            <p className="text-xs text-muted-foreground mt-1">{validadas} / {totalReservasDia}</p>
          </CardContent>
        </Card>
        {/* <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Recusadas</p>
            <p className="text-2xl font-heading font-bold text-destructive mt-1">{recusadas}</p>
          </CardContent>
        </Card> */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-heading font-bold text-warning mt-1">{pendentes}</p>
            <p className="text-xs text-muted-foreground mt-1">{pendentes} / {totalReservasDia}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main validation area */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Validar Ingresso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="scanner" className="gap-2">
                  <ScanLine className="h-4 w-4" /> QR Code
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Keyboard className="h-4 w-4" /> Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scanner" className="mt-4">
                <QrScanner onScan={handleQrScan} />
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <div className="flex gap-3 max-w-md mx-auto">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="token">Token do visitante</Label>
                    <Input
                      id="token"
                      value={token}
                      onChange={e => setToken(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                      placeholder="ECO-XXXXXX"
                      className="text-center text-lg tracking-wider font-mono"
                    />
                  </div>
                  <Button onClick={handleManualSubmit} disabled={loading || !token} className="self-end">
                    {loading ? 'Validando...' : 'Validar'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <ValidationResult result={result} maskName={maskName} />
          </CardContent>
        </Card>

        {/* Activity log with expanded details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Nenhuma validação realizada ainda.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-lg text-sm ${log.valido ? 'bg-success/5 border border-success/20' : 'bg-destructive/5 border border-destructive/20'}`}
                  >
                    <div className="flex items-center gap-2">
                      {log.valido ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium truncate flex-1">{maskName(log.nome)}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {log.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="mt-1 ml-6 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{log.token}</span>
                      {log.valido && (
                        <>
                          <span>{log.tipo === 'camping' ? 'Camping' : 'Day Use'}</span>
                          <span>{log.quantidade}p</span>
                        </>
                      )}
                      {log.motivo === 'utilizada' && (
                        <span className="text-destructive font-medium">Já utilizado</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reservas do dia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Reservas de Hoje
            <Badge variant="outline" className="ml-auto">{totalReservasDia} reservas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservasHoje.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma reserva para hoje.</p>
          ) : (
            <div className="space-y-2">
              {reservasHoje.map(r => (
                <div key={r.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-muted/50">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{maskName(r.nome_visitante)}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.tipo === 'day_use' ? 'Day Use' : 'Camping'} · {r.quantidade_pessoas} pessoa(s) · {r.data}
                      {r.tipo === 'camping' && r.data_fim ? ` → ${r.data_fim}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] sm:text-xs bg-card px-2 py-1 rounded font-mono">{r.token}</code>
                    {(() => {
                      const cfg = getReservaStatusBadge(r.status, r.status_descricao);
                      return <Badge className={cfg.className}>{cfg.label}</Badge>;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


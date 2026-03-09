import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeSVG } from 'qrcode.react';
import { Trees, CheckCircle2, XCircle, AlertTriangle, CalendarCheck, Users, MapPin, Home, Flame } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface TicketData {
  nome_visitante: string;
  email: string;
  data: string;
  data_fim: string | null;
  tipo: string;
  quantidade_pessoas: number;
  status: string;
  token: string;
  atrativo_nome: string;
  quiosque_numero: number | null;
  quiosque_churrasqueira: boolean;
}

export default function TicketPublico() {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let ativo = true;

    const carregarTicket = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const data = await apiClient.obterTicketPublico(token.trim().toUpperCase());
        if (!ativo) return;

        setTicket({
          nome_visitante: String(data.nomeVisitante ?? data.NomeVisitante ?? ''),
          email: String(data.email ?? data.Email ?? ''),
          data: String(data.data ?? data.Data ?? ''),
          data_fim: (data.dataFim ?? data.DataFim ?? null) as string | null,
          tipo: String(data.tipo ?? data.Tipo ?? 'day_use'),
          quantidade_pessoas: Number(data.quantidadePessoas ?? data.QuantidadePessoas ?? 1),
          status: String(data.status ?? data.Status ?? 'confirmada'),
          token: String(data.token ?? data.Token ?? token),
          atrativo_nome: String(data.atrativoNome ?? data.AtrativoNome ?? 'Atrativo'),
          quiosque_numero: data.quiosqueNumero ?? data.QuiosqueNumero ?? null,
          quiosque_churrasqueira: Boolean(data.quiosqueChurrasqueira ?? data.QuiosqueChurrasqueira ?? false),
        });
      } catch (error: any) {
        if (!ativo) return;

        const status = Number(error?.status ?? 0);
        if (status === 404) {
          setNotFound(true);
        } else {
          setNotFound(true);
          console.error('Erro ao carregar ticket público', error);
        }
      } finally {
        if (ativo) setLoading(false);
      }
    };

    carregarTicket();

    return () => {
      ativo = false;
    };
  }, [token]);

  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    confirmada: { label: 'Confirmado', icon: CheckCircle2, color: 'bg-success text-success-foreground' },
    utilizada: { label: 'J\u00e1 Utilizado', icon: AlertTriangle, color: 'bg-destructive text-destructive-foreground' },
    cancelada: { label: 'Cancelado', icon: XCircle, color: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      <nav className="px-4 py-4 flex items-center justify-center gap-3 border-b border-border bg-card">
        <Trees className="h-6 w-6 text-primary" />
        <span className="font-heading font-bold text-foreground">EcoTurismo</span>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <Skeleton className="h-96 w-full max-w-md rounded-xl" />
        ) : notFound ? (
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-8 space-y-4">
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
              <h2 className="text-xl font-heading font-bold">Ticket n\u00e3o encontrado</h2>
              <p className="text-muted-foreground text-sm">O token informado n\u00e3o corresponde a nenhuma reserva.</p>
              <Link to="/reservar">
                <Button variant="outline">Fazer nova reserva</Button>
              </Link>
            </CardContent>
          </Card>
        ) : ticket ? (
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-6">
              {(() => {
                const cfg = statusConfig[ticket.status] || statusConfig.confirmada;
                const Icon = cfg.icon;
                return (
                  <div className="text-center space-y-2">
                    <Badge className={`${cfg.color} text-sm px-4 py-1`}>
                      <Icon className="h-4 w-4 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })()}

              {ticket.status !== 'cancelada' && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl shadow-md">
                    <QRCodeSVG value={ticket.token} size={180} level="H" />
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{ticket.nome_visitante}</p>
                    <p className="text-muted-foreground">{ticket.quantidade_pessoas} pessoa(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <p className="font-medium text-foreground">{ticket.atrativo_nome}</p>
                </div>
                {ticket.quiosque_numero !== null && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Home className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">Quiosque #{ticket.quiosque_numero}</p>
                      {ticket.quiosque_churrasqueira && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Flame className="h-3 w-3" />
                          Churrasqueira
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">
                      {ticket.tipo === 'camping' && ticket.data_fim ? `${ticket.data} \u2192 ${ticket.data_fim}` : ticket.data}
                    </p>
                    <p className="text-muted-foreground">{ticket.tipo === 'camping' ? 'Camping' : 'Day Use'}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <code className="text-lg font-mono font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg">
                  {ticket.token}
                </code>
              </div>

              {ticket.status === 'utilizada' && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                  <p className="text-sm font-medium text-destructive">Este ticket j\u00e1 foi utilizado anteriormente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeSVG } from 'qrcode.react';
import { Trees, CheckCircle2, XCircle, AlertTriangle, CalendarCheck, Users, MapPin, Home, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';  
import { apiClient } from "@/services/apiClient";

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
  apiClient.health()
    .then((x) => console.log("health()", x))
    .catch((e) => console.error("health() erro", e));
}, []);

  useEffect(() => {
    if (!token) return;
    supabase
      .from('reservas')
      .select('nome_visitante, email, data, data_fim, tipo, quantidade_pessoas, status, token, atrativos(nome), quiosques(numero, tem_churrasqueira)')
      .eq('token', token)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setTicket({
            nome_visitante: data.nome_visitante,
            email: data.email,
            data: data.data,
            data_fim: data.data_fim,
            tipo: data.tipo,
            quantidade_pessoas: data.quantidade_pessoas,
            status: data.status,
            token: data.token,
            atrativo_nome: (data as any).atrativos?.nome || 'Atrativo',
            quiosque_numero: (data as any).quiosques?.numero ?? null,
            quiosque_churrasqueira: (data as any).quiosques?.tem_churrasqueira ?? false,
          });
        }
        setLoading(false);
      });
  }, [token]);

  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    confirmada: { label: 'Confirmado', icon: CheckCircle2, color: 'bg-success text-success-foreground' },
    utilizada: { label: 'Já Utilizado', icon: AlertTriangle, color: 'bg-destructive text-destructive-foreground' },
    cancelada: { label: 'Cancelado', icon: XCircle, color: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Header */}
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
              <h2 className="text-xl font-heading font-bold">Ticket não encontrado</h2>
              <p className="text-muted-foreground text-sm">O token informado não corresponde a nenhuma reserva.</p>
              <Link to="/reservar">
                <Button variant="outline">Fazer nova reserva</Button>
              </Link>
            </CardContent>
          </Card>
        ) : ticket ? (
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-6">
              {/* Status badge */}
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

              {/* QR Code */}
              {ticket.status !== 'cancelada' && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl shadow-md">
                    <QRCodeSVG value={ticket.token} size={180} level="H" />
                  </div>
                </div>
              )}

              {/* Details */}
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
                      {ticket.tipo === 'camping' && ticket.data_fim
                        ? `${ticket.data} → ${ticket.data_fim}`
                        : ticket.data}
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
                  <p className="text-sm font-medium text-destructive">Este ticket já foi utilizado anteriormente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import PublicPageHeader from '@/components/PublicPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Ticket, Search } from 'lucide-react';

export default function ConsultarTicket() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = token.trim().toUpperCase();
    if (!normalized) return;
    navigate(`/ticket/${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Consultar Ticket - EcoTurismo"
        description="Consulte o ticket da sua reserva informando o token gerado no momento da confirmação."
      />

      <PublicPageHeader
        title="Consultar ticket"
        subtitle="Informe o token da reserva para visualizar seu ticket novamente."
      />

      <section className="max-w-3xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Localizar ticket
              </h2>
              <p className="text-sm text-muted-foreground">
                Digite o token recebido no final da reserva (ex.: `AB12CD34EF56`).
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="Digite o token da reserva"
                className="font-mono tracking-wider"
              />
              <Button type="submit" className="w-full sm:w-auto" disabled={!token.trim()}>
                <Search className="mr-2 h-4 w-4" />
                Consultar ticket
              </Button>
            </form>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Ainda não fez uma reserva?{' '}
                <Link to="/reservar" className="text-primary font-medium hover:underline">
                  Fazer reserva
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

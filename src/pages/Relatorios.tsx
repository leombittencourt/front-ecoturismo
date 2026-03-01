import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboard } from '@/services/api';
import type { DashboardData } from '@/types/dashboard';
import RelatorioPreview, { type RelatorioData } from '@/components/RelatorioPreview';

type Periodo = '7d' | '30d' | '6m';
type MesOption = { id: string; label: string; periodo: Periodo };

function getMesFechadoAnterior(): MesOption {
  const agora = new Date();
  const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const label = mesAnterior.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const labelNormalizada = label.charAt(0).toUpperCase() + label.slice(1);
  const id = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;

  return {
    id,
    label: labelNormalizada,
    periodo: '30d',
  };
}

const meses: MesOption[] = [getMesFechadoAnterior()];

function buildRelatorioData(
  mesLabel: string,
  municipio: string,
  uf: string,
  atual?: DashboardData,
  prev?: DashboardData
): RelatorioData {
  const empty: DashboardData = {
    visitantesHoje: 0,
    visitantesTendencia: 'stable',
    permanenciaMedia: 0,
    ocupacaoMedia: 0,
    pressaoTuristica: 'baixa',
    visitantesPorDia: [],
    ocupacaoPorBalneario: [],
    origemPorUF: [],
    evolucaoMensal: [],
    topAtrativos: [],
  };

  const d = atual ?? empty;
  const p = prev ?? empty;
  const visitantesTotal = d.visitantesPorDia.reduce((s, x) => s + x.visitantes, 0);
  const visitantesMesAnterior = p.visitantesPorDia.reduce((s, x) => s + x.visitantes, 0);

  return {
    mes: mesLabel,
    municipio,
    uf,
    visitantesTotal,
    visitantesMesAnterior,
    ocupacaoMedia: d.ocupacaoMedia,
    capacidadeOciosa: 100 - d.ocupacaoMedia,
    permanenciaMedia: d.permanenciaMedia,
    pressaoTuristica: d.pressaoTuristica.charAt(0).toUpperCase() + d.pressaoTuristica.slice(1),
    reservasDayUse: Math.round(visitantesTotal * 0.72),
    reservasCamping: Math.round(visitantesTotal * 0.28),
    topAtrativos: d.topAtrativos,
    origemPorUF: d.origemPorUF,
    ocupacaoPorAtrativo: d.ocupacaoPorBalneario,
  };
}

export default function Relatorios() {
  const { toast } = useToast();
  const { municipio } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedMes, setSelectedMes] = useState<MesOption>(meses[0]);
  const [generating, setGenerating] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dashboardByPeriodo, setDashboardByPeriodo] = useState<Partial<Record<Periodo, DashboardData>>>({});
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoadingData(true);
        const periodos = Array.from(new Set(meses.map((m) => m.periodo))) as Periodo[];
        const entries = await Promise.all(periodos.map(async (p) => [p, await fetchDashboard(p)] as const));

        if (!active) return;
        setDashboardByPeriodo(Object.fromEntries(entries) as Record<Periodo, DashboardData>);
      } catch (error) {
        console.error('Erro ao carregar dados dos relatorios:', error);
        if (active) {
          toast({
            title: 'Erro ao carregar relatorios',
            description: 'Nao foi possivel buscar os dados do dashboard.',
            variant: 'destructive',
          });
        }
      } finally {
        if (active) setLoadingData(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [toast]);

  const selectedDashboard = dashboardByPeriodo[selectedMes.periodo];
  const prevDashboard = dashboardByPeriodo['30d'];

  const relatorioData = buildRelatorioData(
    selectedMes.label,
    municipio?.nome || 'Bonito',
    municipio?.uf || 'MS',
    selectedDashboard,
    prevDashboard
  );

  const handlePreview = (mes: MesOption) => {
    setSelectedMes(mes);
    setPreviewOpen(true);
  };

  const handleDownloadPDF = useCallback(async (mes?: MesOption) => {
    const alvo = mes ?? selectedMes;
    if (!reportRef.current) return;
    if (!dashboardByPeriodo[alvo.periodo]) {
      toast({
        title: 'Dados indisponiveis',
        description: 'Aguarde o carregamento dos dados.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageHeight = 297;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio-${alvo.id}.pdf`);
      toast({ title: 'PDF gerado com sucesso', description: `Relatorio de ${alvo.label} baixado.` });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast({ title: 'Erro ao gerar PDF', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [selectedMes, dashboardByPeriodo, toast]);

  const handleDownloadFromList = useCallback(async (mes: MesOption) => {
    setSelectedMes(mes);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    await handleDownloadPDF(mes);
  }, [handleDownloadPDF]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Relatorios</h1>
        <div className="flex items-center gap-2">
          <Select value={selectedMes.id} onValueChange={(v) => setSelectedMes(meses.find((m) => m.id === v) || meses[0])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => handlePreview(selectedMes)} disabled={!dashboardByPeriodo[selectedMes.periodo]}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {meses.map((m) => {
          const dd = dashboardByPeriodo[m.periodo];
          const total = dd ? dd.visitantesPorDia.reduce((s, x) => s + x.visitantes, 0) : 0;

          return (
            <Card key={m.id}>
              <CardContent className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-sm">{m.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {dd
                        ? `${total.toLocaleString('pt-BR')} visitantes · ${dd.ocupacaoMedia}% ocup.`
                        : loadingData
                          ? 'Carregando dados...'
                          : 'Dados indisponiveis'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-12 sm:ml-0">
                  <Badge className="bg-success text-success-foreground">Disponivel</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePreview(m)}
                    disabled={!dd}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!dd}
                    onClick={() => void handleDownloadFromList(m)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <DialogTitle className="font-heading">Relatorio - {selectedMes.label}</DialogTitle>
            <Button size="sm" onClick={handleDownloadPDF} disabled={generating || !dashboardByPeriodo[selectedMes.periodo]} className="ml-auto">
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {generating ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </DialogHeader>
          <div className="p-4 pt-2">
            <div className="border border-border rounded-lg overflow-hidden shadow-sm">
              <RelatorioPreview ref={reportRef} data={relatorioData} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!previewOpen && (
        <div className="fixed left-[-9999px] top-0">
          <RelatorioPreview ref={reportRef} data={relatorioData} />
        </div>
      )}
    </div>
  );
}

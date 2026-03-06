import { useEffect, useState } from "react";
import { apiClient, ConfiguracoesDto } from "@/services/apiClient";

export interface Configuracoes {
  logo_login: string | null;
  logo_publica: string | null;
  nome_sistema: string;
  sobre_ecoturismo_titulo: string;
  sobre_ecoturismo_texto_1: string;
  sobre_ecoturismo_texto_2: string;
  footer_texto: string;
  footer_links: { label: string; url: string }[];
  banner_largura: string;
  banner_altura: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_accent: string;
  cor_sidebar_bg: string;
  cor_sucesso: string;
  cor_warning: string;
}

const DEFAULTS: Configuracoes = {
  logo_login: null,
  logo_publica: null,
  nome_sistema: "EcoTurismo",
  sobre_ecoturismo_titulo: "Sobre o Ecoturismo no Municipio",
  sobre_ecoturismo_texto_1:
    "Rio Verde de Mato Grosso fortalece o turismo de natureza com experiencias seguras, acolhimento local e valorizacao do patrimonio ambiental. O municipio promove visitas responsaveis, conectando lazer, cultura regional e conservacao dos recursos naturais.",
  sobre_ecoturismo_texto_2:
    "A sustentabilidade e um eixo central da gestao turistica, com foco em uso consciente dos atrativos, preservacao de fauna e flora e incentivo ao desenvolvimento economico local de forma equilibrada.",
  footer_texto: "Plataforma de Gestão Inteligente do Ecoturismo Municipal",
  footer_links: [],
  banner_largura: "1200",
  banner_altura: "400",
  cor_primaria: "120 56% 24%",
  cor_secundaria: "120 40% 35%",
  cor_accent: "204 98% 37%",
  cor_sidebar_bg: "120 20% 12%",
  cor_sucesso: "120 40% 44%",
  cor_warning: "45 100% 51%",
};

const CONFIGS_UPDATED_EVENT = "ecoturismo:configs-updated";

export function useConfiguracoes() {
  const [configs, setConfigs] = useState<Configuracoes>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    setLoading(true);

    try {
      const data = await apiClient.getConfiguracoes();

      const map: Record<string, string | null> = {};
      (data ?? []).forEach((row: ConfiguracoesDto) => {
        map[row.chave] = row.valor;
      });

      setConfigs({
        logo_login: map.logo_login || null,
        logo_publica: map.logo_publica || null,
        nome_sistema: map.nome_sistema || DEFAULTS.nome_sistema,
        sobre_ecoturismo_titulo:
          map.sobre_ecoturismo_titulo || DEFAULTS.sobre_ecoturismo_titulo,
        sobre_ecoturismo_texto_1:
          map.sobre_ecoturismo_texto_1 || DEFAULTS.sobre_ecoturismo_texto_1,
        sobre_ecoturismo_texto_2:
          map.sobre_ecoturismo_texto_2 || DEFAULTS.sobre_ecoturismo_texto_2,
        footer_texto: map.footer_texto || DEFAULTS.footer_texto,
        footer_links: parseLinks(map.footer_links),
        banner_largura: map.banner_largura || DEFAULTS.banner_largura,
        banner_altura: map.banner_altura || DEFAULTS.banner_altura,
        cor_primaria: map.cor_primaria || DEFAULTS.cor_primaria,
        cor_secundaria: map.cor_secundaria || DEFAULTS.cor_secundaria,
        cor_accent: map.cor_accent || DEFAULTS.cor_accent,
        cor_sidebar_bg: map.cor_sidebar_bg || DEFAULTS.cor_sidebar_bg,
        cor_sucesso: map.cor_sucesso || DEFAULTS.cor_sucesso,
        cor_warning: map.cor_warning || DEFAULTS.cor_warning,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onConfigsUpdated = () => {
      fetchConfigs();
    };
    window.addEventListener(CONFIGS_UPDATED_EVENT, onConfigsUpdated);
    return () => window.removeEventListener(CONFIGS_UPDATED_EVENT, onConfigsUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateConfig = async (chave: string, valor: string | null) => {
    try {
      await apiClient.putConfiguracoes([{ chave, valor }]); // <- REUSO
      await fetchConfigs();
      window.dispatchEvent(new Event(CONFIGS_UPDATED_EVENT));
      return null;
    } catch (error) {
      return error;
    }
  };

  const updateConfigs = async (updates: { chave: string; valor: string | null }[]) => {
    const errors: any[] = [];
    try {
      await apiClient.putConfiguracoes(updates); // <- REUSO
      window.dispatchEvent(new Event(CONFIGS_UPDATED_EVENT));
    } catch (error) {
      errors.push(error);
    }
    await fetchConfigs();
    return errors;
  };

  return { configs, loading, updateConfig, updateConfigs, refetch: fetchConfigs };
}

function parseLinks(val: string | null | undefined): { label: string; url: string }[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

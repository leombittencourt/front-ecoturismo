export type AtrativoDescricaoDetalhada = {
  oQueE: string;
  experiencia: string;
  historia: string;
  sustentabilidade: string;
};

const DESCRICAO_PREFIX = '__DETALHADA_JSON__:';

function sanitize(value: unknown): string {
  return String(value ?? '').trim();
}

function toDetalhada(value: unknown): AtrativoDescricaoDetalhada | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;
  const detalhada: AtrativoDescricaoDetalhada = {
    oQueE: sanitize(obj.oQueE ?? obj.o_que_e ?? obj.OQueE ?? obj.oquee),
    experiencia: sanitize(obj.experiencia ?? obj.Experiencia),
    historia: sanitize(obj.historia ?? obj.Historia),
    sustentabilidade: sanitize(obj.sustentabilidade ?? obj.Sustentabilidade),
  };

  if (!detalhada.oQueE && !detalhada.experiencia && !detalhada.historia && !detalhada.sustentabilidade) {
    return undefined;
  }

  return detalhada;
}

export function normalizarDescricaoDetalhada(input?: Partial<AtrativoDescricaoDetalhada> | null): AtrativoDescricaoDetalhada {
  return {
    oQueE: sanitize(input?.oQueE),
    experiencia: sanitize(input?.experiencia),
    historia: sanitize(input?.historia),
    sustentabilidade: sanitize(input?.sustentabilidade),
  };
}

export function serializarDescricaoDetalhada(input?: Partial<AtrativoDescricaoDetalhada> | null): string {
  const detalhada = normalizarDescricaoDetalhada(input);
  if (!detalhada.oQueE && !detalhada.experiencia && !detalhada.historia && !detalhada.sustentabilidade) return '';
  return `${DESCRICAO_PREFIX}${JSON.stringify(detalhada)}`;
}

export function parseDescricaoAtrativo(value: unknown): { resumo: string; detalhada?: AtrativoDescricaoDetalhada } {
  const raw = String(value ?? '').trim();
  if (!raw) return { resumo: '' };

  if (raw.startsWith(DESCRICAO_PREFIX)) {
    try {
      const parsed = JSON.parse(raw.slice(DESCRICAO_PREFIX.length));
      const detalhada = toDetalhada(parsed);
      if (detalhada) return { resumo: detalhada.oQueE || '', detalhada };
    } catch {
      // fallback para resumo simples
    }
    return { resumo: '' };
  }

  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      const detalhada = toDetalhada(parsed);
      if (detalhada) return { resumo: detalhada.oQueE || '', detalhada };
    } catch {
      // nao e JSON valido
    }
  }

  return { resumo: raw };
}

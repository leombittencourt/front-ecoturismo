export interface PublicAtrativo {
  slug: string;
  nome: string;
  municipio: string;
  categoria: string;
  imagemUrl: string;
  ocupacaoAtual: string;
  mediaUrl: string;
  videoUrl?: string;
  mapUrl?: string;
  descricao: {
    oQueE: string;
    experiencia: string;
    historia: string;
    sustentabilidade: string;
  };
  tecnico: {
    capacidadeTotal: string;
    horarios: string;
    regras: string[];
    oQueLevar: string[];
    dificuldade?: string;
  };
}

export function slugifyAtrativo(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const PUBLIC_ATRATIVOS: PublicAtrativo[] = [
  {
    slug: 'balneario-e-pousada-7-quedas',
    nome: 'Balneário e Pousada 7 Quedas',
    municipio: 'Rio Verde de Mato Grosso - MS',
    categoria: 'Balneário',
    imagemUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    ocupacaoAtual: 'Consulte disponibilidade',
    mediaUrl: 'https://www.7quedasdodidi.com.br',
    videoUrl: 'https://www.youtube.com/embed/Scxs7L0vhZ4',
    mapUrl: 'https://maps.google.com/maps?q=Rodovia%20MS-427%20km%207%20Rio%20Verde%20de%20Mato%20Grosso&t=&z=13&ie=UTF8&iwloc=&output=embed',
    descricao: {
      oQueE:
        'Atrativo de natureza com estrutura de hospedagem e day-use, ideal para famílias e visitantes em busca de descanso.',
      experiencia:
        'Banho em águas naturais, trilhas leves e atividades de aventura em meio à paisagem típica da região.',
      historia:
        'Consolidado como um dos destinos mais conhecidos do município, integra turismo de lazer e valorização do território local.',
      sustentabilidade:
        'Operação orientada por uso responsável dos recursos naturais e incentivo à preservação dos ambientes de visitação.',
    },
    tecnico: {
      capacidadeTotal: 'Capacidade controlada por período',
      horarios: 'Consulte horários de day-use e hospedagem no canal oficial',
      regras: [
        'Respeitar sinalizações e áreas de segurança',
        'Não descartar resíduos no ambiente',
        'Seguir orientações da equipe local',
      ],
      oQueLevar: ['Documento pessoal', 'Água', 'Protetor solar', 'Calçado adequado'],
    },
  },
  {
    slug: 'balneario-quedas-d-agua',
    nome: "Balneário Quedas D'água",
    municipio: 'Rio Verde de Mato Grosso - MS',
    categoria: 'Balneário',
    imagemUrl: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1600&q=80',
    ocupacaoAtual: 'Consulte disponibilidade',
    mediaUrl: 'http://www.quedasdagua.com',
    mapUrl: 'https://maps.google.com/maps?q=Rodovia%20MS-427%20km%207%20Rio%20Verde%20de%20Mato%20Grosso&t=&z=13&ie=UTF8&iwloc=&output=embed',
    descricao: {
      oQueE: 'Balneário com áreas de banho e infraestrutura para lazer ao ar livre.',
      experiencia: 'Atividades de natureza e aventura com espaços para visitantes de diferentes perfis.',
      historia: 'Faz parte do circuito turístico que fortalece o ecoturismo municipal.',
      sustentabilidade: 'Estimula práticas de visitação consciente e manutenção da qualidade ambiental.',
    },
    tecnico: {
      capacidadeTotal: 'Capacidade controlada por período',
      horarios: 'Consulte horário de funcionamento no canal oficial',
      regras: ['Não acessar áreas restritas', 'Seguir orientações de segurança', 'Preservar fauna e flora'],
      oQueLevar: ['Roupa leve', 'Toalha', 'Protetor solar', 'Repelente'],
    },
  },
  {
    slug: 'balneario-acqua-park',
    nome: 'Balneário Acqua Park',
    municipio: 'Rio Verde de Mato Grosso - MS',
    categoria: 'Balneário',
    imagemUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
    ocupacaoAtual: 'Consulte disponibilidade',
    mediaUrl: 'https://www.rioverde.ms.gov.br/portal/turismo/0/9/23/balneario-acqua-park',
    mapUrl: 'https://maps.google.com/maps?q=Rodovia%20MS-427%20km%2010%20Rio%20Verde%20de%20Mato%20Grosso&t=&z=13&ie=UTF8&iwloc=&output=embed',
    descricao: {
      oQueE: 'Espaço de lazer com piscinas de água cristalina e serviços de apoio ao visitante.',
      experiencia: 'Experiência relaxante com estrutura para permanência durante o dia.',
      historia: 'Integra os empreendimentos de destaque no turismo local.',
      sustentabilidade: 'Promove uso equilibrado do atrativo e conscientização ambiental.',
    },
    tecnico: {
      capacidadeTotal: 'Capacidade controlada por período',
      horarios: 'Consulte horários atualizados no portal oficial',
      regras: ['Respeitar capacidade indicada', 'Evitar som alto em áreas de preservação', 'Coletar todo resíduo gerado'],
      oQueLevar: ['Chapéu ou boné', 'Água', 'Protetor solar', 'Saco para resíduos'],
    },
  },
  {
    slug: 'fazenda-igrejinha',
    nome: 'Fazenda Igrejinha',
    municipio: 'Rio Verde de Mato Grosso - MS',
    categoria: 'Fazenda / Ecoturismo',
    imagemUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
    ocupacaoAtual: 'Consulte disponibilidade',
    mediaUrl: 'http://www.fazendaigrejinha.com',
    mapUrl: 'https://maps.google.com/maps?q=Fazenda%20Igrejinha%20Rio%20Verde%20de%20Mato%20Grosso&t=&z=12&ie=UTF8&iwloc=&output=embed',
    descricao: {
      oQueE: 'Atrativo rural com opções de camping, day-use e vivências em ambiente natural.',
      experiencia: 'Trilhas, contato com formações naturais e atividades de aventura.',
      historia: 'Referência regional em turismo de natureza e experiências de campo.',
      sustentabilidade: 'Valorização do território e incentivo ao turismo responsável em áreas naturais.',
    },
    tecnico: {
      capacidadeTotal: 'Capacidade controlada por período',
      horarios: 'Consulte períodos de visitação e hospedagem',
      regras: ['Manter distância da fauna', 'Não retirar elementos naturais', 'Seguir trilhas sinalizadas'],
      oQueLevar: ['Calçado de trilha', 'Água', 'Lanche leve', 'Repelente'],
      dificuldade: 'Leve a moderada (varia por atividade)',
    },
  },
  {
    slug: 'fazenda-varzea-alegre',
    nome: 'Fazenda Várzea Alegre',
    municipio: 'Rio Verde de Mato Grosso - MS',
    categoria: 'Fazenda / Ecoturismo',
    imagemUrl: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80',
    ocupacaoAtual: 'Consulte disponibilidade',
    mediaUrl: 'https://www.rioverde.ms.gov.br/pontos-turisticos-2/',
    descricao: {
      oQueE: 'Destino de natureza com paisagens preservadas e experiências gastronômicas regionais.',
      experiencia: 'Vivência ao ar livre com trilhas e contemplação de ambientes naturais.',
      historia: 'Faz parte da oferta turística rural consolidada no município.',
      sustentabilidade: 'Combina turismo e conservação por meio de práticas responsáveis de visitação.',
    },
    tecnico: {
      capacidadeTotal: 'Capacidade controlada por período',
      horarios: 'Consulte agenda e disponibilidade',
      regras: ['Respeitar áreas privadas', 'Não fazer fogo fora de locais permitidos', 'Preservar cursos d’água'],
      oQueLevar: ['Documento pessoal', 'Água', 'Calçado confortável', 'Protetor solar'],
      dificuldade: 'Leve',
    },
  },
  {
    slug: 'rodeio-tour-adventure',
    nome: 'Rodeio Tour Adventure',
    municipio: 'Rio Verde de Mato Grosso - MS',
    categoria: 'Aventura',
    imagemUrl: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1600&q=80',
    ocupacaoAtual: 'Consulte disponibilidade',
    mediaUrl: 'https://www.rodeiotouradventure.com',
    descricao: {
      oQueE: 'Operação turística voltada para experiências de aventura em rios e trilhas da região.',
      experiencia: 'Passeios guiados com atividades de maior adrenalina e contato intenso com a natureza.',
      historia: 'Contribui para diversificar o portfólio de turismo de aventura local.',
      sustentabilidade: 'Atuação com orientação técnica para uso consciente das áreas naturais.',
    },
    tecnico: {
      capacidadeTotal: 'Capacidade controlada por turma',
      horarios: 'Consulte saídas programadas',
      regras: ['Uso obrigatório de equipamentos quando indicado', 'Seguir condução do guia', 'Não sair do trajeto'],
      oQueLevar: ['Roupas adequadas para aventura', 'Água', 'Protetor solar', 'Repelente'],
      dificuldade: 'Moderada',
    },
  },
];

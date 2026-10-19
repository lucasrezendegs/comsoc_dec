import { Demand, TeamMember } from '../types';

export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'mem_1',
    name: 'Carlos Eduardo Ramos',
    role: 'Chefe da Seção / Coordenação',
    avatar_color: '#3B82F6', // Blue
    email: 'carlos.comunicacao@orgao.gov.br',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem_2',
    name: 'Beatriz Lima',
    role: 'Designer Gráfica',
    avatar_color: '#EC4899', // Pink
    email: 'beatriz.design@orgao.gov.br',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem_3',
    name: 'Gabriel Santos',
    role: 'Editor de Vídeo & Motion',
    avatar_color: '#8B5CF6', // Purple
    email: 'gabriel.video@orgao.gov.br',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem_4',
    name: 'Amanda Ferreira',
    role: 'Fotógrafa & Cobertura',
    avatar_color: '#10B981', // Emerald
    email: 'amanda.foto@orgao.gov.br',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mem_5',
    name: 'Lucas Oliveira',
    role: 'Redator & Assessor de Imprensa',
    avatar_color: '#F59E0B', // Amber
    email: 'lucas.imprensa@orgao.gov.br',
    created_at: new Date().toISOString(),
  },
];

function getRelativeDateISO(offsetHours: number): string {
  const date = new Date();
  date.setTime(date.getTime() + offsetHours * 60 * 60 * 1000);
  // Format as YYYY-MM-DDTHH:mm
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function getInitialDemands(): Demand[] {
  return [
    {
      id: 'dem_1',
      title: 'Nota Oficial de Esclarecimento à Imprensa',
      description: 'Redigir e validar nota à imprensa sobre a reportagem veiculada hoje cedo. Enviar minuta para aprovação do Gabinete antes do meio-dia.',
      assignee_id: 'mem_5',
      requester: 'Gabinete do Diretor Geral',
      due_date: getRelativeDateISO(-5), // Atrasada (passed 5 hours ago)
      category: 'Redação / Nota',
      priority: 'Urgente',
      status: 'Em Produção',
      files_link: 'https://docs.google.com',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'dem_2',
      title: 'Edição de Vídeo Institucional do Aniversário',
      description: 'Montagem com depoimentos gravados dos pioneiros, inserção de cartelas com identidade visual nova e trilha sonora licenciada.',
      assignee_id: 'mem_3',
      additional_assignees: [
        {
          member_id: 'mem_4',
          role_description: 'Captação de imagens de apoio em 4K e gravação dos depoimentos com iluminação em estúdio',
        },
        {
          member_id: 'mem_2',
          role_description: 'Criação das vinhetas, cartelas animadas e lower thirds com a nova identidade visual',
        },
      ],
      requester: 'Coordenação Geral de Comunicação',
      due_date: getRelativeDateISO(4), // Vence hoje em poucas horas
      category: 'Vídeo / Edição',
      priority: 'Alta',
      status: 'Em Produção',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    },
    {
      id: 'dem_3',
      title: 'Carrossel para Redes Sociais - Campanha Preventiva',
      description: 'Sequência de 5 slides para Instagram e LinkedIn explicando os canais oficiais de denúncia e atendimento ao cidadão.',
      assignee_id: 'mem_2',
      additional_assignees: [
        {
          member_id: 'mem_5',
          role_description: 'Redação do texto dos cards, revisão de normas e adaptação do tom de voz institucional',
        },
      ],
      requester: 'Seção de Atendimento ao Cidadão (Ouvidoria)',
      due_date: getRelativeDateISO(26), // Vence amanhã
      category: 'Design / Arte',
      priority: 'Alta',
      status: 'A Fazer',
      files_link: 'https://canva.com',
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
      id: 'dem_4',
      title: 'Cobertura Fotográfica da Solenidade Oficial',
      description: 'Registrar fotos da chegada dos convidados de honra, mesa diretora, entrega de condecorações e foto oficial em conjunto.',
      assignee_id: 'mem_4',
      requester: 'Cerimonial do Gabinete',
      due_date: getRelativeDateISO(48), // Vence em 2 dias
      category: 'Fotografia / Cobertura',
      priority: 'Média',
      status: 'A Fazer',
      files_link: '',
      created_at: new Date().toISOString(),
    },
    {
      id: 'dem_5',
      title: 'Revisão do Relatório de Gestão Semestral',
      description: 'Revisão ortográfica e padronização da linguagem das 40 páginas do relatório da seção administrativa para publicação externa.',
      assignee_id: 'mem_5',
      requester: 'Seção de Planejamento e Finanças',
      due_date: getRelativeDateISO(72), // Vence em 3 dias
      category: 'Redação / Nota',
      priority: 'Média',
      status: 'Em Revisão',
      files_link: 'https://docs.google.com',
      created_at: new Date().toISOString(),
    },
    {
      id: 'dem_6',
      title: 'Fechamento de Arquivo para Impressão - Folder Institucional',
      description: 'Converter cores para CMYK, aplicar sangrias de 3mm, exportar PDF/X-1a em alta resolução e enviar para a gráfica licitada.',
      assignee_id: 'mem_2',
      requester: 'Divisão de Recursos Humanos',
      due_date: getRelativeDateISO(96).split('T')[0], // Com data definida, mas sem horário (dia todo)
      category: 'Impressão / Material',
      priority: 'Média',
      status: 'A Fazer',
      files_link: 'https://drive.google.com',
      created_at: new Date().toISOString(),
    },
    {
      id: 'dem_7',
      title: 'Reels / Shorts com Destaques do Mês',
      description: 'Compilado dinâmico de 60 segundos com os melhores momentos das atividades da instituição no último mês para TikTok e Instagram.',
      assignee_id: 'mem_3',
      requester: 'Coordenação de Redes Sociais',
      due_date: '', // Sem data definida (demanda em aberto sem prazo fixado)
      category: 'Vídeo / Edição',
      priority: 'Baixa',
      status: 'A Fazer',
      files_link: '',
      created_at: new Date().toISOString(),
    },
    {
      id: 'dem_8',
      title: 'Fotos da Reunião com Delegação Externa',
      description: 'Tratamento de 15 imagens selecionadas e envio para a assessoria de imprensa da delegação visitante.',
      assignee_id: 'mem_4',
      requester: 'Assessoria de Assuntos Internacionais',
      due_date: getRelativeDateISO(-24),
      category: 'Fotografia / Cobertura',
      priority: 'Média',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - 28 * 3600000).toISOString(), // Entregue 4h antes do prazo (No Prazo)
    },
    {
      id: 'dem_9',
      title: 'Banner Digital para a Intranet da Seção',
      description: 'Criação de cabeçalho gráfico nas dimensões 1920x400 para aviso sobre o recadastramento anual de servidores.',
      assignee_id: 'mem_2',
      requester: 'Departamento de Gestão de Pessoas',
      due_date: getRelativeDateISO(-52),
      category: 'Design / Arte',
      priority: 'Baixa',
      status: 'Concluído',
      files_link: 'https://canva.com',
      created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - 44 * 3600000).toISOString(), // Entregue com 8h de atraso (Fora do Prazo)
    },
    {
      id: 'dem_10',
      title: 'Cobertura em Vídeo da Passagem de Chefia da DOM',
      description: 'Captação e edição das falas dos generais presentes, entrega das imagens brutas e clipe de 2 minutos para divulgação.',
      assignee_id: 'mem_3',
      requester: 'Diretoria de Obras Militares (DOM)',
      due_date: getRelativeDateISO(-72),
      category: 'Vídeo / Edição',
      priority: 'Alta',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 120 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - 76 * 3600000).toISOString(), // 4h antes (No Prazo)
    },
    {
      id: 'dem_11',
      title: 'Nota de Pesar e Comunicado Oficial de Falecimento',
      description: 'Redação da nota oficial de condolências à família militar, com aprovação expressa do Gabinete.',
      assignee_id: 'mem_5',
      requester: 'Gabinete do Chefe do DEC',
      due_date: getRelativeDateISO(-120),
      category: 'Redação / Nota',
      priority: 'Urgente',
      status: 'Concluído',
      files_link: 'https://docs.google.com',
      created_at: new Date(Date.now() - 144 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - 122 * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_12',
      title: 'Diagramação da Revista do DEC 2026 - Edição Especial',
      description: 'Projeto gráfico editorial de 32 páginas com matérias das diretorias subordinadas e balanço das obras.',
      assignee_id: 'mem_2',
      requester: 'Coordenação Geral de Comunicação',
      due_date: getRelativeDateISO(-24 * 14), // 14 dias atrás
      category: 'Design / Arte',
      priority: 'Alta',
      status: 'Concluído',
      files_link: 'https://canva.com',
      created_at: new Date(Date.now() - 24 * 25 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 14 + 10) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_13',
      title: 'Teaser em Vídeo do Exercício de Engenharia de Construção',
      description: 'Vídeo de 45 segundos para reels com cortes dinâmicos de maquinários pesados e lançamento de pontes.',
      assignee_id: 'mem_3',
      requester: 'Diretoria de Obras de Cooperação (DOC)',
      due_date: getRelativeDateISO(-24 * 20), // 20 dias atrás
      category: 'Vídeo / Edição',
      priority: 'Média',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 27 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 19) * 3600000).toISOString(), // 1 dia atrasado (Fora do Prazo)
    },
    {
      id: 'dem_14',
      title: 'Cobertura Fotográfica das Obras na Transamazônica - 1º BEC',
      description: 'Seleção e tratamento de 40 fotos de pavimentação asfáltica e drenagem para envio ao Ministério da Defesa.',
      assignee_id: 'mem_4',
      requester: 'Diretoria de Obras de Cooperação (DOC)',
      due_date: getRelativeDateISO(-24 * 25), // 25 dias atrás
      category: 'Fotografia / Cobertura',
      priority: 'Alta',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 29 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 25 + 12) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_15',
      title: 'Manual de Identidade Visual das Viaturas de Engenharia',
      description: 'Guia vetorial de aplicação do brasão e faixas refletivas nas viaturas operacionais do DEC.',
      assignee_id: 'mem_2',
      requester: 'Diretoria de Material de Engenharia (DMAT)',
      due_date: getRelativeDateISO(-24 * 40), // 40 dias atrás
      category: 'Design / Arte',
      priority: 'Média',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 55 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 41) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_16',
      title: 'Edição de Vídeo Especial do Dia da Engenharia',
      description: 'Produção com narrativa histórica do patrono Tenente-Coronel Villagran Cabrita e mensagem do Comandante.',
      assignee_id: 'mem_3',
      requester: 'Gabinete do Chefe do DEC',
      due_date: getRelativeDateISO(-24 * 48), // 48 dias atrás
      category: 'Vídeo / Edição',
      priority: 'Alta',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 60 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 49) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_17',
      title: 'Entrevista Exclusiva com o Diretor de Patrimônio Imobiliário',
      description: 'Transcrição, edição e diagramação de entrevista de 4 páginas sobre regularização fundiária de áreas militares.',
      assignee_id: 'mem_5',
      requester: 'Diretoria de Patrimônio Imobiliário e Meio Ambiente (DPIMA)',
      due_date: getRelativeDateISO(-24 * 54), // 54 dias atrás
      category: 'Redação / Nota',
      priority: 'Média',
      status: 'Concluído',
      files_link: 'https://docs.google.com',
      created_at: new Date(Date.now() - 24 * 65 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 52) * 3600000).toISOString(), // 2 dias atrasado (Fora do Prazo)
    },
    {
      id: 'dem_18',
      title: 'Álbum Fotográfico Comemorativo dos 50 Anos do DEC em Brasília',
      description: 'Curadoria de imagens históricas desde a transferência da capital até os dias atuais para exposição no hall.',
      assignee_id: 'mem_4',
      requester: 'Gabinete do Chefe do DEC',
      due_date: getRelativeDateISO(-24 * 70), // 70 dias atrás
      category: 'Fotografia / Cobertura',
      priority: 'Média',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 85 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 71) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_19',
      title: 'Infográfico Interativo: Obras Rodoviárias e Pontes no Nordeste',
      description: 'Desenvolvimento visual de mapa infográfico com quilometragem pavimentada pelos Batalhões de Engenharia.',
      assignee_id: 'mem_2',
      requester: 'Diretoria de Obras de Cooperação (DOC)',
      due_date: getRelativeDateISO(-24 * 78), // 78 dias atrás
      category: 'Design / Arte',
      priority: 'Média',
      status: 'Concluído',
      files_link: 'https://canva.com',
      created_at: new Date(Date.now() - 24 * 90 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 80) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_20',
      title: 'Série de Vídeos de Segurança e Proteção Individual nos Canteiros',
      description: '5 vídeos de 1 minuto detalhando o uso obrigatório de EPIs nas obras militares da Engenharia.',
      assignee_id: 'mem_3',
      requester: 'Diretoria de Obras Militares (DOM)',
      due_date: getRelativeDateISO(-24 * 84), // 84 dias atrás
      category: 'Vídeo / Edição',
      priority: 'Alta',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 95 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 83) * 3600000).toISOString(), // 1 dia atrasado (Fora do Prazo)
    },
    {
      id: 'dem_21',
      title: 'Cobertura Fotográfica da Visita Oficial da Comissão de Relações Exteriores',
      description: 'Registro de recepção no aeroporto, palestra na sala de reuniões e entrega de brindes institucionais.',
      assignee_id: 'mem_4',
      requester: 'Cerimonial do Gabinete',
      due_date: getRelativeDateISO(-24 * 150), // 150 dias atrás
      category: 'Fotografia / Cobertura',
      priority: 'Alta',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 160 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 151) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_22',
      title: 'Folder Institucional Dobrável do DEC para Feiras Tecnológicas',
      description: 'Criação de folder sanfonado de 6 páginas destacando as capacidades de pontes, ferrovias e perfuração de poços.',
      assignee_id: 'mem_2',
      requester: 'Coordenação Geral de Comunicação',
      due_date: getRelativeDateISO(-24 * 200), // 200 dias atrás
      category: 'Impressão / Material',
      priority: 'Média',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 215 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 202) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_23',
      title: 'Documentário Curto: A Engenharia Militar no Pantanal e Amazônia',
      description: 'Roteiro e edição de minidocumentário de 8 minutos sobre a missão dos engenheiros militares nas fronteiras do Brasil.',
      assignee_id: 'mem_3',
      requester: 'Gabinete do Chefe do DEC',
      due_date: getRelativeDateISO(-24 * 250), // 250 dias atrás
      category: 'Vídeo / Edição',
      priority: 'Urgente',
      status: 'Concluído',
      files_link: 'https://drive.google.com',
      created_at: new Date(Date.now() - 24 * 270 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 251) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_24',
      title: 'Plano de Comunicação Estratégica do DEC para Crises e Desastres Naturais',
      description: 'Documento doutrinário de 20 páginas com fluxos de resposta rápida para a imprensa em caso de enchentes ou calamidade.',
      assignee_id: 'mem_5',
      requester: 'Coordenação Geral de Comunicação',
      due_date: getRelativeDateISO(-24 * 310), // 310 dias atrás
      category: 'Redação / Nota',
      priority: 'Alta',
      status: 'Concluído',
      files_link: 'https://docs.google.com',
      created_at: new Date(Date.now() - 24 * 330 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 312) * 3600000).toISOString(), // No Prazo
    },
    {
      id: 'dem_25',
      title: 'Relatório Anual de Sustentabilidade Ambiental e Preservação de Áreas Militares',
      description: 'Diagramação e revisão das 60 páginas do relatório da DPIMA para os órgãos ambientais governamentais.',
      assignee_id: 'mem_2',
      requester: 'Diretoria de Patrimônio Imobiliário e Meio Ambiente (DPIMA)',
      due_date: getRelativeDateISO(-24 * 340), // 340 dias atrás
      category: 'Design / Arte',
      priority: 'Alta',
      status: 'Concluído',
      files_link: 'https://canva.com',
      created_at: new Date(Date.now() - 24 * 360 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - (24 * 337) * 3600000).toISOString(), // 3 dias atrasado (Fora do Prazo)
    },
  ];
}

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
      due_date: getRelativeDateISO(96), // Vence em 4 dias
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
      due_date: getRelativeDateISO(120), // Vence em 5 dias
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
    },
    {
      id: 'dem_9',
      title: 'Banner Digital para a Intranet da Seção',
      description: 'Criação de cabeçalho gráfico nas dimensões 1920x400 para aviso sobre o recadastramento anual de servidores.',
      assignee_id: 'mem_2',
      requester: 'Departamento de Gestão de Pessoas',
      due_date: getRelativeDateISO(-48),
      category: 'Design / Arte',
      priority: 'Baixa',
      status: 'Concluído',
      files_link: 'https://canva.com',
      created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    },
  ];
}

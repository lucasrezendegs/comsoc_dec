export type DemandCategory =
  | 'Vídeo / Edição'
  | 'Design / Arte'
  | 'Fotografia / Cobertura'
  | 'Redação / Nota'
  | 'Impressão / Material'
  | 'Outros';

export type DemandPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export type DemandStatus = 'A Fazer' | 'Em Produção' | 'Em Revisão' | 'Concluído';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_color: string;
  email?: string;
  created_at?: string;
}

export interface Demand {
  id: string;
  title: string;
  description: string;
  assignee_id: string;
  requester: string; // "Para quem entregar / Solicitante"
  due_date: string; // ISO string YYYY-MM-DDTHH:mm
  category: DemandCategory;
  priority: DemandPriority;
  status: DemandStatus;
  files_link?: string;
  created_at: string;
  updated_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  isCustomConfigured: boolean;
  errorMessage?: string;
}

export type ViewTab = 'overview' | 'by-person' | 'team';
export type DisplayMode = 'kanban' | 'list';

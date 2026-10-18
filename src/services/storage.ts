import { Demand, DemandStatus, TeamMember } from '../types';
import { getInitialDemands, INITIAL_MEMBERS } from './sampleData';
import { getSupabaseClient } from './supabaseClient';

const LOCAL_KEY_MEMBERS = 'comunica_team_members_v1';
const LOCAL_KEY_DEMANDS = 'comunica_demands_v1';
const LOCAL_KEY_ACTIVE_PROFILE = 'comunica_active_profile_id';
const LOCAL_KEY_THEME = 'comunica_color_theme';

// ======================== LOCAL STORAGE HELPERS ========================

export function getLocalMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_MEMBERS);
    if (!raw) {
      localStorage.setItem(LOCAL_KEY_MEMBERS, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MEMBERS;
  } catch (err) {
    console.error('Erro ao ler membros locais:', err);
    return INITIAL_MEMBERS;
  }
}

export function saveLocalMembers(members: TeamMember[]): void {
  try {
    localStorage.setItem(LOCAL_KEY_MEMBERS, JSON.stringify(members));
  } catch (err) {
    console.error('Erro ao salvar membros locais:', err);
  }
}

export function getLocalDemands(): Demand[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_DEMANDS);
    if (!raw) {
      const initial = getInitialDemands();
      localStorage.setItem(LOCAL_KEY_DEMANDS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao ler demandas locais:', err);
    return getInitialDemands();
  }
}

export function saveLocalDemands(demands: Demand[]): void {
  try {
    localStorage.setItem(LOCAL_KEY_DEMANDS, JSON.stringify(demands));
  } catch (err) {
    console.error('Erro ao salvar demandas locais:', err);
  }
}

export function getActiveProfileId(): string {
  try {
    const saved = localStorage.getItem(LOCAL_KEY_ACTIVE_PROFILE);
    if (saved) return saved;
    // Default to the first member
    const members = getLocalMembers();
    return members[0]?.id || '';
  } catch {
    return '';
  }
}

export function setActiveProfileId(id: string): void {
  try {
    localStorage.setItem(LOCAL_KEY_ACTIVE_PROFILE, id);
  } catch (err) {
    console.error('Erro ao salvar perfil ativo:', err);
  }
}

export function getStoredTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(LOCAL_KEY_THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(LOCAL_KEY_THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (err) {
    console.error('Erro ao salvar tema:', err);
  }
}

// ======================== UNIFIED DATA ACCESS ========================

export async function fetchAllTeamMembers(): Promise<{ members: TeamMember[]; isSupabase: boolean }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        // Cache to local as backup
        saveLocalMembers(data);
        return { members: data as TeamMember[], isSupabase: true };
      }
      console.warn('Falha na consulta de membros no Supabase, caindo para local:', error);
    } catch (e) {
      console.warn('Exceção ao buscar membros no Supabase:', e);
    }
  }

  return { members: getLocalMembers(), isSupabase: false };
}

export async function fetchAllDemands(): Promise<{ demands: Demand[]; isSupabase: boolean }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .order('due_date', { ascending: true });

      if (!error && data) {
        saveLocalDemands(data);
        return { demands: data as Demand[], isSupabase: true };
      }
      console.warn('Falha na consulta de demandas no Supabase, caindo para local:', error);
    } catch (e) {
      console.warn('Exceção ao buscar demandas no Supabase:', e);
    }
  }

  return { demands: getLocalDemands(), isSupabase: false };
}

export async function upsertMember(member: TeamMember): Promise<void> {
  const localList = getLocalMembers();
  const index = localList.findIndex(m => m.id === member.id);
  if (index >= 0) {
    localList[index] = member;
  } else {
    localList.push(member);
  }
  saveLocalMembers(localList);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('team_members').upsert({
        id: member.id,
        name: member.name,
        role: member.role,
        avatar_color: member.avatar_color,
        email: member.email || null,
        created_at: member.created_at || new Date().toISOString(),
      });
    } catch (err) {
      console.error('Erro ao sincronizar membro com Supabase:', err);
    }
  }
}

export async function removeMember(id: string): Promise<void> {
  const localList = getLocalMembers().filter(m => m.id !== id);
  saveLocalMembers(localList);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('team_members').delete().eq('id', id);
    } catch (err) {
      console.error('Erro ao remover membro do Supabase:', err);
    }
  }
}

export async function upsertDemand(demand: Demand): Promise<void> {
  const localList = getLocalDemands();
  const index = localList.findIndex(d => d.id === demand.id);
  const updatedDemand = {
    ...demand,
    updated_at: new Date().toISOString(),
  };

  if (index >= 0) {
    localList[index] = updatedDemand;
  } else {
    localList.unshift(updatedDemand);
  }
  saveLocalDemands(localList);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('demands').upsert({
        id: updatedDemand.id,
        title: updatedDemand.title,
        description: updatedDemand.description || '',
        assignee_id: updatedDemand.assignee_id || null,
        requester: updatedDemand.requester,
        due_date: updatedDemand.due_date,
        category: updatedDemand.category,
        priority: updatedDemand.priority,
        status: updatedDemand.status,
        files_link: updatedDemand.files_link || '',
        created_at: updatedDemand.created_at || new Date().toISOString(),
        updated_at: updatedDemand.updated_at,
      });
    } catch (err) {
      console.error('Erro ao salvar demanda no Supabase:', err);
    }
  }
}

export async function quickUpdateStatus(id: string, status: DemandStatus): Promise<void> {
  const localList = getLocalDemands();
  const item = localList.find(d => d.id === id);
  if (item) {
    item.status = status;
    item.updated_at = new Date().toISOString();
    saveLocalDemands(localList);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('demands')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.error('Erro ao atualizar status no Supabase:', err);
    }
  }
}

export async function removeDemand(id: string): Promise<void> {
  const localList = getLocalDemands().filter(d => d.id !== id);
  saveLocalDemands(localList);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('demands').delete().eq('id', id);
    } catch (err) {
      console.error('Erro ao remover demanda no Supabase:', err);
    }
  }
}

export async function uploadLocalDataToSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase não configurado ou desconectado.' };
  }

  try {
    const members = getLocalMembers();
    const demands = getLocalDemands();

    if (members.length > 0) {
      const { error: memErr } = await supabase.from('team_members').upsert(
        members.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          avatar_color: m.avatar_color,
          email: m.email || null,
          created_at: m.created_at || new Date().toISOString(),
        }))
      );
      if (memErr) throw memErr;
    }

    if (demands.length > 0) {
      const { error: demErr } = await supabase.from('demands').upsert(
        demands.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          assignee_id: d.assignee_id || null,
          requester: d.requester,
          due_date: d.due_date,
          category: d.category,
          priority: d.priority,
          status: d.status,
          files_link: d.files_link || '',
          created_at: d.created_at || new Date().toISOString(),
          updated_at: d.updated_at || new Date().toISOString(),
        }))
      );
      if (demErr) throw demErr;
    }

    return {
      success: true,
      message: `Sincronização concluída com sucesso! ${members.length} membros e ${demands.length} demandas exportados para o Supabase.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao enviar dados para o Supabase: ${err.message || 'Erro desconhecido'}`,
    };
  }
}

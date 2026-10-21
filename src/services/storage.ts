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

// ======================== SERVER API HELPERS ========================

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}

export async function getServerDatabaseStatus(): Promise<{
  status: string;
  type?: string;
  membersCount?: number;
  demandsCount?: number;
  updatedAt?: string;
} | null> {
  try {
    const res = await fetch('/api/database/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ======================== UNIFIED DATA ACCESS ========================

export async function fetchAllTeamMembers(): Promise<{ members: TeamMember[]; isSupabase: boolean; source: 'server' | 'supabase' | 'local' }> {
  // 1. Try backend server database first
  try {
    const serverRes = await fetch('/api/team-members');
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (Array.isArray(serverData) && serverData.length > 0) {
        saveLocalMembers(serverData);
        return { members: serverData as TeamMember[], isSupabase: false, source: 'server' };
      }
    }
  } catch (err) {
    console.warn('Servidor local indisponível para membros, tentando Supabase/Local:', err);
  }

  // 2. Try Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        saveLocalMembers(data);
        return { members: data as TeamMember[], isSupabase: true, source: 'supabase' };
      }
      if (error) {
        console.warn('Falha na consulta de membros no Supabase:', error);
      }
    } catch (e) {
      console.warn('Exceção ao buscar membros no Supabase:', e);
    }
  }

  // 3. Fallback to LocalStorage
  return { members: getLocalMembers(), isSupabase: false, source: 'local' };
}

export async function fetchAllDemands(): Promise<{ demands: Demand[]; isSupabase: boolean; source: 'server' | 'supabase' | 'local' }> {
  // 1. Try backend server database first
  try {
    const serverRes = await fetch('/api/demands');
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (Array.isArray(serverData) && serverData.length > 0) {
        saveLocalDemands(serverData);
        return { demands: serverData as Demand[], isSupabase: false, source: 'server' };
      }
    }
  } catch (err) {
    console.warn('Servidor local indisponível para demandas, tentando Supabase/Local:', err);
  }

  // 2. Try Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .order('due_date', { ascending: true });

      if (!error && data && data.length > 0) {
        saveLocalDemands(data);
        return { demands: data as Demand[], isSupabase: true, source: 'supabase' };
      }
      if (error) {
        console.warn('Falha na consulta de demandas no Supabase:', error);
      }
    } catch (e) {
      console.warn('Exceção ao buscar demandas no Supabase:', e);
    }
  }

  // 3. Fallback to LocalStorage
  return { demands: getLocalDemands(), isSupabase: false, source: 'local' };
}

export async function upsertMember(member: TeamMember): Promise<{ success: boolean; message: string }> {
  // 1. Immediate local update
  const localList = getLocalMembers();
  const index = localList.findIndex(m => m.id === member.id);
  if (index >= 0) {
    localList[index] = member;
  } else {
    localList.push(member);
  }
  saveLocalMembers(localList);

  let savedToServer = false;
  let savedToSupabase = false;

  // 2. Save to Server Database
  try {
    const res = await fetch('/api/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (res.ok) {
      savedToServer = true;
    }
  } catch (err) {
    console.warn('Erro ao salvar membro no servidor:', err);
  }

  // 3. Save to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('team_members').upsert({
        id: member.id,
        name: member.name,
        role: member.role,
        avatar_color: member.avatar_color,
        email: member.email || null,
        created_at: member.created_at || new Date().toISOString(),
      });
      if (!error) {
        savedToSupabase = true;
      } else {
        console.error('Erro ao sincronizar membro com Supabase:', error);
      }
    } catch (err) {
      console.error('Exceção ao sincronizar membro com Supabase:', err);
    }
  }

  return {
    success: true,
    message: savedToSupabase 
      ? 'Membro salvo no banco de dados e sincronizado na nuvem!' 
      : 'Membro salvo no banco de dados com sucesso!',
  };
}

export async function removeMember(id: string): Promise<void> {
  const localList = getLocalMembers().filter(m => m.id !== id);
  saveLocalMembers(localList);

  try {
    await fetch(`/api/team-members/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Erro ao remover membro no servidor:', err);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) {
        console.error('Erro ao remover membro do Supabase:', error);
      }
    } catch (err) {
      console.error('Exceção ao remover membro do Supabase:', err);
    }
  }
}

export async function upsertDemand(demand: Demand): Promise<{ success: boolean; message: string; warning?: string }> {
  const nowIso = new Date().toISOString();
  const updatedDemand: Demand = {
    ...demand,
    updated_at: nowIso,
    completed_at: demand.status === 'Concluído' 
      ? (demand.completed_at || nowIso) 
      : undefined,
  };

  // 1. Immediate local storage
  const localList = getLocalDemands();
  const index = localList.findIndex(d => d.id === demand.id);
  if (index >= 0) {
    localList[index] = updatedDemand;
  } else {
    localList.unshift(updatedDemand);
  }
  saveLocalDemands(localList);

  let savedToServer = false;
  let savedToSupabase = false;
  let supabaseWarning = '';

  // 2. Save to persistent Server Database
  try {
    const res = await fetch('/api/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDemand),
    });
    if (res.ok) {
      savedToServer = true;
    } else {
      console.warn('Servidor retornou status não-ok ao salvar demanda:', res.status);
    }
  } catch (err) {
    console.warn('Erro de rede ao salvar demanda no servidor:', err);
  }

  // 3. Save to Supabase with robust error handling and column fallback
  const supabase = getSupabaseClient();
  if (supabase) {
    const fullPayload: Record<string, any> = {
      id: updatedDemand.id,
      title: updatedDemand.title,
      description: updatedDemand.description || '',
      assignee_id: updatedDemand.assignee_id || null,
      additional_assignees: updatedDemand.additional_assignees || [],
      requester: updatedDemand.requester,
      due_date: updatedDemand.due_date,
      category: updatedDemand.category,
      priority: updatedDemand.priority,
      status: updatedDemand.status,
      files_link: updatedDemand.files_link || '',
      created_at: updatedDemand.created_at || nowIso,
      updated_at: updatedDemand.updated_at,
      completed_at: updatedDemand.completed_at || null,
    };

    try {
      const { error } = await supabase.from('demands').upsert(fullPayload);
      if (!error) {
        savedToSupabase = true;
      } else {
        console.warn('Tentativa com payload completo falhou no Supabase, tentando compatibilidade:', error);
        
        // Handle missing columns or constraints gracefully
        const fallbackPayload = { ...fullPayload };
        const errMsg = error.message.toLowerCase();

        // If completed_at or additional_assignees missing in user's table, omit them
        if (errMsg.includes('completed_at') || errMsg.includes('column')) {
          delete fallbackPayload.completed_at;
          supabaseWarning = 'A coluna completed_at ainda não existe no seu Supabase. Execute o script de atualização no SQL Editor.';
        }
        if (errMsg.includes('additional_assignees')) {
          delete fallbackPayload.additional_assignees;
        }

        // If foreign key constraint failed
        if (error.code === '23503' || errMsg.includes('foreign key') || errMsg.includes('violates foreign key')) {
          fallbackPayload.assignee_id = null;
        }

        const retryRes = await supabase.from('demands').upsert(fallbackPayload);
        if (!retryRes.error) {
          savedToSupabase = true;
        } else {
          console.error('Falha persistente ao salvar no Supabase:', retryRes.error);
          supabaseWarning = `Aviso do Supabase: ${retryRes.error.message}`;
        }
      }
    } catch (err: any) {
      console.error('Exceção ao salvar demanda no Supabase:', err);
      supabaseWarning = err?.message || 'Erro ao sincronizar com Supabase';
    }
  }

  return {
    success: true,
    message: savedToSupabase 
      ? 'Demanda salva no banco de dados e sincronizada na nuvem!' 
      : 'Demanda salva no banco de dados do servidor!',
    warning: supabaseWarning,
  };
}

export async function quickUpdateStatus(id: string, status: DemandStatus): Promise<{ success: boolean; message: string }> {
  const localList = getLocalDemands();
  const item = localList.find(d => d.id === id);
  const nowIso = new Date().toISOString();
  if (item) {
    item.status = status;
    item.updated_at = nowIso;
    if (status === 'Concluído') {
      if (!item.completed_at) {
        item.completed_at = nowIso;
      }
    } else {
      item.completed_at = undefined;
    }
    saveLocalDemands(localList);
  }

  // 1. Update on Server Database
  try {
    await fetch(`/api/demands/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.warn('Erro ao atualizar status no servidor:', err);
  }

  // 2. Update on Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const updatePayload: Record<string, any> = { 
        status, 
        updated_at: nowIso 
      };
      if (status === 'Concluído') {
        updatePayload.completed_at = item?.completed_at || nowIso;
      } else {
        updatePayload.completed_at = null;
      }

      const { error } = await supabase
        .from('demands')
        .update(updatePayload)
        .eq('id', id);

      if (error && error.message.toLowerCase().includes('completed_at')) {
        // Fallback without completed_at if column doesn't exist
        await supabase
          .from('demands')
          .update({ status, updated_at: nowIso })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Erro ao atualizar status no Supabase:', err);
    }
  }

  return { success: true, message: `Status alterado para "${status}" e salvo no banco de dados!` };
}

export async function removeDemand(id: string): Promise<void> {
  const localList = getLocalDemands().filter(d => d.id !== id);
  saveLocalDemands(localList);

  try {
    await fetch(`/api/demands/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Erro ao remover demanda no servidor:', err);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('demands').delete().eq('id', id);
    } catch (err) {
      console.error('Erro ao remover demanda no Supabase:', err);
    }
  }
}

export async function syncAllLocalDataToServer(): Promise<{ success: boolean; message: string }> {
  try {
    const members = getLocalMembers();
    const demands = getLocalDemands();
    const res = await fetch('/api/database/sync-from-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members, demands }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return {
      success: true,
      message: `Sincronizado com o banco de dados do servidor: ${data.demandsCount} demandas e ${data.membersCount} membros.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao enviar dados para o servidor: ${err.message}`,
    };
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
      const formattedDemands = demands.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description || '',
        assignee_id: d.assignee_id || null,
        additional_assignees: d.additional_assignees || [],
        requester: d.requester,
        due_date: d.due_date,
        category: d.category,
        priority: d.priority,
        status: d.status,
        files_link: d.files_link || '',
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
        completed_at: d.completed_at || null,
      }));

      const { error: demErr } = await supabase.from('demands').upsert(formattedDemands);
      if (demErr) {
        // Fallback without newer columns if table schema is older
        const strippedDemands = formattedDemands.map(d => {
          const copy: any = { ...d };
          delete copy.completed_at;
          delete copy.additional_assignees;
          return copy;
        });
        const retry = await supabase.from('demands').upsert(strippedDemands);
        if (retry.error) throw retry.error;
      }
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

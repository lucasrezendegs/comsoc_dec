import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'comunica_supabase_url';
const STORAGE_KEY_KEY = 'comunica_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabaseCredentials(): { url: string; anonKey: string; isCustom: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey, isCustom: true };
  }

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, isCustom: false };
  }

  return { url: '', anonKey: '', isCustom: false };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (!url || !anonKey) {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
    currentClientKey = '';
    return;
  }
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  cachedClient = null;
  currentClientKey = '';
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  cachedClient = null;
  currentClientKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) {
    return null;
  }

  const clientKey = `${url}:${anonKey}`;
  if (cachedClient && currentClientKey === clientKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    currentClientKey = clientKey;
    return cachedClient;
  } catch (err) {
    console.warn('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string }> {
  try {
    const targetUrl = url || getSupabaseCredentials().url;
    const targetKey = anonKey || getSupabaseCredentials().anonKey;

    if (!targetUrl || !targetKey) {
      return { success: false, message: 'URL ou Chave Anônima do Supabase não fornecidas.' };
    }

    const testClient = createClient(targetUrl, targetKey, {
      auth: { persistSession: false },
    });

    // Test a basic select on team_members
    const { data, error } = await testClient.from('team_members').select('id').limit(1);

    if (error) {
      // Check if table does not exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Conectado ao Supabase, mas as tabelas ainda não foram criadas! Execute o Script SQL fornecido no SQL Editor do seu projeto.',
        };
      }
      return {
        success: false,
        message: `Erro do Supabase (${error.code || 'erro'}): ${error.message}`,
      };
    }

    return {
      success: true,
      message: `Conexão bem-sucedida com o Supabase! (${data ? data.length : 0} registros encontrados)`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Falha na comunicação de rede com o Supabase.',
    };
  }
}

export const SUPABASE_SQL_SCRIPT = `-- ===============================================================
-- SISTEMA DE GESTÃO DE DEMANDAS - COMSOC DEC
-- Execute este script no SQL Editor do seu projeto Supabase
-- ===============================================================

-- 1. Criação da tabela de Membros da Equipe
CREATE TABLE IF NOT EXISTS public.team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#3B82F6',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criação da tabela de Demandas
CREATE TABLE IF NOT EXISTS public.demands (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES public.team_members(id) ON DELETE SET NULL,
  additional_assignees JSONB DEFAULT '[]'::jsonb,
  requester TEXT NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  files_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Garantir que colunas recentes existam mesmo em tabelas pré-existentes:
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS additional_assignees JSONB DEFAULT '[]'::jsonb;

-- 3. Configuração de Políticas de Acesso Público (RLS)
-- Como o sistema é aberto para uso interno sem login obrigatório:
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access team_members" ON public.team_members;
CREATE POLICY "Public full access team_members"
  ON public.team_members
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access demands" ON public.demands;
CREATE POLICY "Public full access demands"
  ON public.demands
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Habilitar escuta de alterações em tempo real (Supabase Realtime)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.team_members, public.demands;
COMMIT;
`;

export const SUPABASE_MIGRATION_SQL = `-- ===============================================================
-- SCRIPT DE ATUALIZAÇÃO RÁPIDA (MIGRAÇÃO)
-- Execute este script no SQL Editor caso já tenha criado as tabelas:
-- ===============================================================
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS additional_assignees JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.demands DROP CONSTRAINT IF EXISTS demands_assignee_id_fkey;
ALTER TABLE public.demands ADD CONSTRAINT demands_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.team_members(id) ON DELETE SET NULL;
`;

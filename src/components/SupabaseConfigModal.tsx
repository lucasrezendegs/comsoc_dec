import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  UploadCloud, 
  RefreshCw, 
  Code2, 
  Settings2,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  SUPABASE_SQL_SCRIPT,
  SUPABASE_MIGRATION_SQL 
} from '../services/supabaseClient';
import { uploadLocalDataToSupabase, syncAllLocalDataToServer } from '../services/storage';
import { useToast } from './Toast';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged: () => void;
  isSupabaseConnected: boolean;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged,
  isSupabaseConnected,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'migration'>('config');

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingServer, setIsSyncingServer] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [hasCopiedMigration, setHasCopiedMigration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL e a Anon Key do Supabase.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      showToast('Conexão com o Supabase testada com sucesso!', 'success');
    } else {
      showToast('Erro no teste de conexão.', 'error');
    }
  };

  const handleSaveAndConnect = async () => {
    if (!url.trim() || !anonKey.trim()) {
      showToast('Preencha os dados do Supabase.', 'error');
      return;
    }

    setIsTesting(true);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);

    if (!res.success) {
      setTestResult(res);
      showToast('Não foi possível conectar. Verifique as credenciais ou as tabelas.', 'error');
      return;
    }

    saveSupabaseCredentials(url.trim(), anonKey.trim());
    showToast('Configuração salva! Conectado ao banco Supabase.', 'success');
    onConnectionChanged();
    onClose();
  };

  const handleDisconnect = () => {
    saveSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    showToast('Desconectado do Supabase. Operando em Modo Local (LocalStorage).', 'info');
    onConnectionChanged();
    onClose();
  };

  const handleUploadLocalToSupabase = async () => {
    setIsUploading(true);
    const res = await uploadLocalDataToSupabase();
    setIsUploading(false);

    if (res.success) {
      showToast(res.message, 'success');
      onConnectionChanged();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setHasCopiedSql(true);
    showToast('Script SQL copiado para a área de transferência!', 'success');
    setTimeout(() => setHasCopiedSql(false), 3000);
  };

  const handleCopyMigration = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setHasCopiedMigration(true);
    showToast('Script de Migração/Atualização copiado!', 'success');
    setTimeout(() => setHasCopiedMigration(false), 3000);
  };

  const handleSyncToServer = async () => {
    setIsSyncingServer(true);
    const res = await syncAllLocalDataToServer();
    setIsSyncingServer(false);
    if (res.success) {
      showToast(res.message, 'success');
      onConnectionChanged();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              isSupabaseConnected 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' 
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Banco de Dados & Nuvem
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Banco Ativo: Gravando
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Todas as alterações são salvas permanentemente no banco de dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2 gap-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
              activeTab === 'config'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Configuração do Banco</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
              activeTab === 'sql'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Script SQL Inicial (Novo Banco)</span>
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
              activeTab === 'migration'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Script de Atualização (Migração)</span>
          </button>
        </div>

        {/* Tab 1: Configuration Form */}
        {activeTab === 'config' && (
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            {/* Status explanation */}
            <div className="p-3.5 rounded-2xl border bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  <div>
                    <strong className="font-semibold">Banco de Dados Permanente Ativo: </strong> 
                    Todas as demandas, edições, mudanças de status e membros da equipe são gravados no banco de dados. Mesmo recarregando a página ou abrindo em outros navegadores, os dados permanecem salvos.
                  </div>
                  {isSupabaseConnected && (
                    <div className="mt-1 font-semibold text-emerald-800 dark:text-emerald-300">
                      ✓ Sincronização em nuvem com o Supabase ativa em tempo real.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Supabase URL */}
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Supabase Project URL (Opcional para sincronizar em nuvem externa)
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyzabcdefg.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            {/* Supabase Anon Key */}
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            {/* Test connection result banner */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div>{testResult.message}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Testar Conexão</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingServer}
                  onClick={handleSyncToServer}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 transition cursor-pointer"
                  title="Garante que todos os dados locais estejam salvos no servidor"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isSyncingServer ? 'Sincronizando...' : 'Garantir Dados no Servidor'}</span>
                </button>

                {isSupabaseConnected && (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleUploadLocalToSupabase}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 transition cursor-pointer"
                    title="Enviar membros e demandas para as tabelas do Supabase"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Enviando...' : 'Exportar p/ Supabase'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {url && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 rounded-xl text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                  >
                    Desconectar Nuvem
                  </button>
                )}
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleSaveAndConnect}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold shadow-sm transition cursor-pointer"
                >
                  Salvar e Conectar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SQL Script */}
        {activeTab === 'sql' && (
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl p-3 text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong>Instruções de Inicialização (Novo Banco no Supabase):</strong>
                <ol className="list-decimal list-inside mt-1 space-y-0.5 text-[11px] text-sky-800 dark:text-sky-300">
                  <li>Acesse o painel do seu projeto no Supabase (app.supabase.com).</li>
                  <li>Clique em <strong>SQL Editor</strong> no menu lateral esquerdo.</li>
                  <li>Cole o código SQL abaixo e clique no botão verde <strong>RUN</strong>.</li>
                  <li>Volte para a aba "Configuração do Banco" e clique em <strong>Testar Conexão</strong>.</li>
                </ol>
              </div>
            </div>

            {/* SQL Code Box */}
            <div className="relative">
              <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-3 py-1.5 rounded-t-xl text-[11px] font-mono border-b border-slate-700">
                <span>supabase_schema.sql</span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1 text-slate-200 hover:text-white bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer"
                >
                  {hasCopiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{hasCopiedSql ? 'Copiado!' : 'Copiar Código SQL'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-b-xl overflow-x-auto max-h-[280px] scrollbar-thin border border-slate-800 leading-relaxed select-all">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Script SQL Completo</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Migration / Update Script */}
        {activeTab === 'migration' && (
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong>Atualização para Tabelas Pré-existentes no Supabase:</strong>
                <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                  Se você já tinha criado as tabelas no Supabase anteriormente, execute este script rápido para adicionar as colunas <code>completed_at</code> e <code>additional_assignees</code> sem perder nenhum dado já existente!
                </p>
              </div>
            </div>

            {/* SQL Code Box */}
            <div className="relative">
              <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-3 py-1.5 rounded-t-xl text-[11px] font-mono border-b border-slate-700">
                <span>supabase_migration.sql</span>
                <button
                  onClick={handleCopyMigration}
                  className="flex items-center gap-1 text-slate-200 hover:text-white bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer"
                >
                  {hasCopiedMigration ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{hasCopiedMigration ? 'Copiado!' : 'Copiar Migração'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-b-xl overflow-x-auto max-h-[240px] scrollbar-thin border border-slate-800 leading-relaxed select-all">
                {SUPABASE_MIGRATION_SQL}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCopyMigration}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Script de Atualização</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

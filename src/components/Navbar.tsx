import React, { useState } from 'react';
import { 
  Megaphone, 
  Layers, 
  User,
  Users, 
  UserCheck, 
  Plus, 
  Moon, 
  Sun, 
  Database, 
  Menu, 
  X,
  ChevronDown,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { TeamMember, ViewTab } from '../types';
import { getInitials } from '../utils/styleHelpers';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  members: TeamMember[];
  onOpenNewDemand: () => void;
  onOpenSupabaseConfig: () => void;
  isSupabaseConnected: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  totalActiveDemandsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  members,
  onOpenNewDemand,
  onOpenSupabaseConfig,
  isSupabaseConnected,
  theme,
  onToggleTheme,
  totalActiveDemandsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Section Identity - Clickable to Overview */}
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-3 shrink-0 text-left cursor-pointer group focus:outline-none rounded-2xl p-1.5 -m-1.5 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all select-none"
            title="Ir para a Visão Geral"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 group-hover:shadow-sky-500/30 transition-all">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  ComSoc DEC
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
                  DEC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Comunicação Social
              </p>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => onTabChange('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Visão Geral</span>
              {totalActiveDemandsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 font-bold">
                  {totalActiveDemandsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('by-person')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'by-person'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Demandas por Pessoa</span>
            </button>

            <button
              onClick={() => onTabChange('team')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'team'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Equipe da Seção</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 font-bold">
                {members.length}
              </span>
            </button>

            <button
              onClick={() => onTabChange('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'reports'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Relatórios</span>
            </button>
          </nav>

          {/* Right Area: Supabase + Theme + New Demand CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Supabase Connection Pill */}
            <button
              onClick={onOpenSupabaseConfig}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60 hover:bg-amber-100'
              }`}
              title="Configurar Conexão do Banco Supabase"
            >
              <span className={`w-2 h-2 rounded-full ${
                isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
              <Database className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">
                {isSupabaseConnected ? 'Supabase' : 'Modo Local'}
              </span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* + Nova Demanda CTA */}
            <button
              onClick={onOpenNewDemand}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 active:scale-95 text-white transition shadow-sm shadow-sky-600/20 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Nova Demanda</span>
              <span className="sm:hidden">Nova</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => {
                  onTabChange('overview');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'overview'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Visão Geral (Todas as Demandas)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                  {totalActiveDemandsCount}
                </span>
              </button>

              <button
                onClick={() => {
                  onTabChange('by-person');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'by-person'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Demandas por Pessoa</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('team');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'team'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Equipe da Seção</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                  {members.length}
                </span>
              </button>

              <button
                onClick={() => {
                  onTabChange('reports');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'reports'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>Relatórios & Indicadores de Gestão</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

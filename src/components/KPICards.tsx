import React from 'react';
import { Layers, Loader2, AlertOctagon, CheckCircle2, ChevronRight } from 'lucide-react';
import { Demand } from '../types';
import { analyzeDeadline } from '../utils/dateUtils';

interface KPICardsProps {
  demands: Demand[];
  activeFilterStatus?: string;
  onFilterClick?: (status: string | null) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  demands,
  activeFilterStatus,
  onFilterClick,
}) => {
  const activeDemands = demands.filter(d => d.status !== 'Concluído');
  const inProduction = demands.filter(d => d.status === 'Em Produção');
  const completed = demands.filter(d => d.status === 'Concluído');

  // Overdue and Due Today demands that are not completed
  const criticalDeadlines = demands.filter(d => {
    if (d.status === 'Concluído') return false;
    const analysis = analyzeDeadline(d.due_date, d.status);
    return analysis.status === 'overdue' || analysis.status === 'due-soon';
  });

  const overdueCount = demands.filter(d => {
    if (d.status === 'Concluído') return false;
    return analyzeDeadline(d.due_date, d.status).status === 'overdue';
  }).length;

  const dueSoonCount = criticalDeadlines.length - overdueCount;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Demandas Ativas */}
      <div
        onClick={() => onFilterClick && onFilterClick(activeFilterStatus === 'ativas' ? null : 'ativas')}
        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          activeFilterStatus === 'ativas'
            ? 'bg-slate-900 text-white dark:bg-slate-800 dark:border-sky-500 shadow-md ring-2 ring-sky-500/50'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Demandas Ativas
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {activeDemands.length}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            de {demands.length} total
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span>Ver todas em aberto</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 2. Em Produção */}
      <div
        onClick={() => onFilterClick && onFilterClick(activeFilterStatus === 'Em Produção' ? null : 'Em Produção')}
        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          activeFilterStatus === 'Em Produção'
            ? 'bg-blue-900/90 text-white border-blue-500 ring-2 ring-blue-500/50'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900/60 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Em Produção
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {inProduction.length}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            em andamento
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span>Filtrar em produção</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 3. Prazos Críticos (Vencendo Hoje / Atrasados) - Em destaque visual */}
      <div
        onClick={() => onFilterClick && onFilterClick(activeFilterStatus === 'criticos' ? null : 'criticos')}
        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          activeFilterStatus === 'criticos'
            ? 'bg-rose-950 text-white border-rose-500 ring-2 ring-rose-500/50 shadow-md'
            : criticalDeadlines.length > 0
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 hover:border-amber-400 hover:shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              criticalDeadlines.length > 0 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}>
              Atenção de Prazo
            </span>
            {overdueCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            overdueCount > 0 
              ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400' 
              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
          }`}>
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {criticalDeadlines.length}
          </span>
          <div className="flex flex-col text-[11px] leading-tight text-slate-600 dark:text-slate-400">
            {overdueCount > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">{overdueCount} atrasada(s)</span>
            )}
            {dueSoonCount > 0 && (
              <span className="text-amber-700 dark:text-amber-300">{dueSoonCount} vence(m) breve</span>
            )}
            {criticalDeadlines.length === 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">Prazos em dia!</span>
            )}
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span>Ver urgentes e atrasadas</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 4. Concluídas */}
      <div
        onClick={() => onFilterClick && onFilterClick(activeFilterStatus === 'Concluído' ? null : 'Concluído')}
        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          activeFilterStatus === 'Concluído'
            ? 'bg-emerald-950 text-white border-emerald-500 ring-2 ring-emerald-500/50'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-900/60 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Entregues
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {completed.length}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            concluídas
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span>Filtrar finalizadas</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};

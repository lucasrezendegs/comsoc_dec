import React from 'react';
import { Search, Filter, X, Kanban, Table2, BarChart3 } from 'lucide-react';
import { DemandCategory, DemandPriority, DemandStatus, DisplayMode, TeamMember } from '../types';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedPriority: string;
  onPriorityChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedAssignee: string;
  onAssigneeChange: (value: string) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  members: TeamMember[];
  totalFilteredCount: number;
  onOpenReports?: () => void;
  hideAssigneeFilter?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  selectedAssignee,
  onAssigneeChange,
  displayMode,
  onDisplayModeChange,
  onClearFilters,
  hasActiveFilters,
  members,
  totalFilteredCount,
  onOpenReports,
  hideAssigneeFilter = false,
}) => {
  const categories: DemandCategory[] = [
    'Vídeo / Edição',
    'Design / Arte',
    'Fotografia / Cobertura',
    'Redação / Nota',
    'Impressão / Material',
    'Outros',
  ];

  const priorities: DemandPriority[] = ['Urgente', 'Alta', 'Média', 'Baixa'];
  const statuses: DemandStatus[] = ['A Fazer', 'Em Produção', 'Em Revisão', 'Atrasado', 'Concluído'];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar por título, solicitante ou detalhe do briefing..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher + Report Button */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          {onOpenReports && (
            <button
              onClick={onOpenReports}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition shadow-xs"
              title="Gerar Relatório de Produtividade e Pontualidade"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Gerar Relatório</span>
            </button>
          )}

          {/* Display Mode toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <button
              onClick={() => onDisplayModeChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                displayMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Visualização em Colunas Kanban"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => onDisplayModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                displayMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Visualização em Lista / Planilha"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Lista / Planilha</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select Filters Row */}
      <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-1 text-slate-400 mr-1 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros:</span>
        </div>

        {/* Categoria */}
        <select
          value={selectedCategory}
          onChange={e => onCategoryChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
        >
          <option value="">Todas Categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Prioridade */}
        <select
          value={selectedPriority}
          onChange={e => onPriorityChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
        >
          <option value="">Todas Prioridades</option>
          {priorities.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
        >
          <option value="">Todos Status</option>
          {statuses.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Responsável */}
        {!hideAssigneeFilter && (
          <select
            value={selectedAssignee}
            onChange={e => onAssigneeChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="">Todos Responsáveis</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role.split('/')[0].trim()})
              </option>
            ))}
          </select>
        )}

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition font-medium ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>
        )}

        <div className="ml-auto text-slate-400 dark:text-slate-500 font-mono text-[11px] hidden sm:block">
          {totalFilteredCount} demanda(s) exibida(s)
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Eye, 
  User, 
  Send, 
  Calendar, 
  Maximize2,
  LayoutGrid,
  X,
  Search
} from 'lucide-react';
import { Demand, DemandStatus, TeamMember } from '../types';
import { analyzeDeadline, formatBrazilianDate } from '../utils/dateUtils';
import { 
  getCategoryIcon, 
  getCategoryBadgeClass, 
  getPriorityBadge, 
  getInitials 
} from '../utils/styleHelpers';

interface KanbanBoardProps {
  demands: Demand[];
  members: TeamMember[];
  onUpdateStatus: (id: string, newStatus: DemandStatus) => void;
  onEditDemand: (demand: Demand) => void;
  onDeleteDemand: (id: string) => void;
  onViewDemand: (demand: Demand) => void;
  collapsibleCompleted?: boolean;
  isCompletedExpanded?: boolean;
  onToggleCompletedExpanded?: () => void;
}

interface ColumnConfig {
  status: DemandStatus;
  title: string;
  borderColor: string;
  headerBg: string;
  badgeBg: string;
  accentText: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'Atrasado',
    title: 'Atrasado',
    borderColor: 'border-red-300 dark:border-red-800',
    headerBg: 'bg-red-50/90 dark:bg-red-950/40',
    badgeBg: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
    accentText: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500 animate-pulse',
  },
  {
    status: 'A Fazer',
    title: 'A Fazer',
    borderColor: 'border-slate-300 dark:border-slate-700',
    headerBg: 'bg-slate-100/80 dark:bg-slate-800/80',
    badgeBg: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    accentText: 'text-slate-600 dark:text-slate-400',
    dotColor: 'bg-slate-400',
  },
  {
    status: 'Em Produção',
    title: 'Em Produção',
    borderColor: 'border-blue-300 dark:border-blue-800',
    headerBg: 'bg-blue-50/80 dark:bg-blue-950/40',
    badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    accentText: 'text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500 animate-pulse',
  },
  {
    status: 'Em Revisão',
    title: 'Em Revisão / Aprovação',
    borderColor: 'border-amber-300 dark:border-amber-800',
    headerBg: 'bg-amber-50/80 dark:bg-amber-950/40',
    badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    accentText: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  {
    status: 'Concluído',
    title: 'Concluído',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
];

const STATUS_ORDER: DemandStatus[] = ['A Fazer', 'Em Produção', 'Em Revisão', 'Concluído'];

// Helper to get next and previous status transitions
function getNextStatus(current: DemandStatus): DemandStatus | null {
  if (current === 'Atrasado') return 'Concluído';
  const idx = STATUS_ORDER.indexOf(current);
  if (idx >= 0 && idx < STATUS_ORDER.length - 1) {
    return STATUS_ORDER[idx + 1];
  }
  return null;
}

function getPrevStatus(current: DemandStatus): DemandStatus | null {
  if (current === 'Atrasado') return 'Em Produção';
  const idx = STATUS_ORDER.indexOf(current);
  if (idx > 0) {
    return STATUS_ORDER[idx - 1];
  }
  return null;
}

interface DemandCardItemProps {
  demand: Demand;
  memberMap: Map<string, TeamMember>;
  onViewDemand: (demand: Demand) => void;
  onEditDemand: (demand: Demand) => void;
  onDeleteDemand: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: DemandStatus) => void;
  columnStatus: DemandStatus;
  isOverdue: boolean;
  isInModal?: boolean;
}

const DemandCardItem: React.FC<DemandCardItemProps> = ({
  demand,
  memberMap,
  onViewDemand,
  onEditDemand,
  onDeleteDemand,
  onUpdateStatus,
  columnStatus,
  isOverdue,
  isInModal = false,
}) => {
  const assignee = memberMap.get(demand.assignee_id);
  const deadline = analyzeDeadline(demand.due_date, demand.status);
  const priorityInfo = getPriorityBadge(demand.priority);
  const nextStatus = getNextStatus(demand.status);
  const prevStatus = getPrevStatus(demand.status);

  return (
    <div
      onClick={() => onViewDemand(demand)}
      className={`group relative bg-white dark:bg-slate-900 rounded-xl p-3 border transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer select-none overflow-hidden ${
        deadline.status === 'overdue' && demand.status !== 'Concluído'
          ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-400/30'
          : deadline.status === 'due-soon' && demand.status !== 'Concluído'
          ? 'border-amber-300 dark:border-amber-900/60'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-400'
      }`}
    >
      {/* Top Badges: Category & Priority */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getCategoryBadgeClass(demand.category)}`}>
          {getCategoryIcon(demand.category)}
          <span className="truncate max-w-[85px]">{demand.category}</span>
        </span>

        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${priorityInfo.className}`}>
          {priorityInfo.icon}
          <span>{priorityInfo.label}</span>
        </span>
      </div>

      {/* Title & Clickable Action */}
      <div className="mb-1.5">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors break-words flex-1 min-w-0">
            {demand.title}
          </h4>
          <span 
            className="inline-flex items-center gap-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-1 py-0.5 rounded border border-sky-200 dark:border-sky-800 shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-2xs"
            title="Abrir detalhes"
          >
            <Maximize2 className="w-2.5 h-2.5 stroke-[2.5]" />
            <span>Abrir</span>
          </span>
        </div>
      </div>

      {/* Briefing / Description */}
      {demand.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-tight break-words">
          {demand.description}
        </p>
      )}

      {/* Requester / Solicitante */}
      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 mb-2 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800 min-w-0">
        <Send className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
        <span className="text-[10px] text-slate-400 shrink-0">Para:</span>
        <span className="font-medium truncate text-[11px] text-slate-700 dark:text-slate-200 min-w-0" title={demand.requester}>
          {demand.requester}
        </span>
      </div>

      {/* Deadline Alert Box - Tidy & Organized 2-row layout */}
      <div className="mb-2.5">
        <div
          className={`p-2 rounded-lg border text-[11px] ${
            deadline.status === 'overdue'
              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/50'
              : deadline.status === 'due-soon'
              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50'
              : deadline.status === 'completed'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1 min-w-0 truncate">
              {deadline.status === 'overdue' && <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />}
              {deadline.status === 'due-soon' && <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
              {deadline.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {deadline.status === 'on-track' && <Calendar className="w-3 h-3 text-slate-500 shrink-0" />}
              <span className="font-bold text-[10px] truncate">
                {deadline.badgeLabel}
              </span>
            </div>
            {demand.due_date && (
              <span className="text-[9px] font-mono opacity-80 shrink-0">
                {formatBrazilianDate(demand.due_date).split(' ')[0]}
              </span>
            )}
          </div>
          {deadline.relativeText && (
            <div className="text-[9px] opacity-90 mt-0.5 pl-4 truncate" title={deadline.relativeText}>
              {deadline.relativeText}
            </div>
          )}
        </div>
      </div>

      {/* Assignee & Files Link */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-1.5">
          {assignee ? (
            <div 
              className="flex items-center gap-1.5 min-w-0 flex-1" 
              title={`${assignee.name} - ${assignee.role}${demand.additional_assignees && demand.additional_assignees.length > 0 ? ` (+${demand.additional_assignees.length} co-responsável(is))` : ''}`}
            >
              <div className="flex items-center -space-x-1 shrink-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-2xs shrink-0 ring-1 ring-white dark:ring-slate-900"
                  style={{ backgroundColor: assignee.avatar_color || '#3B82F6' }}
                >
                  {getInitials(assignee.name)}
                </div>
                {demand.additional_assignees && demand.additional_assignees.length > 0 && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold bg-indigo-600 text-white shadow-2xs shrink-0 ring-1 ring-white dark:ring-slate-900"
                    title={`${demand.additional_assignees.length} outro(s) responsável(is) nesta demanda`}
                  >
                    +{demand.additional_assignees.length}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 break-words leading-tight">
                {assignee.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <User className="w-3 h-3 shrink-0" />
              <span className="text-[10px]">Sem resp.</span>
            </div>
          )}

          {demand.files_link && (
            <a
              href={demand.files_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800/60 transition"
              title="Abrir arquivos de entrega (Drive, Canva, etc.)"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              <span>Arquivos</span>
            </a>
          )}
        </div>
      </div>

      {/* Card Actions Footer: Quick Move + Edit/Delete */}
      <div 
        className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Quick Status transition */}
        <div className="flex items-center gap-0.5 min-w-0">
          {prevStatus && (
            <button
              type="button"
              onClick={() => onUpdateStatus(demand.id, prevStatus)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title={`Voltar para "${prevStatus}"`}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}

          <select
            value={demand.status}
            onChange={e => onUpdateStatus(demand.id, e.target.value as DemandStatus)}
            className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[95px] truncate"
          >
            <option value="A Fazer">A Fazer</option>
            <option value="Em Produção">Em Produção</option>
            <option value="Em Revisão">Em Revisão</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Concluído">Concluído</option>
          </select>

          {nextStatus && (
            <button
              type="button"
              onClick={() => onUpdateStatus(demand.id, nextStatus)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title={`Avançar para "${nextStatus}"`}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Action buttons (Edit & Delete) firmly inside the card */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onEditDemand(demand)}
            className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Editar demanda"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteDemand(demand.id)}
            className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            title="Excluir demanda"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  demands,
  members,
  onUpdateStatus,
  onEditDemand,
  onDeleteDemand,
  onViewDemand,
  collapsibleCompleted = false,
  isCompletedExpanded: controlledCompletedExpanded,
  onToggleCompletedExpanded,
}) => {
  const [internalCompletedExpanded, setInternalCompletedExpanded] = useState(false);
  const [activeModalColumn, setActiveModalColumn] = useState<DemandStatus | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const completedExpanded = controlledCompletedExpanded !== undefined 
    ? controlledCompletedExpanded 
    : internalCompletedExpanded;

  const toggleCompleted = () => {
    if (onToggleCompletedExpanded) {
      onToggleCompletedExpanded();
    } else {
      setInternalCompletedExpanded(prev => !prev);
    }
  };

  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

  const isOverdue = (d: Demand): boolean => {
    if (d.status === 'Concluído') return false;
    if (d.status === 'Atrasado') return true;
    return analyzeDeadline(d.due_date, d.status).status === 'overdue';
  };

  const getColumnDemands = (columnStatus: DemandStatus): Demand[] => {
    let filtered: Demand[];
    if (columnStatus === 'Atrasado') {
      filtered = demands.filter(isOverdue);
    } else if (columnStatus === 'Concluído') {
      filtered = demands.filter(d => d.status === 'Concluído');
    } else {
      filtered = demands.filter(d => d.status === columnStatus && !isOverdue(d));
    }

    // Sort by latest modification date (updated_at or created_at descending)
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModalColumn) {
        setActiveModalColumn(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalColumn]);

  // Reset modal search when switching column modal
  useEffect(() => {
    setModalSearch('');
  }, [activeModalColumn]);

  // Demands for the active modal window
  const modalColumnDemands = useMemo(() => {
    if (!activeModalColumn) return [];
    return getColumnDemands(activeModalColumn);
  }, [activeModalColumn, demands]);

  const filteredModalDemands = useMemo(() => {
    if (!modalSearch.trim()) return modalColumnDemands;
    const term = modalSearch.toLowerCase().trim();
    return modalColumnDemands.filter(d => 
      d.title.toLowerCase().includes(term) ||
      d.description.toLowerCase().includes(term) ||
      d.requester.toLowerCase().includes(term) ||
      d.category.toLowerCase().includes(term)
    );
  }, [modalColumnDemands, modalSearch]);

  const activeColumnConfig = COLUMNS.find(c => c.status === activeModalColumn);

  return (
    <>
      {/* 5-Column Grid: Each column shows only the 1st most recently modified demand + 'Ver mais' button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 xl:gap-3.5 items-start">
        {COLUMNS.map(column => {
          const sortedDemands = getColumnDemands(column.status);
          const firstDemand = sortedDemands[0];
          const remainingCount = sortedDemands.length - 1;

          return (
            <div
              key={column.status}
              className="flex flex-col bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 min-h-[460px] min-w-0"
            >
              {/* Column Header - Clickable to open full column window */}
              <div 
                onClick={() => {
                  if (sortedDemands.length > 0) {
                    setActiveModalColumn(column.status);
                  }
                }}
                className={`flex items-center justify-between p-2 rounded-xl mb-2.5 border transition-all ${column.headerBg} ${column.borderColor} ${
                  sortedDemands.length > 0 ? 'cursor-pointer hover:opacity-95 select-none' : ''
                }`}
                title={sortedDemands.length > 0 ? `Clique para abrir todas as ${sortedDemands.length} demandas de ${column.title}` : undefined}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${column.dotColor}`} />
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1 truncate">
                    <span className="truncate">{column.title}</span>
                    {column.status === 'Atrasado' && (
                      <span className="text-[9px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/60 px-1 py-0.2 rounded border border-red-300 dark:border-red-800 shrink-0">
                        Urgente
                      </span>
                    )}
                  </h3>
                </div>

                {/* Counter Badge */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-all shadow-2xs ${column.badgeBg}`}
                  >
                    {sortedDemands.length}
                  </span>
                </div>
              </div>

              {/* Cards Container: Shows ONLY the first demand (latest modified) + 'Ver mais' button */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {sortedDemands.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs text-center p-3">
                    {column.status === 'Atrasado' ? (
                      <div className="flex flex-col items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-[11px]">Tudo no prazo!</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Sem atrasos</span>
                      </div>
                    ) : (
                      <span className="text-[11px]">Nenhuma demanda</span>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 1. Only the first demand card (last modified) */}
                    <DemandCardItem
                      key={firstDemand.id}
                      demand={firstDemand}
                      memberMap={memberMap}
                      onViewDemand={onViewDemand}
                      onEditDemand={onEditDemand}
                      onDeleteDemand={onDeleteDemand}
                      onUpdateStatus={onUpdateStatus}
                      columnStatus={column.status}
                      isOverdue={isOverdue(firstDemand)}
                    />

                    {/* 2. 'Ver mais' Button right below the first card */}
                    {remainingCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setActiveModalColumn(column.status)}
                        className="w-full mt-1 py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-400 dark:hover:border-sky-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow flex items-center justify-between cursor-pointer group"
                        title={`Clique para abrir janela com todas as ${sortedDemands.length} demandas desta coluna`}
                      >
                        <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                          <LayoutGrid className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>Ver mais</span>
                        </span>
                        <span className="text-[10px] font-extrabold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                          +{remainingCount}
                        </span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-400 text-center py-1 font-medium">
                        (Única demanda nesta coluna)
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nova Janela (Modal): Shows ALL demands of the clicked column in a Left-to-Right, Top-to-Bottom Grid */}
      {activeModalColumn && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModalColumn(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                  style={{ 
                    backgroundColor: activeColumnConfig?.status === 'Atrasado' ? '#EF4444' : 
                      activeColumnConfig?.status === 'A Fazer' ? '#64748B' : 
                      activeColumnConfig?.status === 'Em Produção' ? '#3B82F6' : 
                      activeColumnConfig?.status === 'Em Revisão' ? '#F59E0B' : 
                      '#10B981' 
                  }}
                >
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Demandas: {activeModalColumn}
                    </h2>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {modalColumnDemands.length} {modalColumnDemands.length === 1 ? 'demanda' : 'demandas'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Organizado da esquerda para a direita, de cima para baixo (última modificação)
                  </p>
                </div>
              </div>

              {/* Quick Search & Close button */}
              <div className="flex items-center gap-3">
                <div className="relative hidden sm:block">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder="Filtrar nesta etapa..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 w-52"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalColumn(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Fechar Janela"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Left-to-Right, Top-to-Bottom Grid Layout */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">
              {filteredModalDemands.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-medium">Nenhuma demanda encontrada nesta etapa com o filtro aplicado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 items-start">
                  {filteredModalDemands.map(demand => (
                    <DemandCardItem
                      key={demand.id}
                      demand={demand}
                      memberMap={memberMap}
                      onViewDemand={onViewDemand}
                      onEditDemand={onEditDemand}
                      onDeleteDemand={onDeleteDemand}
                      onUpdateStatus={onUpdateStatus}
                      columnStatus={activeModalColumn}
                      isOverdue={isOverdue(demand)}
                      isInModal={true}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
              <span>
                Mostrando {filteredModalDemands.length} de {modalColumnDemands.length} demandas em {activeModalColumn}
              </span>
              <button
                type="button"
                onClick={() => setActiveModalColumn(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

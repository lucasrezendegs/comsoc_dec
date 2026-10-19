import React from 'react';
import { 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  User,
  Send,
  Calendar,
  Maximize2
} from 'lucide-react';
import { Demand, DemandStatus, TeamMember } from '../types';
import { analyzeDeadline } from '../utils/dateUtils';
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
}

interface ColumnConfig {
  status: DemandStatus;
  title: string;
  borderColor: string;
  headerBg: string;
  badgeBg: string;
  accentText: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'A Fazer',
    title: 'A Fazer',
    borderColor: 'border-slate-300 dark:border-slate-700',
    headerBg: 'bg-slate-100/80 dark:bg-slate-800/80',
    badgeBg: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    accentText: 'text-slate-600 dark:text-slate-400',
  },
  {
    status: 'Em Produção',
    title: 'Em Produção',
    borderColor: 'border-blue-300 dark:border-blue-800',
    headerBg: 'bg-blue-50/80 dark:bg-blue-950/40',
    badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
  {
    status: 'Em Revisão',
    title: 'Em Revisão / Aprovação',
    borderColor: 'border-amber-300 dark:border-amber-800',
    headerBg: 'bg-amber-50/80 dark:bg-amber-950/40',
    badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
  {
    status: 'Concluído',
    title: 'Concluído',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    accentText: 'text-emerald-600 dark:text-emerald-400',
  },
];

const STATUS_ORDER: DemandStatus[] = ['A Fazer', 'Em Produção', 'Em Revisão', 'Concluído'];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  demands,
  members,
  onUpdateStatus,
  onEditDemand,
  onDeleteDemand,
  onViewDemand,
}) => {
  const memberMap = new Map(members.map(m => [m.id, m]));

  const getNextStatus = (current: DemandStatus): DemandStatus | null => {
    const idx = STATUS_ORDER.indexOf(current);
    if (idx >= 0 && idx < STATUS_ORDER.length - 1) {
      return STATUS_ORDER[idx + 1];
    }
    return null;
  };

  const getPrevStatus = (current: DemandStatus): DemandStatus | null => {
    const idx = STATUS_ORDER.indexOf(current);
    if (idx > 0) {
      return STATUS_ORDER[idx - 1];
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
      {COLUMNS.map(column => {
        const columnDemands = demands.filter(d => d.status === column.status);

        return (
          <div
            key={column.status}
            className="flex flex-col bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 min-h-[500px]"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between p-3 rounded-xl mb-3.5 border ${column.headerBg} ${column.borderColor}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  column.status === 'A Fazer' ? 'bg-slate-400' :
                  column.status === 'Em Produção' ? 'bg-blue-500 animate-pulse' :
                  column.status === 'Em Revisão' ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`} />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {column.title}
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${column.badgeBg}`}>
                {columnDemands.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex flex-col gap-3 flex-1">
              {columnDemands.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs">
                  <span>Nenhuma demanda aqui</span>
                </div>
              ) : (
                columnDemands.map(demand => {
                  const assignee = memberMap.get(demand.assignee_id);
                  const deadline = analyzeDeadline(demand.due_date, demand.status);
                  const priorityInfo = getPriorityBadge(demand.priority);
                  const nextStatus = getNextStatus(demand.status);
                  const prevStatus = getPrevStatus(demand.status);

                  return (
                    <div
                      key={demand.id}
                      onClick={() => onViewDemand(demand)}
                      className={`group relative bg-white dark:bg-slate-900 rounded-xl p-3.5 border transition-all duration-200 shadow-xs hover:shadow-lg cursor-pointer select-none ${
                        deadline.status === 'overdue' && demand.status !== 'Concluído'
                          ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-400/30'
                          : deadline.status === 'due-soon' && demand.status !== 'Concluído'
                          ? 'border-amber-300 dark:border-amber-900/60'
                          : 'border-slate-200/90 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-400'
                      }`}
                    >
                      {/* Top Badges: Category & Priority */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadgeClass(demand.category)}`}>
                          {getCategoryIcon(demand.category)}
                          <span className="truncate max-w-[120px]">{demand.category}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${priorityInfo.className}`}>
                            {priorityInfo.icon}
                            <span>{priorityInfo.label}</span>
                          </span>
                        </div>
                      </div>

                      {/* Explicit Clickable Title Button with Hover & Abrir Janela Action */}
                      <div className="mb-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDemand(demand);
                          }}
                          className="w-full text-left font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors cursor-pointer flex items-start justify-between gap-2 focus:outline-none"
                          title="Clique para abrir esta demanda em uma janela completa"
                        >
                          <span className="flex-1 hover:underline">{demand.title}</span>
                          <span 
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800 shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-2xs"
                            title="Abrir detalhes em uma janela"
                          >
                            <Maximize2 className="w-3 h-3 stroke-[2.5]" />
                            <span>Abrir</span>
                          </span>
                        </button>
                      </div>

                      {/* Briefing / Description */}
                      {demand.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2.5 leading-relaxed">
                          {demand.description}
                        </p>
                      )}

                      {/* Requester / Solicitante */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-2.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <Send className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span className="text-[11px] text-slate-400">Entregar para:</span>
                        <span className="font-medium truncate text-[11px]">{demand.requester}</span>
                      </div>

                      {/* Deadline Alert Badge */}
                      <div className="mb-3">
                        <div
                          className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border ${
                            deadline.status === 'overdue'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/50 font-semibold'
                              : deadline.status === 'due-soon'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50 font-medium'
                              : deadline.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {deadline.status === 'overdue' && <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />}
                            {deadline.status === 'due-soon' && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                            {deadline.status === 'on-track' && <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                            <span className="text-[11px] font-medium">{deadline.badgeLabel}</span>
                          </div>
                          <span className="text-[11px] opacity-90">{deadline.relativeText}</span>
                        </div>
                      </div>

                      {/* Assignee & Files Link */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {/* Assignee pill / stack */}
                        <div className="flex items-center gap-2">
                          {assignee ? (
                            <div 
                              className="flex items-center gap-1.5" 
                              title={`${assignee.name} - ${assignee.role}${demand.additional_assignees && demand.additional_assignees.length > 0 ? ` (+${demand.additional_assignees.length} co-responsável(is))` : ''}`}
                            >
                              <div className="flex items-center -space-x-1.5">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs shrink-0 ring-2 ring-white dark:ring-slate-900"
                                  style={{ backgroundColor: assignee.avatar_color || '#3B82F6' }}
                                >
                                  {getInitials(assignee.name)}
                                </div>
                                {demand.additional_assignees && demand.additional_assignees.length > 0 && (
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold bg-indigo-600 text-white shadow-xs shrink-0 ring-2 ring-white dark:ring-slate-900"
                                    title={`${demand.additional_assignees.length} outro(s) responsável(is) nesta demanda`}
                                  >
                                    +{demand.additional_assignees.length}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[85px]">
                                {assignee.name.split(' ')[0]}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <User className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Sem responsável</span>
                            </div>
                          )}
                        </div>

                        {/* Files link if present */}
                        {demand.files_link && (
                          <a
                            href={demand.files_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-1 rounded-md border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 transition"
                            title="Abrir arquivos de entrega (Drive, Canva, etc.)"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Arquivos</span>
                          </a>
                        )}
                      </div>

                      {/* Card Actions Footer: Quick Move + Edit/Delete */}
                      <div 
                        className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Quick Status transition */}
                        <div className="flex items-center gap-1">
                          {prevStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(demand.id, prevStatus)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title={`Voltar para "${prevStatus}"`}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <select
                            value={demand.status}
                            onChange={e => onUpdateStatus(demand.id, e.target.value as DemandStatus)}
                            className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                          >
                            {STATUS_ORDER.map(s => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          {nextStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(demand.id, nextStatus)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title={`Avançar para "${nextStatus}"`}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditDemand(demand)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Editar demanda"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDemand(demand.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                            title="Excluir demanda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

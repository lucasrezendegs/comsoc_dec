import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Calendar,
  Send,
  User,
  Maximize2
} from 'lucide-react';
import { Demand, DemandPriority, DemandStatus, TeamMember } from '../types';
import { analyzeDeadline, formatBrazilianDate } from '../utils/dateUtils';
import { 
  getCategoryIcon, 
  getCategoryBadgeClass, 
  getPriorityBadge, 
  getInitials 
} from '../utils/styleHelpers';

interface ListViewProps {
  demands: Demand[];
  members: TeamMember[];
  onUpdateStatus: (id: string, newStatus: DemandStatus) => void;
  onEditDemand: (demand: Demand) => void;
  onDeleteDemand: (id: string) => void;
  onViewDemand: (demand: Demand) => void;
}

type SortField = 'due_date' | 'priority' | 'status' | 'title';

export const ListView: React.FC<ListViewProps> = ({
  demands,
  members,
  onUpdateStatus,
  onEditDemand,
  onDeleteDemand,
  onViewDemand,
}) => {
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const memberMap = new Map(members.map(m => [m.id, m]));

  const priorityWeights: Record<DemandPriority, number> = {
    'Urgente': 4,
    'Alta': 3,
    'Média': 2,
    'Baixa': 1,
  };

  const statusWeights: Record<DemandStatus, number> = {
    'A Fazer': 1,
    'Em Produção': 2,
    'Em Revisão': 3,
    'Concluído': 4,
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedDemands = [...demands].sort((a, b) => {
    let diff = 0;
    if (sortField === 'due_date') {
      const getTimestamp = (dateStr?: string) => {
        if (!dateStr) return sortAsc ? Infinity : -Infinity;
        if (!dateStr.includes('T')) {
          const parts = dateStr.split('-').map(Number);
          return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59).getTime();
        }
        return new Date(dateStr).getTime() || (sortAsc ? Infinity : -Infinity);
      };
      diff = getTimestamp(a.due_date) - getTimestamp(b.due_date);
    } else if (sortField === 'priority') {
      diff = priorityWeights[b.priority] - priorityWeights[a.priority];
    } else if (sortField === 'status') {
      diff = statusWeights[a.status] - statusWeights[b.status];
    } else if (sortField === 'title') {
      diff = a.title.localeCompare(b.title);
    }
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <th 
                onClick={() => handleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tarefa (Clique p/ Abrir Janela)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Categoria</th>
              <th className="py-3 px-3">Entregar Para (Solicitante)</th>
              <th className="py-3 px-3">Responsável</th>
              <th 
                onClick={() => handleSort('due_date')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition min-w-[150px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Prazo de Entrega</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('priority')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Prioridade</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('status')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition min-w-[140px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Arquivos</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {sortedDemands.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  Nenhuma demanda encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              sortedDemands.map(demand => {
                const assignee = memberMap.get(demand.assignee_id);
                const deadline = analyzeDeadline(demand.due_date, demand.status);
                const priorityInfo = getPriorityBadge(demand.priority);

                return (
                  <tr
                    key={demand.id}
                    onClick={() => onViewDemand(demand)}
                    className={`cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group select-none ${
                      deadline.status === 'overdue' && demand.status !== 'Concluído'
                        ? 'bg-red-50/20 dark:bg-red-950/10'
                        : ''
                    }`}
                  >
                    {/* Tarefa & Briefing with explicit clickable button */}
                    <td className="py-3 px-4 max-w-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDemand(demand);
                        }}
                        className="w-full text-left font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between gap-2 cursor-pointer focus:outline-none"
                        title="Clique para abrir detalhes desta demanda em uma janela completa"
                      >
                        <span className="hover:underline">{demand.title}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800 shrink-0 group-hover:bg-sky-600 group-hover:text-white transition">
                          <Maximize2 className="w-3 h-3" />
                          <span>Abrir</span>
                        </span>
                      </button>
                      {demand.description && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">
                          {demand.description}
                        </div>
                      )}
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${getCategoryBadgeClass(demand.category)}`}>
                        {getCategoryIcon(demand.category)}
                        <span className="whitespace-nowrap">{demand.category}</span>
                      </span>
                    </td>

                    {/* Solicitante */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium max-w-[180px] truncate">
                        <Send className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate">{demand.requester}</span>
                      </div>
                    </td>

                    {/* Responsável */}
                    <td className="py-3 px-3">
                      {assignee ? (
                        <div 
                          className="flex items-center gap-1.5" 
                          title={`${assignee.name} - ${assignee.role}${demand.additional_assignees && demand.additional_assignees.length > 0 ? ` (+${demand.additional_assignees.length} co-responsável(is))` : ''}`}
                        >
                          <div className="flex items-center -space-x-1.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ring-1 ring-white dark:ring-slate-900"
                              style={{ backgroundColor: assignee.avatar_color || '#3B82F6' }}
                            >
                              {getInitials(assignee.name)}
                            </div>
                            {demand.additional_assignees && demand.additional_assignees.length > 0 && (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold bg-indigo-600 text-white shrink-0 ring-1 ring-white dark:ring-slate-900"
                                title={`+${demand.additional_assignees.length} co-responsável(is)`}
                              >
                                +{demand.additional_assignees.length}
                              </div>
                            )}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap text-xs">
                            {assignee.name.split(' ')[0]} {assignee.name.split(' ')[1] || ''}
                            {demand.additional_assignees && demand.additional_assignees.length > 0 ? (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold ml-1">
                                (+{demand.additional_assignees.length})
                              </span>
                            ) : null}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          <span className="text-[11px]">A definir</span>
                        </div>
                      )}
                    </td>

                    {/* Prazo com alerta */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatBrazilianDate(demand.due_date)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              deadline.status === 'overdue'
                                ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800'
                                : deadline.status === 'due-soon'
                                ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                                : deadline.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {deadline.status === 'overdue' && <AlertTriangle className="w-2.5 h-2.5" />}
                            {deadline.status === 'due-soon' && <Clock className="w-2.5 h-2.5" />}
                            <span>{deadline.badgeLabel}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {deadline.relativeText}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Prioridade */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${priorityInfo.className}`}>
                        {priorityInfo.icon}
                        <span>{priorityInfo.label}</span>
                      </span>
                    </td>

                    {/* Status interativo na tabela */}
                    <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={demand.status}
                        onChange={e => onUpdateStatus(demand.id, e.target.value as DemandStatus)}
                        className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-all cursor-pointer ${
                          demand.status === 'Concluído'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : demand.status === 'Em Produção'
                            ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                            : demand.status === 'Em Revisão'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <option value="A Fazer">A Fazer</option>
                        <option value="Em Produção">Em Produção</option>
                        <option value="Em Revisão">Em Revisão</option>
                        <option value="Concluído">Concluído</option>
                      </select>
                    </td>

                    {/* Arquivos */}
                    <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                      {demand.files_link ? (
                        <a
                          href={demand.files_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition"
                          title="Abrir pasta de arquivos"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">-</span>
                      )}
                    </td>

                    {/* Ações: Abrir Janela, Editar, Excluir */}
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDemand(demand)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition cursor-pointer"
                          title="Abrir Janela da Demanda"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditDemand(demand)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Editar demanda"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDemand(demand.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Excluir demanda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

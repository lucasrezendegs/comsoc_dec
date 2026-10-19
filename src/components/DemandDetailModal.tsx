import React, { useEffect } from 'react';
import { 
  X, 
  Send, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  User, 
  Edit3, 
  Trash2, 
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  Maximize2,
  Users
} from 'lucide-react';
import { Demand, DemandStatus, TeamMember } from '../types';
import { analyzeDeadline, formatBrazilianDate } from '../utils/dateUtils';
import { getAllDemandAssignees } from '../utils/assigneeHelpers';
import { 
  getCategoryIcon, 
  getCategoryBadgeClass, 
  getPriorityBadge, 
  getInitials 
} from '../utils/styleHelpers';
import { useToast } from './Toast';

interface DemandDetailModalProps {
  demand: Demand | null;
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  onUpdateStatus: (id: string, newStatus: DemandStatus) => void;
  onEditDemand: (demand: Demand) => void;
  onDeleteDemand: (id: string) => void;
}

const STATUS_OPTIONS: DemandStatus[] = ['A Fazer', 'Em Produção', 'Em Revisão', 'Concluído'];

export const DemandDetailModal: React.FC<DemandDetailModalProps> = ({
  demand,
  isOpen,
  onClose,
  members,
  onUpdateStatus,
  onEditDemand,
  onDeleteDemand,
}) => {
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !demand) return null;

  const assignee = members.find(m => m.id === demand.assignee_id);
  const allAssignees = getAllDemandAssignees(demand, members);
  const deadline = analyzeDeadline(demand.due_date, demand.status);
  const priorityInfo = getPriorityBadge(demand.priority);

  const handleEdit = () => {
    onClose();
    onEditDemand(demand);
  };

  const handleDelete = () => {
    onClose();
    onDeleteDemand(demand.id);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 transition-all ring-1 ring-black/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Window Titlebar with OS style dots & ultra-clear Close Button */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/90">
          <div className="flex items-center gap-2.5">
            {/* Window control dots: red dot clicks to close */}
            <div className="flex items-center gap-1.5 mr-1">
              <button
                type="button"
                onClick={onClose}
                className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center text-[8px] text-white cursor-pointer shadow-2xs"
                title="Fechar Janela"
              >
                ✕
              </button>
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 opacity-80" />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 opacity-80" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Janela da Demanda
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                {demand.id}
              </span>
            </div>
          </div>

          {/* Prominent High-Contrast Close Window Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition shadow-sm cursor-pointer"
            title="Fechar esta janela e voltar ao painel"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Fechar Janela</span>
          </button>
        </div>

        {/* Informative helper banner */}
        <div className="px-5 py-2 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-xs text-sky-800 dark:text-sky-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold">💡 Janela de Detalhes:</span>
            <span>Visualize ou altere as informações da demanda abaixo.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer hidden sm:block"
          >
            Clique aqui para fechar
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-sm max-h-[72vh] overflow-y-auto scrollbar-thin">
          {/* Top Badges: Category, Priority and Interactive Status */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${getCategoryBadgeClass(demand.category)}`}>
                {getCategoryIcon(demand.category)}
                <span>{demand.category}</span>
              </span>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${priorityInfo.className}`}>
                {priorityInfo.icon}
                <span>Prioridade {priorityInfo.label}</span>
              </span>
            </div>

            {/* Quick interactive status switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 pl-1.5">Status:</span>
              <select
                value={demand.status}
                onChange={e => onUpdateStatus(demand.id, e.target.value as DemandStatus)}
                className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-all cursor-pointer focus:outline-none ${
                  demand.status === 'Concluído'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                    : demand.status === 'Em Produção'
                    ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                    : demand.status === 'Em Revisão'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-white text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                }`}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Full Title */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Título da Tarefa
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {demand.title}
            </h2>
          </div>

          {/* Key Details Grid: Solicitante, Responsável & Prazo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Solicitante */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Entregar Para (Solicitante)
              </span>
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <Send className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="leading-snug">{demand.requester}</span>
              </div>
            </div>

            {/* Responsável Principal */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Responsável
                </span>
                {demand.additional_assignees && demand.additional_assignees.length > 0 && (
                  <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-1.5 py-0.2 rounded">
                    +{demand.additional_assignees.length} co-resp.
                  </span>
                )}
              </div>
              {assignee ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0"
                    style={{ backgroundColor: assignee.avatar_color || '#3B82F6' }}
                  >
                    {getInitials(assignee.name)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">
                      {assignee.name}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {assignee.role}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <User className="w-4 h-4" />
                  <span>Não atribuído</span>
                </div>
              )}
            </div>

            {/* Prazo */}
            <div className={`p-3.5 rounded-2xl border ${
              deadline.status === 'overdue'
                ? 'bg-red-50/80 border-red-200 dark:bg-red-950/40 dark:border-red-900/60 text-red-900 dark:text-red-200'
                : deadline.status === 'due-soon'
                ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                : deadline.status === 'completed'
                ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}>
              <span className="text-[11px] font-semibold opacity-75 uppercase tracking-wider block mb-1">
                Prazo de Entrega
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {deadline.status === 'overdue' && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
                {deadline.status === 'due-soon' && <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                {deadline.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                <span>{formatBrazilianDate(demand.due_date)}</span>
              </div>
              <span className="text-[11px] opacity-80 block mt-0.5">
                {deadline.badgeLabel} • {deadline.relativeText}
              </span>
            </div>
          </div>

          {/* Equipe Responsável e Atribuições Individuais */}
          {allAssignees.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>
                    Equipe Responsável {allAssignees.length > 1 ? `(${allAssignees.length} pessoas)` : ''}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {allAssignees.length > 1 
                    ? 'Tarefas e atribuições de cada responsável nesta demanda'
                    : 'Responsável atribuído'}
                </span>
              </div>

              <div className={`grid gap-3 ${allAssignees.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {allAssignees.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0"
                          style={{ backgroundColor: item.member.avatar_color || '#3B82F6' }}
                        >
                          {getInitials(item.member.name)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {item.member.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.member.role}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                          item.isPrimary
                            ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800'
                        }`}
                      >
                        {item.isPrimary ? 'Responsável Principal' : 'Co-responsável'}
                      </span>
                    </div>

                    {/* Descrição do que a pessoa fará */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        {item.isPrimary ? 'Atribuição / Foco:' : 'O que terá que fazer:'}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                        {item.roleDescription || (item.isPrimary ? 'Coordenação geral e entrega final da demanda.' : 'Apoio e execução técnica na demanda.')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description / Briefing Completo */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Descrição / Briefing da Demanda</span>
            </span>
            {demand.description?.trim() ? (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                {demand.description}
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 italic text-xs">
                Nenhuma descrição ou briefing detalhado foi informado para esta demanda.
              </p>
            )}
          </div>

          {/* Files link if present */}
          {demand.files_link && (
            <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block">
                  Arquivos de Entrega / Referência
                </span>
                <span className="text-[11px] text-sky-700 dark:text-sky-400 truncate max-w-sm block font-mono">
                  {demand.files_link}
                </span>
              </div>
              <a
                href={demand.files_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs shrink-0 self-start sm:self-center"
              >
                <span>Acessar Arquivos</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Criado em: {formatBrazilianDate(demand.created_at)}</span>
            {demand.updated_at && (
              <span>Última atualização: {formatBrazilianDate(demand.updated_at)}</span>
            )}
          </div>
        </div>

        {/* Footer actions with prominent "Fechar Janela" and tools */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar Demanda</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition shadow-sm ml-auto cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Fechar Janela</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  User, 
  CheckCircle2, 
  Loader2, 
  CircleDashed, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Send, 
  Plus,
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
import { useToast } from './Toast';

interface MemberDemandsViewProps {
  members: TeamMember[];
  demands: Demand[];
  activeProfileId: string;
  onUpdateStatus: (id: string, newStatus: DemandStatus) => void;
  onEditDemand: (demand: Demand) => void;
  onDeleteDemand: (id: string) => void;
  onNewDemandForMember: (memberId: string) => void;
  onViewDemand: (demand: Demand) => void;
}

export const MemberDemandsView: React.FC<MemberDemandsViewProps> = ({
  members,
  demands,
  activeProfileId,
  onUpdateStatus,
  onEditDemand,
  onDeleteDemand,
  onNewDemandForMember,
  onViewDemand,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(activeProfileId || members[0]?.id || '');
  const { showToast } = useToast();

  // If activeProfileId changes and was the default, sync it
  useEffect(() => {
    if (activeProfileId) {
      setSelectedMemberId(activeProfileId);
    } else if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [activeProfileId, members]);

  const selectedMember = members.find(m => m.id === selectedMemberId) || members[0];

  // All demands for the selected person
  const memberDemands = demands.filter(d => d.assignee_id === selectedMember?.id);

  // Stats for the selected person
  const pendingDemands = memberDemands.filter(d => d.status === 'A Fazer');
  const inProductionDemands = memberDemands.filter(d => d.status === 'Em Produção');
  const inReviewDemands = memberDemands.filter(d => d.status === 'Em Revisão');
  const completedDemands = memberDemands.filter(d => d.status === 'Concluído');
  const activeDemands = memberDemands.filter(d => d.status !== 'Concluído');

  // Urgency sorted demands (overdue, due-soon first, then date)
  const sortedDemands = [...memberDemands].sort((a, b) => {
    // Completed goes to bottom
    if (a.status === 'Concluído' && b.status !== 'Concluído') return 1;
    if (b.status === 'Concluído' && a.status !== 'Concluído') return -1;

    const analysisA = analyzeDeadline(a.due_date, a.status);
    const analysisB = analyzeDeadline(b.due_date, b.status);

    const urgencyScore = (status: string) => {
      if (status === 'overdue') return 3;
      if (status === 'due-soon') return 2;
      return 1;
    };

    const diffUrgency = urgencyScore(analysisB.status) - urgencyScore(analysisA.status);
    if (diffUrgency !== 0) return diffUrgency;

    const timeA = new Date(a.due_date).getTime() || 0;
    const timeB = new Date(b.due_date).getTime() || 0;
    return timeA - timeB;
  });

  if (!selectedMember) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
        Nenhum membro cadastrado na equipe. Acesse a aba "Equipe da Seção" para cadastrar integrantes.
      </div>
    );
  }

  const completionRate = memberDemands.length > 0 
    ? Math.round((completedDemands.length / memberDemands.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. Horizontal Team Member Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 px-1">
          Integrantes da Seção (Clique para alternar visão)
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {members.map(member => {
            const isSelected = member.id === selectedMember.id;
            const isMyProfile = member.id === activeProfileId;
            const memberActiveCount = demands.filter(
              d => d.assignee_id === member.id && d.status !== 'Concluído'
            ).length;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border-slate-900 dark:border-sky-500/80 shadow-md ring-2 ring-sky-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0"
                  style={{ backgroundColor: member.avatar_color || '#3B82F6' }}
                >
                  {getInitials(member.name)}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs leading-none">
                      {member.name.split(' ')[0]} {member.name.split(' ')[1] || ''}
                    </span>
                    {isMyProfile && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isSelected ? 'bg-sky-400 text-slate-950' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                      }`}>
                        EU
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] truncate max-w-[120px] mt-0.5 ${
                    isSelected ? 'text-slate-300 dark:text-slate-400' : 'text-slate-400'
                  }`}>
                    {member.role.split('/')[0].trim()}
                  </span>
                </div>
                <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                  memberActiveCount > 0
                    ? isSelected 
                      ? 'bg-white/20 text-white' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {memberActiveCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Member Profile & Workload Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0 border-2 border-white/20"
              style={{ backgroundColor: selectedMember.avatar_color || '#3B82F6' }}
            >
              {getInitials(selectedMember.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {selectedMember.name}
                </h2>
                {selectedMember.id === activeProfileId && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-sky-500/30 text-sky-300 border border-sky-400/30 rounded-md">
                    Seu Perfil Ativo
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-sm mt-0.5">
                {selectedMember.role}
              </p>
              {selectedMember.email && (
                <p className="text-slate-400 text-xs mt-0.5 font-mono">
                  {selectedMember.email}
                </p>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => onNewDemandForMember(selectedMember.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 active:scale-95 text-white transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Atribuir Demanda</span>
            </button>
          </div>
        </div>

        {/* Workload Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-700/60">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Pendentes (A Fazer)</span>
              <CircleDashed className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-100">{pendingDemands.length}</div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-blue-900/40">
            <div className="flex items-center justify-between text-blue-300 text-xs mb-1">
              <span>Em Produção</span>
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            </div>
            <div className="text-xl font-bold text-blue-300">{inProductionDemands.length}</div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-amber-900/40">
            <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
              <span>Em Revisão</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-300">{inReviewDemands.length}</div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-emerald-900/40">
            <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
              <span>Concluídas</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-300">{completedDemands.length}</div>
          </div>
        </div>

        {/* Workload completion progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span>Carga de trabalho ativa:</span>
            <span className="font-bold text-white">{activeDemands.length} demandas</span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-400 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-slate-300">{completionRate}% entregue</span>
          </div>
        </div>
      </div>

      {/* 3. Demand List for this Member - Prioritized by Urgency */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Demandas de {selectedMember.name} ({memberDemands.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Clique em qualquer demanda para abrir a janela completa
          </span>
        </div>

        {sortedDemands.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
              Tudo em dia para {selectedMember.name.split(' ')[0]}!
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Nenhuma demanda atribuída no momento. Clique no botão abaixo para adicionar uma tarefa para este integrante.
            </p>
            <button
              type="button"
              onClick={() => onNewDemandForMember(selectedMember.id)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Demanda</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDemands.map(demand => {
              const deadline = analyzeDeadline(demand.due_date, demand.status);
              const priorityInfo = getPriorityBadge(demand.priority);

              return (
                <div
                  key={demand.id}
                  onClick={() => onViewDemand(demand)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 shadow-xs hover:shadow-lg cursor-pointer group select-none ${
                    deadline.status === 'overdue' && demand.status !== 'Concluído'
                      ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-400/30'
                      : deadline.status === 'due-soon' && demand.status !== 'Concluído'
                      ? 'border-amber-300 dark:border-amber-900/60'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-400'
                  }`}
                >
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadgeClass(demand.category)}`}>
                      {getCategoryIcon(demand.category)}
                      <span className="truncate max-w-[130px]">{demand.category}</span>
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${priorityInfo.className}`}>
                      {priorityInfo.icon}
                      <span>{priorityInfo.label}</span>
                    </span>
                  </div>

                  {/* Explicit Clickable Title Button */}
                  <div className="mb-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDemand(demand);
                      }}
                      className="w-full text-left font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors cursor-pointer flex items-start justify-between gap-2 focus:outline-none"
                      title="Clique para abrir detalhes completos desta demanda em uma janela"
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

                  {/* Briefing */}
                  {demand.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                      {demand.description}
                    </p>
                  )}

                  {/* Solicitante */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Send className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="text-[11px] text-slate-400">Entregar para:</span>
                    <span className="font-semibold text-[11px] truncate">{demand.requester}</span>
                  </div>

                  {/* Deadline box */}
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
                      <span className="text-[11px]">{deadline.relativeText}</span>
                    </div>
                  </div>

                  {/* Files and Status Changer */}
                  <div 
                    className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80"
                    onClick={e => e.stopPropagation()}
                  >
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

                    <div className="flex items-center gap-1">
                      {demand.files_link && (
                        <a
                          href={demand.files_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition cursor-pointer"
                          title="Abrir arquivos de entrega"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
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
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDemand(demand.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

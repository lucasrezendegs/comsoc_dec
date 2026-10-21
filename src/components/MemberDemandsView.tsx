import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  CircleDashed, 
  Clock, 
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Demand, DemandStatus, DisplayMode, TeamMember } from '../types';
import { isMemberAssignedToDemand } from '../utils/assigneeHelpers';
import { getInitials } from '../utils/styleHelpers';
import { FilterBar } from './FilterBar';
import { KanbanBoard } from './KanbanBoard';
import { ListView } from './ListView';

interface MemberDemandsViewProps {
  members: TeamMember[];
  demands: Demand[];
  selectedMemberId?: string;
  onSelectMemberId?: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: DemandStatus) => void;
  onEditDemand: (demand: Demand) => void;
  onDeleteDemand: (id: string) => void;
  onNewDemandForMember: (memberId: string) => void;
  onViewDemand: (demand: Demand) => void;
}

export const MemberDemandsView: React.FC<MemberDemandsViewProps> = ({
  members,
  demands,
  selectedMemberId: controlledSelectedMemberId,
  onSelectMemberId,
  onUpdateStatus,
  onEditDemand,
  onDeleteDemand,
  onNewDemandForMember,
  onViewDemand,
}) => {
  const [internalSelectedMemberId, setInternalSelectedMemberId] = useState<string>(members[0]?.id || '');
  
  // Layout and display mode: Kanban or Lista / Planilha (identical to Visão Geral)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('kanban');

  // Filter states (identical to Visão Geral)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Collapsible completed list state: defaults to false (hidden/oculta)
  const [isCompletedExpanded, setIsCompletedExpanded] = useState<boolean>(false);

  const selectedMemberId = controlledSelectedMemberId !== undefined ? controlledSelectedMemberId : internalSelectedMemberId;
  const setSelectedMemberId = (id: string) => {
    setInternalSelectedMemberId(id);
    onSelectMemberId?.(id);
  };

  useEffect(() => {
    if (members.length > 0 && (!selectedMemberId || !members.some(m => m.id === selectedMemberId))) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  const selectedMember = members.find(m => m.id === selectedMemberId) || members[0];

  // All demands for the selected person (primary or co-responsible)
  const memberDemands = useMemo(() => {
    if (!selectedMember) return [];
    return demands.filter(d => isMemberAssignedToDemand(d, selectedMember.id));
  }, [demands, selectedMember]);

  // Filtered demands for the selected person based on search and filters
  const filteredMemberDemands = useMemo(() => {
    return memberDemands.filter(demand => {
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = demand.title.toLowerCase().includes(q);
        const matchDesc = demand.description?.toLowerCase().includes(q);
        const matchReq = demand.requester.toLowerCase().includes(q);
        const matchRoleDesc = demand.additional_assignees?.some(
          a => a.role_description?.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchDesc && !matchReq && !matchRoleDesc) return false;
      }

      // Dropdown filters
      if (selectedCategory && demand.category !== selectedCategory) return false;
      if (selectedPriority && demand.priority !== selectedPriority) return false;
      if (selectedStatus && demand.status !== selectedStatus) return false;

      return true;
    });
  }, [memberDemands, searchTerm, selectedCategory, selectedPriority, selectedStatus]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedCategory || selectedPriority || selectedStatus
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPriority('');
    setSelectedStatus('');
  };

  // Stats for the selected person
  const pendingDemands = memberDemands.filter(d => d.status === 'A Fazer');
  const inProductionDemands = memberDemands.filter(d => d.status === 'Em Produção');
  const inReviewDemands = memberDemands.filter(d => d.status === 'Em Revisão');
  const completedDemands = memberDemands.filter(d => d.status === 'Concluído');
  const activeDemands = memberDemands.filter(d => d.status !== 'Concluído');

  const completionRate = memberDemands.length > 0 
    ? Math.round((completedDemands.length / memberDemands.length) * 100) 
    : 0;

  if (!selectedMember) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
        Nenhum membro cadastrado na equipe. Acesse a aba "Equipe da Seção" para cadastrar integrantes.
      </div>
    );
  }

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
            const memberActiveCount = demands.filter(
              d => isMemberAssignedToDemand(d, member.id) && d.status !== 'Concluído'
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
                  <span className="font-semibold text-xs leading-none whitespace-nowrap">
                    {member.name}
                  </span>
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
                <span className="text-[11px] font-semibold bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full border border-white/15">
                  {memberDemands.length} {memberDemands.length === 1 ? 'demanda no total' : 'demandas no total'}
                </span>
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

          {/* Clickable Concluídas Card (toggles the completed list) */}
          <button
            type="button"
            onClick={() => setIsCompletedExpanded(prev => !prev)}
            className="bg-slate-800/80 hover:bg-slate-800 rounded-xl p-3 border border-emerald-800/60 hover:border-emerald-500 transition-all text-left cursor-pointer group ring-1 ring-emerald-500/20 hover:ring-emerald-500/50"
            title={isCompletedExpanded ? 'Clique para recolher a lista de concluídas' : 'Clique para exibir a lista de demandas concluídas'}
          >
            <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
              <span className="flex items-center gap-1 font-semibold">
                <span>Concluídas</span>
                {isCompletedExpanded ? (
                  <ChevronUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-emerald-400" />
                )}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-emerald-300">{completedDemands.length}</span>
              <span className="text-[10px] font-semibold text-emerald-400/90 group-hover:underline">
                {isCompletedExpanded ? 'Recolher lista' : 'Ver lista'}
              </span>
            </div>
          </button>
        </div>

        {/* Workload completion progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span>Carga ativa atual:</span>
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

      {/* 3. Filter Bar (Identical to Visão Geral: search, filters, Kanban vs Lista/Planilha switch) */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedAssignee=""
        onAssigneeChange={() => {}}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        members={members}
        totalFilteredCount={filteredMemberDemands.length}
        hideAssigneeFilter={true}
      />

      {/* 4. Display Area: Kanban vs Lista / Planilha with collapsible completed list */}
      {memberDemands.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
            Tudo em dia para {selectedMember.name}!
          </h4>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            Nenhuma demanda atribuída a este integrante no momento. Clique no botão abaixo para adicionar uma tarefa.
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
      ) : displayMode === 'kanban' ? (
        <KanbanBoard
          demands={filteredMemberDemands}
          members={members}
          onUpdateStatus={onUpdateStatus}
          onEditDemand={onEditDemand}
          onDeleteDemand={onDeleteDemand}
          onViewDemand={onViewDemand}
          collapsibleCompleted={true}
          isCompletedExpanded={isCompletedExpanded}
          onToggleCompletedExpanded={() => setIsCompletedExpanded(prev => !prev)}
        />
      ) : (
        <ListView
          demands={filteredMemberDemands}
          members={members}
          onUpdateStatus={onUpdateStatus}
          onEditDemand={onEditDemand}
          onDeleteDemand={onDeleteDemand}
          onViewDemand={onViewDemand}
          collapsibleCompleted={true}
          isCompletedExpanded={isCompletedExpanded}
          onToggleCompletedExpanded={() => setIsCompletedExpanded(prev => !prev)}
        />
      )}
    </div>
  );
};

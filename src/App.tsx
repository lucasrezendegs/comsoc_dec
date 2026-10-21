import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { MemberDemandsView } from './components/MemberDemandsView';
import { TeamManagement } from './components/TeamManagement';
import { DemandModal } from './components/DemandModal';
import { DemandDetailModal } from './components/DemandDetailModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { ReportDashboard } from './components/ReportDashboard';
import { Demand, DemandStatus, DisplayMode, TeamMember, ViewTab } from './types';
import { isMemberAssignedToDemand } from './utils/assigneeHelpers';
import { 
  fetchAllDemands, 
  fetchAllTeamMembers, 
  getStoredTheme, 
  quickUpdateStatus, 
  removeDemand, 
  removeMember, 
  setStoredTheme, 
  upsertDemand, 
  upsertMember 
} from './services/storage';
import { getSupabaseClient, testSupabaseConnection } from './services/supabaseClient';
import { analyzeDeadline } from './utils/dateUtils';

function AppContent() {
  const { showToast } = useToast();

  // Core Data
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Navigation & View
  const [currentTab, setCurrentTab] = useState<ViewTab>('overview');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('kanban');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);

  // Modals
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [demandModalDefaultAssignee, setDemandModalDefaultAssignee] = useState<string>('');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [selectedDemandForDetail, setSelectedDemandForDetail] = useState<Demand | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load Initial Data
  const loadData = useCallback(async () => {
    // Check Supabase connection
    const testResult = await testSupabaseConnection();
    setIsSupabaseConnected(testResult.success);

    const [membersRes, demandsRes] = await Promise.all([
      fetchAllTeamMembers(),
      fetchAllDemands(),
    ]);

    setMembers(membersRes.members);
    setDemands(demandsRes.demands);

    if (membersRes.members.length > 0) {
      setSelectedPersonId(prev => prev || membersRes.members[0].id);
    }
  }, []);

  useEffect(() => {
    // Setup theme
    const storedTheme = getStoredTheme();
    setTheme(storedTheme);
    setStoredTheme(storedTheme);

    loadData();
  }, [loadData]);

  // Realtime subscription when Supabase is connected
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConnected) return;

    try {
      const channel = supabase
        .channel('comunica_realtime_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'demands' }, () => {
          fetchAllDemands().then(res => setDemands(res.demands));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
          fetchAllTeamMembers().then(res => setMembers(res.members));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription not available:', err);
    }
  }, [isSupabaseConnected]);

  // Handle Theme Toggle
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPriority('');
    setSelectedStatus('');
    setSelectedAssignee('');
    setKpiFilter(null);
  };

  const hasActiveFilters = Boolean(
    searchTerm || selectedCategory || selectedPriority || selectedStatus || selectedAssignee || kpiFilter
  );

  // Filtered demands for the Overview tab
  const filteredDemands = useMemo(() => {
    return demands.filter(d => {
      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(query);
        const matchesDesc = (d.description || '').toLowerCase().includes(query);
        const matchesRequester = d.requester.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesRequester) return false;
      }

      // Category
      if (selectedCategory && d.category !== selectedCategory) return false;

      // Priority
      if (selectedPriority && d.priority !== selectedPriority) return false;

      // Status
      if (selectedStatus && d.status !== selectedStatus) return false;

      // Assignee (primary or co-responsible)
      if (selectedAssignee && !isMemberAssignedToDemand(d, selectedAssignee)) return false;

      // KPI shortcut filter
      if (kpiFilter === 'ativas' && d.status === 'Concluído') return false;
      if (kpiFilter === 'Em Produção' && d.status !== 'Em Produção') return false;
      if (kpiFilter === 'Concluído' && d.status !== 'Concluído') return false;
      if (kpiFilter === 'criticos') {
        if (d.status === 'Concluído') return false;
        const analysis = analyzeDeadline(d.due_date, d.status);
        if (analysis.status !== 'overdue' && analysis.status !== 'due-soon') return false;
      }

      return true;
    });
  }, [
    demands,
    searchTerm,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    selectedAssignee,
    kpiFilter,
  ]);

  // Demand CRUD Handlers
  const handleOpenNewDemand = (assigneeId?: string) => {
    setEditingDemand(null);
    setDemandModalDefaultAssignee(assigneeId || selectedPersonId || members[0]?.id || '');
    setIsDemandModalOpen(true);
  };

  const handleEditDemand = (demand: Demand) => {
    setEditingDemand(demand);
    setIsDemandModalOpen(true);
  };

  const handleViewDemand = (demand: Demand) => {
    setSelectedDemandForDetail(demand);
    setIsDetailModalOpen(true);
  };

  const handleSaveDemand = async (demand: Demand) => {
    await upsertDemand(demand);
    setDemands(prev => {
      const idx = prev.findIndex(d => d.id === demand.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = demand;
        return copy;
      }
      return [demand, ...prev];
    });
    setSelectedDemandForDetail(prev => prev && prev.id === demand.id ? demand : prev);
  };

  const handleUpdateStatus = async (id: string, newStatus: DemandStatus) => {
    await quickUpdateStatus(id, newStatus);
    const nowIso = new Date().toISOString();
    setDemands(prev =>
      prev.map(d => {
        if (d.id === id) {
          const completedAt = newStatus === 'Concluído' ? (d.completed_at || nowIso) : undefined;
          return { ...d, status: newStatus, updated_at: nowIso, completed_at: completedAt };
        }
        return d;
      })
    );
    setSelectedDemandForDetail(prev => prev && prev.id === id ? { ...prev, status: newStatus } : prev);
    showToast(`Status atualizado para "${newStatus}"!`, 'info');
  };

  const handleDeleteDemand = async (id: string) => {
    const target = demands.find(d => d.id === id);
    if (window.confirm(`Deseja realmente excluir a demanda "${target?.title || 'selecionada'}"?`)) {
      await removeDemand(id);
      setDemands(prev => prev.filter(d => d.id !== id));
      showToast('Demanda excluída com sucesso.', 'info');
    }
  };

  // Team Member CRUD Handlers
  const handleSaveMember = async (member: TeamMember) => {
    await upsertMember(member);
    setMembers(prev => {
      const idx = prev.findIndex(m => m.id === member.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = member;
        return copy;
      }
      return [...prev, member];
    });
  };

  const handleDeleteMember = async (id: string) => {
    await removeMember(id);
    setMembers(prev => prev.filter(m => m.id !== id));
    if (selectedPersonId === id) {
      const remaining = members.filter(m => m.id !== id);
      setSelectedPersonId(remaining[0]?.id || '');
    }
  };

  const activeDemandsCount = demands.filter(d => d.status !== 'Concluído').length;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        members={members}
        onOpenNewDemand={() => handleOpenNewDemand()}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        totalActiveDemandsCount={activeDemandsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Tab 1: Visão Geral (Todas as Demandas) */}
        {currentTab === 'overview' && (
          <div className="animate-in fade-in duration-200">
            {/* KPIs */}
            <KPICards
              demands={demands}
              activeFilterStatus={kpiFilter || undefined}
              onFilterClick={status => setKpiFilter(status)}
            />

            {/* Filter Bar */}
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedAssignee={selectedAssignee}
              onAssigneeChange={setSelectedAssignee}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              members={members}
              totalFilteredCount={filteredDemands.length}
              onOpenReports={() => setCurrentTab('reports')}
            />

            {/* View Mode: Kanban vs Spreadsheet List */}
            {displayMode === 'kanban' ? (
              <KanbanBoard
                demands={filteredDemands}
                members={members}
                onUpdateStatus={handleUpdateStatus}
                onEditDemand={handleEditDemand}
                onDeleteDemand={handleDeleteDemand}
                onViewDemand={handleViewDemand}
                collapsibleCompleted={true}
              />
            ) : (
              <ListView
                demands={filteredDemands}
                members={members}
                onUpdateStatus={handleUpdateStatus}
                onEditDemand={handleEditDemand}
                onDeleteDemand={handleDeleteDemand}
                onViewDemand={handleViewDemand}
                collapsibleCompleted={true}
              />
            )}
          </div>
        )}

        {/* Tab 2: Por Pessoa / Minhas Demandas */}
        {currentTab === 'by-person' && (
          <div className="animate-in fade-in duration-200">
            <MemberDemandsView
              members={members}
              demands={demands}
              selectedMemberId={selectedPersonId}
              onSelectMemberId={setSelectedPersonId}
              onUpdateStatus={handleUpdateStatus}
              onEditDemand={handleEditDemand}
              onDeleteDemand={handleDeleteDemand}
              onNewDemandForMember={memberId => handleOpenNewDemand(memberId)}
              onViewDemand={handleViewDemand}
            />
          </div>
        )}

        {/* Tab 3: Equipe da Seção */}
        {currentTab === 'team' && (
          <div className="animate-in fade-in duration-200">
            <TeamManagement
              members={members}
              demands={demands}
              onSaveMember={handleSaveMember}
              onDeleteMember={handleDeleteMember}
              onViewMemberDemands={memberId => {
                setSelectedPersonId(memberId);
                setCurrentTab('by-person');
              }}
            />
          </div>
        )}

        {/* Tab 4: Relatórios & Indicadores de Produtividade */}
        {currentTab === 'reports' && (
          <div className="animate-in fade-in duration-200">
            <ReportDashboard
              demands={demands}
              members={members}
              onViewDemand={handleViewDemand}
              onEditDemand={handleEditDemand}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              ComSoc DEC
            </span>
            <span>•</span>
            <span>Seção de Comunicação Social</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isSupabaseConnected ? 'Banco Supabase Ativo' : 'Armazenamento Local Ativo'}
            </span>
            <span>•</span>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              Configurar Banco
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DemandDetailModal
        demand={selectedDemandForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        members={members}
        onUpdateStatus={handleUpdateStatus}
        onEditDemand={handleEditDemand}
        onDeleteDemand={handleDeleteDemand}
      />

      <DemandModal
        isOpen={isDemandModalOpen}
        onClose={() => setIsDemandModalOpen(false)}
        onSave={handleSaveDemand}
        editingDemand={editingDemand}
        members={members}
        defaultAssigneeId={demandModalDefaultAssignee}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChanged={loadData}
        isSupabaseConnected={isSupabaseConnected}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

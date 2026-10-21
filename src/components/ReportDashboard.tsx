import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  Printer, 
  Copy, 
  Search, 
  ExternalLink, 
  Maximize2, 
  Filter, 
  User, 
  Briefcase, 
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Check,
  Building2,
  FileText
} from 'lucide-react';
import { Demand, TeamMember } from '../types';
import { isMemberAssignedToDemand } from '../utils/assigneeHelpers';
import { 
  calculateReportStats, 
  generateReportCSV, 
  generateReportExecutiveText, 
  REPORT_PERIODS, 
  ReportPeriodKey,
  DemandWithReportStatus
} from '../utils/reportUtils';
import { getInitials } from '../utils/styleHelpers';
import { formatBrazilianDate } from '../utils/dateUtils';
import { useToast } from './Toast';

interface ReportDashboardProps {
  demands: Demand[];
  members: TeamMember[];
  onViewDemand: (demand: Demand) => void;
  onEditDemand: (demand: Demand) => void;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
  demands,
  members,
  onViewDemand,
  onEditDemand,
}) => {
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriodKey>('30_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Internal filters for the report task list
  const [filterPunctuality, setFilterPunctuality] = useState<'all' | 'on_time' | 'late'>('all');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTableTerm, setSearchTableTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Compute stats
  const stats = useMemo(() => {
    return calculateReportStats(
      demands,
      members,
      selectedPeriod,
      customStartDate,
      customEndDate
    );
  }, [demands, members, selectedPeriod, customStartDate, customEndDate]);

  // Filtered completed demands for the table
  const tableDemands = useMemo(() => {
    return stats.completedDemands.filter(d => {
      if (filterPunctuality === 'on_time' && !d.completionStatus.isOnTime) return false;
      if (filterPunctuality === 'late' && d.completionStatus.isOnTime) return false;
      if (filterMemberId !== 'all' && !isMemberAssignedToDemand(d, filterMemberId)) return false;
      if (filterCategory !== 'all' && d.category !== filterCategory) return false;
      if (searchTableTerm.trim()) {
        const query = searchTableTerm.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(query);
        const matchReq = (d.requester || '').toLowerCase().includes(query);
        const member = members.find(m => m.id === d.assignee_id);
        const matchMember = (member?.name || '').toLowerCase().includes(query) ||
          Boolean(d.additional_assignees?.some(a => members.find(m => m.id === a.member_id)?.name.toLowerCase().includes(query)));
        if (!matchTitle && !matchReq && !matchMember) return false;
      }
      return true;
    });
  }, [stats.completedDemands, filterPunctuality, filterMemberId, filterCategory, searchTableTerm, members]);

  // Handlers for export
  const handleExportCSV = () => {
    try {
      const csvData = generateReportCSV(stats, members);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_comsoc_dec_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Planilha CSV exportada com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao exportar planilha CSV.', 'error');
    }
  };

  const handleCopySummary = async () => {
    try {
      const text = generateReportExecutiveText(stats);
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      showToast('Resumo executivo copiado para a área de transferência!', 'success');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      showToast('Falha ao copiar texto para a área de transferência.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-indigo-900/40 relative overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold tracking-wider uppercase">
                ComSoc DEC • Relatório Oficial
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                {stats.startDate} até {stats.endDate}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white print:text-black">
              Relatório de Gestão & Produtividade
            </h1>
            <p className="text-sm text-slate-300 print:text-slate-700 mt-1 max-w-2xl">
              Acompanhamento detalhado das entregas da Seção de Comunicação Social do DEC, pontualidade de prazos e produtividade individual.
            </p>
          </div>

          {/* Action CTAs: Export CSV, Print, Copy Executive Text */}
          <div className="flex flex-wrap items-center gap-2 print:hidden shrink-0">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition active:scale-95 shadow-sm"
              title="Copiar texto formatado para Boletim ou Despacho"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
              <span>{isCopied ? 'Copiado!' : 'Copiar Resumo'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow-sm shadow-emerald-900/30"
              title="Baixar planilha compatível com Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel / CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition active:scale-95 shadow-sm shadow-sky-900/30"
              title="Imprimir relatório em formato oficial A4"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
            Período:
          </span>
          {REPORT_PERIODS.map(p => {
            const isActive = selectedPeriod === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setSelectedPeriod(p.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-300/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
                title={p.description}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Selector if selected */}
        {selectedPeriod === 'custom' && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex flex-wrap items-center gap-3 text-xs print:hidden">
            <span className="text-slate-300 font-semibold">Definir Intervalo:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-400">De:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400">Até:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards: Resumo Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Concluído */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Trabalhos Concluídos
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.totalCompleted}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              entregas finalizadas
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Solicitadas no período: <strong className="text-slate-800 dark:text-slate-200">{stats.totalCreatedInPeriod}</strong></span>
            <span>Ativas hoje: <strong className="text-slate-800 dark:text-slate-200">{stats.totalActiveInPeriod}</strong></span>
          </div>
        </div>

        {/* Entregues no Prazo */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-950/80 shadow-sm relative overflow-hidden bg-gradient-to-b from-emerald-50/20 to-transparent dark:from-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Entregues no Prazo
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.onTimeCount}
            </span>
            <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {stats.onTimeRate}%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-400/90 font-medium flex items-center gap-1">
            <span>Taxa de pontualidade da equipe</span>
          </div>
        </div>

        {/* Entregues Fora do Prazo */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200/60 dark:border-rose-950/80 shadow-sm relative overflow-hidden bg-gradient-to-b from-rose-50/20 to-transparent dark:from-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Entregues Fora do Prazo
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400">
              {stats.lateCount}
            </span>
            <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
              {stats.lateRate}%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-rose-700 dark:text-rose-400/90 font-medium">
            <span>{stats.lateCount === 0 ? 'Nenhum atraso no período!' : 'Demandas entregues após data limite'}</span>
          </div>
        </div>

        {/* Média de Resolução / Tempo Médio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Média de Resolução
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {Math.round(stats.avgCompletionHours / 24) || 1}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              dia(s) / ~{stats.avgCompletionHours}h
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>Tempo desde o pedido até a entrega</span>
          </div>
        </div>
      </div>

      {/* Grid: Quem Fez (Produtividade por Integrante) & Distribuição por Categoria/Solicitante */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Quem Fez (Tabela e Cards Detalhados dos Integrantes) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Quem Fez • Produtividade Individual</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Desempenho de cada integrante da Seção de Comunicação Social no período
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {members.length} Integrantes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Integrante</th>
                  <th className="py-2.5 px-2 text-center">Concluídos</th>
                  <th className="py-2.5 px-2 text-center">No Prazo</th>
                  <th className="py-2.5 px-2 text-center">Fora Prazo</th>
                  <th className="py-2.5 px-3 text-center">Pontualidade</th>
                  <th className="py-2.5 px-3">Especialidade Principal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {stats.memberSummaries.map(m => (
                  <tr 
                    key={m.memberId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: m.avatarColor }}
                        >
                          {getInitials(m.memberName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.memberName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {m.memberRole}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {m.totalCompleted}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                        {m.onTimeCount}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-center">
                      {m.lateCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold">
                          {m.lateCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {m.totalCompleted > 0 ? `${m.onTimeRate}%` : '-'}
                        </span>
                        {m.totalCompleted > 0 && (
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                            <div 
                              className="bg-emerald-500 h-full"
                              style={{ width: `${m.onTimeRate}%` }}
                            />
                            <div 
                              className="bg-rose-500 h-full"
                              style={{ width: `${m.lateRate}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <span className="inline-block px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                        {m.topCategory}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coluna 3: Categorias & Top Solicitantes */}
        <div className="space-y-6">
          {/* Categorias */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Por Categoria de Trabalho</span>
            </h3>

            {stats.categorySummaries.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Nenhum trabalho no período.</p>
            ) : (
              <div className="space-y-3">
                {stats.categorySummaries.map(c => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {c.category}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.count} <span className="text-[11px] text-slate-400 font-normal">({c.percentage}%)</span>
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div 
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitantes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Órgãos Atendidos (Solicitantes)</span>
            </h3>

            {stats.requesterSummaries.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Nenhum solicitante no período.</p>
            ) : (
              <div className="space-y-2.5">
                {stats.requesterSummaries.slice(0, 6).map(r => (
                  <div key={r.requester} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={r.requester}>
                      {r.requester}
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0">
                      {r.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Relação Discriminada de Todos os Trabalhos Concluídos no Período */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>Relação Detalhada dos Trabalhos ({tableDemands.length} de {stats.totalCompleted})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clique em qualquer demanda para abrir a janela completa de informações
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs print:hidden">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filtrar por título ou solicitante..."
                value={searchTableTerm}
                onChange={e => setSearchTableTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 w-48 sm:w-56"
              />
            </div>

            {/* Pontualidade Filter */}
            <select
              value={filterPunctuality}
              onChange={e => setFilterPunctuality(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Entregas</option>
              <option value="on_time">✓ Apenas No Prazo ({stats.onTimeCount})</option>
              <option value="late">⚠️ Apenas Fora do Prazo ({stats.lateCount})</option>
            </select>

            {/* Member Filter */}
            <select
              value={filterMemberId}
              onChange={e => setFilterMemberId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">Todos Integrantes</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role.split('/')[0].trim()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {tableDemands.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum trabalho concluído encontrado para os critérios selecionados.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Experimente alterar o período (ex: 60 dias, 90 dias ou 1 ano) ou limpar os filtros.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Demanda / Trabalho</th>
                  <th className="py-3 px-3">Solicitante</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-2">Categoria</th>
                  <th className="py-3 px-3">Prazo vs Conclusão</th>
                  <th className="py-3 px-3 text-center">Pontualidade</th>
                  <th className="py-3 px-2 text-right print:hidden">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tableDemands.map(d => {
                  const member = members.find(m => m.id === d.assignee_id);
                  const isOnTime = d.completionStatus.isOnTime;

                  return (
                    <tr 
                      key={d.id}
                      className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                      onClick={() => onViewDemand(d)}
                    >
                      {/* Título & ID */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition flex items-center gap-1.5">
                          <span>{d.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{d.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                          {d.description}
                        </p>
                      </td>

                      {/* Solicitante */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {d.requester}
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center -space-x-1.5">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs ring-1 ring-white dark:ring-slate-900"
                              style={{ backgroundColor: member?.avatar_color || '#3B82F6' }}
                            >
                              {getInitials(member?.name || '?')}
                            </div>
                            {d.additional_assignees && d.additional_assignees.length > 0 && (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold bg-indigo-600 text-white shrink-0 shadow-xs ring-1 ring-white dark:ring-slate-900"
                                title={`+${d.additional_assignees.length} co-responsável(is)`}
                              >
                                +{d.additional_assignees.length}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                              {member?.name || 'Não atribuído'}
                            </span>
                            {d.additional_assignees && d.additional_assignees.length > 0 && (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                +{d.additional_assignees.length} co-resp.
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {d.category}
                        </span>
                      </td>

                      {/* Prazo vs Conclusão */}
                      <td className="py-3 px-3">
                        <div className="text-[11px]">
                          <div className="text-slate-500">
                            Prazo: <span className="font-medium text-slate-700 dark:text-slate-300">{formatBrazilianDate(d.due_date, false)}</span>
                          </div>
                          <div className="text-slate-500">
                            Entrega: <span className="font-semibold text-slate-900 dark:text-white">{formatBrazilianDate(d.completionStatus.completionDate, false)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Pontualidade Badge */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                            isOnTime
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          }`}>
                            {isOnTime ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            <span>{d.completionStatus.statusLabel}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {d.completionStatus.differenceFormatted}
                          </span>
                        </div>
                      </td>

                      {/* Abrir Janela Action */}
                      <td className="py-3 px-2 text-right print:hidden" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onViewDemand(d)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition"
                          title="Abrir Janela Completa da Demanda"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Abrir Janela</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

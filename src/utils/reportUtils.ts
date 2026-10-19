import { Demand, DemandCategory, TeamMember } from '../types';
import { formatBrazilianDate } from './dateUtils';

export type ReportPeriodKey = '30_days' | '60_days' | '90_days' | '1_year' | 'all_time' | 'custom';

export interface ReportPeriodOption {
  key: ReportPeriodKey;
  label: string;
  days?: number;
  description: string;
}

export const REPORT_PERIODS: ReportPeriodOption[] = [
  { key: '30_days', label: 'Últimos 30 dias', days: 30, description: 'Trabalhos realizados no último mês' },
  { key: '60_days', label: 'Últimos 60 dias', days: 60, description: 'Trabalhos realizados nos últimos 2 meses' },
  { key: '90_days', label: 'Últimos 90 dias', days: 90, description: 'Trabalhos realizados no último trimestre' },
  { key: '1_year', label: 'Último 1 ano', days: 365, description: 'Balanço anual de produtividade (365 dias)' },
  { key: 'all_time', label: 'Todo o período', description: 'Histórico completo desde a ativação do sistema' },
  { key: 'custom', label: 'Intervalo Personalizado', description: 'Defina datas específicas de início e fim' },
];

export interface DemandCompletionStatus {
  isOnTime: boolean;
  statusLabel: 'No Prazo' | 'Fora do Prazo';
  differenceHours: number; // negative = early, positive = late
  differenceFormatted: string;
  completionDate: string;
}

export interface DemandWithReportStatus extends Demand {
  completionStatus: DemandCompletionStatus;
}

export interface MemberReportSummary {
  memberId: string;
  memberName: string;
  memberRole: string;
  avatarColor: string;
  totalCompleted: number;
  onTimeCount: number;
  lateCount: number;
  onTimeRate: number; // 0 - 100
  lateRate: number; // 0 - 100
  topCategory: string;
  relativeShare: number; // % of total completed by this member
  completedDemands: DemandWithReportStatus[];
}

export interface CategoryReportSummary {
  category: DemandCategory;
  count: number;
  percentage: number;
  onTimeCount: number;
  lateCount: number;
  onTimeRate: number;
}

export interface RequesterReportSummary {
  requester: string;
  count: number;
  percentage: number;
}

export interface OverallReportStats {
  periodKey: ReportPeriodKey;
  periodLabel: string;
  periodDescription: string;
  startDate: string; // ISO or formatted
  endDate: string; // ISO or formatted
  totalCompleted: number;
  totalCreatedInPeriod: number;
  totalActiveInPeriod: number;
  onTimeCount: number;
  lateCount: number;
  onTimeRate: number; // 0 - 100
  lateRate: number; // 0 - 100
  avgCompletionHours: number;
  memberSummaries: MemberReportSummary[];
  categorySummaries: CategoryReportSummary[];
  requesterSummaries: RequesterReportSummary[];
  completedDemands: DemandWithReportStatus[];
}

/**
 * Resolves the effective completion timestamp of a completed demand.
 * If completed_at is set, uses it.
 * Otherwise uses updated_at if present.
 * Otherwise falls back to created_at or due_date.
 */
export function getDemandCompletionDate(demand: Demand): Date {
  if (demand.completed_at) {
    return new Date(demand.completed_at);
  }
  if (demand.updated_at) {
    return new Date(demand.updated_at);
  }
  return new Date(demand.created_at);
}

/**
 * Calculates whether a completed demand was delivered on time or late.
 */
export function analyzeDemandCompletion(demand: Demand): DemandCompletionStatus {
  const completionDate = getDemandCompletionDate(demand);
  
  if (!demand.due_date || demand.due_date.trim() === '') {
    return {
      isOnTime: true,
      statusLabel: 'No Prazo',
      differenceHours: 0,
      differenceFormatted: 'Sem prazo estipulado',
      completionDate: completionDate.toISOString(),
    };
  }

  let dueDate: Date;
  if (!demand.due_date.includes('T')) {
    const parts = demand.due_date.split('-').map(Number);
    dueDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
  } else {
    dueDate = new Date(demand.due_date);
  }
  
  const diffMs = completionDate.getTime() - dueDate.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  const isOnTime = diffMs <= 0;
  
  let differenceFormatted = '';
  if (isOnTime) {
    const earlyHours = Math.abs(diffHours);
    if (earlyHours < 1) {
      differenceFormatted = 'Entregue no prazo exato';
    } else if (earlyHours < 24) {
      differenceFormatted = `Entregue ${earlyHours}h antes do prazo`;
    } else {
      const days = Math.round(earlyHours / 24);
      differenceFormatted = `Entregue ${days} ${days === 1 ? 'dia' : 'dias'} antes do prazo`;
    }
  } else {
    const lateHours = diffHours;
    if (lateHours < 1) {
      differenceFormatted = 'Entregue com poucos minutos de atraso';
    } else if (lateHours < 24) {
      differenceFormatted = `Entregue com ${lateHours}h de atraso`;
    } else {
      const days = Math.round(lateHours / 24);
      differenceFormatted = `Entregue com ${days} ${days === 1 ? 'dia' : 'dias'} de atraso`;
    }
  }

  return {
    isOnTime,
    statusLabel: isOnTime ? 'No Prazo' : 'Fora do Prazo',
    differenceHours: diffHours,
    differenceFormatted,
    completionDate: completionDate.toISOString(),
  };
}

/**
 * Computes period start and end dates from option.
 */
export function getPeriodDateRange(
  periodKey: ReportPeriodKey,
  referenceDate: Date = new Date(),
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date } {
  const endDate = customEnd ? new Date(customEnd + 'T23:59:59') : new Date(referenceDate);

  if (periodKey === 'custom' && customStart) {
    const startDate = new Date(customStart + 'T00:00:00');
    return { startDate, endDate };
  }

  if (periodKey === 'all_time') {
    return { startDate: new Date('2020-01-01T00:00:00'), endDate };
  }

  const period = REPORT_PERIODS.find(p => p.key === periodKey);
  const days = period?.days || 30;
  
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
}

/**
 * Calculates full reporting statistics based on demands and team members.
 */
export function calculateReportStats(
  demands: Demand[],
  members: TeamMember[],
  periodKey: ReportPeriodKey,
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date()
): OverallReportStats {
  const { startDate, endDate } = getPeriodDateRange(periodKey, referenceDate, customStart, customEnd);
  const periodOption = REPORT_PERIODS.find(p => p.key === periodKey) || REPORT_PERIODS[0];

  // Filter completed demands within the period
  const completedInPeriod: DemandWithReportStatus[] = [];
  let totalCreatedInPeriod = 0;
  let totalActiveInPeriod = 0;

  for (const demand of demands) {
    const createdAt = new Date(demand.created_at);
    if (createdAt >= startDate && createdAt <= endDate) {
      totalCreatedInPeriod++;
      if (demand.status !== 'Concluído') {
        totalActiveInPeriod++;
      }
    }

    if (demand.status === 'Concluído') {
      const compDate = getDemandCompletionDate(demand);
      if (compDate >= startDate && compDate <= endDate) {
        const completionStatus = analyzeDemandCompletion(demand);
        completedInPeriod.push({
          ...demand,
          completionStatus,
        });
      }
    }
  }

  // Sort completed demands by completion date descending
  completedInPeriod.sort((a, b) => {
    return new Date(b.completionStatus.completionDate).getTime() - new Date(a.completionStatus.completionDate).getTime();
  });

  const totalCompleted = completedInPeriod.length;
  const onTimeCount = completedInPeriod.filter(d => d.completionStatus.isOnTime).length;
  const lateCount = totalCompleted - onTimeCount;
  const onTimeRate = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 0;
  const lateRate = totalCompleted > 0 ? Math.round((lateCount / totalCompleted) * 100) : 0;

  // Average completion turnaround in hours
  let totalTurnaroundHours = 0;
  for (const d of completedInPeriod) {
    const created = new Date(d.created_at).getTime();
    const completed = new Date(d.completionStatus.completionDate).getTime();
    const diffHours = Math.max(1, (completed - created) / (1000 * 60 * 60));
    totalTurnaroundHours += diffHours;
  }
  const avgCompletionHours = totalCompleted > 0 ? Math.round(totalTurnaroundHours / totalCompleted) : 0;

  // Breakdown by Member ("Quem fez")
  const memberSummaries: MemberReportSummary[] = members.map(m => {
    const memberDemands = completedInPeriod.filter(d => 
      d.assignee_id === m.id || 
      d.additional_assignees?.some(a => a.member_id === m.id)
    );
    const mTotal = memberDemands.length;
    const mOnTime = memberDemands.filter(d => d.completionStatus.isOnTime).length;
    const mLate = mTotal - mOnTime;
    const mOnTimeRate = mTotal > 0 ? Math.round((mOnTime / mTotal) * 100) : 0;
    const mLateRate = mTotal > 0 ? Math.round((mLate / mTotal) * 100) : 0;
    const relativeShare = totalCompleted > 0 ? Math.round((mTotal / totalCompleted) * 100) : 0;

    // Find top category
    const catCounts: Record<string, number> = {};
    for (const d of memberDemands) {
      catCounts[d.category] = (catCounts[d.category] || 0) + 1;
    }
    let topCat = 'N/A';
    let maxCatCount = 0;
    for (const [cat, cnt] of Object.entries(catCounts)) {
      if (cnt > maxCatCount) {
        maxCatCount = cnt;
        topCat = cat;
      }
    }

    return {
      memberId: m.id,
      memberName: m.name,
      memberRole: m.role,
      avatarColor: m.avatar_color || '#3B82F6',
      totalCompleted: mTotal,
      onTimeCount: mOnTime,
      lateCount: mLate,
      onTimeRate: mOnTimeRate,
      lateRate: mLateRate,
      topCategory: topCat,
      relativeShare,
      completedDemands: memberDemands,
    };
  });

  // Sort members by total completed descending
  memberSummaries.sort((a, b) => b.totalCompleted - a.totalCompleted);

  // Breakdown by Category
  const catMap: Record<DemandCategory, { count: number; onTime: number; late: number }> = {
    'Vídeo / Edição': { count: 0, onTime: 0, late: 0 },
    'Design / Arte': { count: 0, onTime: 0, late: 0 },
    'Fotografia / Cobertura': { count: 0, onTime: 0, late: 0 },
    'Redação / Nota': { count: 0, onTime: 0, late: 0 },
    'Impressão / Material': { count: 0, onTime: 0, late: 0 },
    'Outros': { count: 0, onTime: 0, late: 0 },
  };

  for (const d of completedInPeriod) {
    if (catMap[d.category]) {
      catMap[d.category].count++;
      if (d.completionStatus.isOnTime) {
        catMap[d.category].onTime++;
      } else {
        catMap[d.category].late++;
      }
    }
  }

  const categorySummaries: CategoryReportSummary[] = (Object.keys(catMap) as DemandCategory[])
    .map(cat => {
      const data = catMap[cat];
      const percentage = totalCompleted > 0 ? Math.round((data.count / totalCompleted) * 100) : 0;
      const catOnTimeRate = data.count > 0 ? Math.round((data.onTime / data.count) * 100) : 0;
      return {
        category: cat,
        count: data.count,
        percentage,
        onTimeCount: data.onTime,
        lateCount: data.late,
        onTimeRate: catOnTimeRate,
      };
    })
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);

  // Breakdown by Requester ("Para quem entregar / Solicitantes")
  const reqMap: Record<string, number> = {};
  for (const d of completedInPeriod) {
    const req = d.requester?.trim() || 'Não especificado';
    reqMap[req] = (reqMap[req] || 0) + 1;
  }

  const requesterSummaries: RequesterReportSummary[] = Object.entries(reqMap)
    .map(([requester, count]) => ({
      requester,
      count,
      percentage: totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    periodKey,
    periodLabel: periodOption.label,
    periodDescription: periodOption.description,
    startDate: startDate.toLocaleDateString('pt-BR'),
    endDate: endDate.toLocaleDateString('pt-BR'),
    totalCompleted,
    totalCreatedInPeriod,
    totalActiveInPeriod,
    onTimeCount,
    lateCount,
    onTimeRate,
    lateRate,
    avgCompletionHours,
    memberSummaries,
    categorySummaries,
    requesterSummaries,
    completedDemands: completedInPeriod,
  };
}

/**
 * Generates an executive summary in formal Portuguese for official dispatch,
 * internal bulletin or Command report.
 */
export function generateReportExecutiveText(stats: OverallReportStats): string {
  const lines: string[] = [];
  lines.push(`=======================================================`);
  lines.push(`RELATÓRIO DE GESTÃO E PRODUTIVIDADE - COMSOC DEC`);
  lines.push(`Departamento de Engenharia e Construção (DEC)`);
  lines.push(`Período de Referência: ${stats.periodLabel} (${stats.startDate} a ${stats.endDate})`);
  lines.push(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`);
  lines.push(`=======================================================\n`);

  lines.push(`1. RESUMO EXECUTIVO DAS ENTREGAS`);
  lines.push(`• Total de Trabalhos Concluídos: ${stats.totalCompleted}`);
  lines.push(`• Demandas Solicitadas no Período: ${stats.totalCreatedInPeriod}`);
  lines.push(`• Demandas em Andamento: ${stats.totalActiveInPeriod}`);
  lines.push(`• Entregues no Prazo: ${stats.onTimeCount} (${stats.onTimeRate}%)`);
  lines.push(`• Entregues fora do Prazo: ${stats.lateCount} (${stats.lateRate}%)`);
  lines.push(`• Tempo Médio de Resolução: ~${Math.round(stats.avgCompletionHours / 24) || 1} dia(s) (${stats.avgCompletionHours}h)\n`);

  lines.push(`2. PRODUTIVIDADE POR INTEGRANTE (QUEM FEZ)`);
  if (stats.memberSummaries.length === 0) {
    lines.push(`(Nenhum registro de conclusão no período selecionado)`);
  } else {
    for (const m of stats.memberSummaries) {
      if (m.totalCompleted > 0) {
        lines.push(
          `• ${m.memberName} (${m.memberRole}): ${m.totalCompleted} trabalho(s) concluído(s) | ` +
          `No Prazo: ${m.onTimeCount} | Fora do Prazo: ${m.lateCount} | ` +
          `Pontualidade: ${m.onTimeRate}% | Categoria principal: ${m.topCategory}`
        );
      }
    }
  }
  lines.push(``);

  lines.push(`3. DISTRIBUIÇÃO POR CATEGORIA DE SERVIÇO`);
  for (const c of stats.categorySummaries) {
    lines.push(`• ${c.category}: ${c.count} (${c.percentage}%) | Pontualidade: ${c.onTimeRate}%`);
  }
  lines.push(``);

  lines.push(`4. PRINCIPAIS ÓRGÃOS E SEÇÕES ATENDIDAS (SOLICITANTES)`);
  for (const r of stats.requesterSummaries.slice(0, 5)) {
    lines.push(`• ${r.requester}: ${r.count} entrega(s) (${r.percentage}%)`);
  }
  lines.push(``);

  lines.push(`=======================================================`);
  lines.push(`Relatório gerado automaticamente pelo Sistema ComSoc DEC`);
  lines.push(`=======================================================`);

  return lines.join('\n');
}

/**
 * Generates CSV string with UTF-8 BOM so it opens with proper accents in Microsoft Excel.
 */
export function generateReportCSV(stats: OverallReportStats, members: TeamMember[]): string {
  const memberMap = new Map(members.map(m => [m.id, m.name]));
  const rows: string[][] = [];

  // Header Section
  rows.push(['RELATÓRIO DE GESTÃO E PRODUTIVIDADE - COMSOC DEC']);
  rows.push([`Período: ${stats.periodLabel} (${stats.startDate} a ${stats.endDate})`]);
  rows.push([`Data de Geração: ${new Date().toLocaleString('pt-BR')}`]);
  rows.push([]);

  // KPI Summary
  rows.push(['INDICADOR', 'VALOR', 'PERCENTUAL']);
  rows.push(['Total de Trabalhos Concluídos', String(stats.totalCompleted), '100%']);
  rows.push(['Entregues no Prazo', String(stats.onTimeCount), `${stats.onTimeRate}%`]);
  rows.push(['Entregues fora do Prazo', String(stats.lateCount), `${stats.lateRate}%`]);
  rows.push(['Demandas Solicitadas no Período', String(stats.totalCreatedInPeriod), '-']);
  rows.push(['Demandas em Andamento', String(stats.totalActiveInPeriod), '-']);
  rows.push([]);

  // Member Summary
  rows.push(['PRODUTIVIDADE POR INTEGRANTE (QUEM FEZ)']);
  rows.push(['Nome', 'Função / Posto', 'Total Concluído', 'No Prazo', 'Fora do Prazo', 'Taxa de Pontualidade', 'Principal Especialidade']);
  for (const m of stats.memberSummaries) {
    rows.push([
      m.memberName,
      m.memberRole,
      String(m.totalCompleted),
      String(m.onTimeCount),
      String(m.lateCount),
      `${m.onTimeRate}%`,
      m.topCategory,
    ]);
  }
  rows.push([]);

  // Detailed Tasks List
  rows.push(['RELAÇÃO DISCRIMINADA DE TRABALHOS CONCLUÍDOS']);
  rows.push([
    'ID',
    'Título do Trabalho',
    'Responsável',
    'Solicitante / Para Quem Entregar',
    'Categoria',
    'Prioridade',
    'Prazo Estabelecido',
    'Data de Conclusão',
    'Pontualidade',
    'Diferença',
  ]);

  for (const d of stats.completedDemands) {
    let assigneeName = memberMap.get(d.assignee_id) || 'Não atribuído';
    if (d.additional_assignees && d.additional_assignees.length > 0) {
      const coNames = d.additional_assignees
        .map(a => memberMap.get(a.member_id))
        .filter(Boolean)
        .join(', ');
      if (coNames) {
        assigneeName += ` (+ ${coNames})`;
      }
    }
    const dueDateFormatted = d.due_date ? formatBrazilianDate(d.due_date) : 'Sem data definida';
    const compDateFormatted = new Date(d.completionStatus.completionDate).toLocaleString('pt-BR');

    rows.push([
      d.id,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${assigneeName.replace(/"/g, '""')}"`,
      `"${(d.requester || '').replace(/"/g, '""')}"`,
      d.category,
      d.priority,
      dueDateFormatted,
      compDateFormatted,
      d.completionStatus.statusLabel,
      `"${d.completionStatus.differenceFormatted.replace(/"/g, '""')}"`,
    ]);
  }

  // Convert to CSV with semicolon (Excel standard in PT-BR)
  const csvContent = rows.map(r => r.join(';')).join('\r\n');
  return '\uFEFF' + csvContent; // Add BOM
}

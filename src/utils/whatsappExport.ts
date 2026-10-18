import { Demand, TeamMember } from '../types';
import { analyzeDeadline, formatBrazilianDate } from './dateUtils';

const STATUS_EMOJIS: Record<string, string> = {
  'A Fazer': '📌',
  'Em Produção': '⚙️',
  'Em Revisão': '🔍',
  'Concluído': '✅',
};

const PRIORITY_EMOJIS: Record<string, string> = {
  'Urgente': '🚨 *URGENTE*',
  'Alta': '🔴 *Alta*',
  'Média': '🟡 Média',
  'Baixa': '🟢 Baixa',
};

export function generateSingleDemandWhatsAppText(demand: Demand, member?: TeamMember): string {
  const deadlineAnalysis = analyzeDeadline(demand.due_date, demand.status);
  const statusEmoji = STATUS_EMOJIS[demand.status] || '📋';
  const priorityTag = PRIORITY_EMOJIS[demand.priority] || demand.priority;

  let deadlineTag = `📅 *Prazo:* ${formatBrazilianDate(demand.due_date)}`;
  if (deadlineAnalysis.status === 'overdue') {
    deadlineTag += ' ⚠️ *(ATRASADO)*';
  } else if (deadlineAnalysis.status === 'due-soon') {
    deadlineTag += ' ⏰ *(VENCE EM BREVE)*';
  }

  const lines = [
    `*DEMANDA - COMSOC DEC*`,
    `📌 *Tarefa:* ${demand.title}`,
    `🏷️ *Categoria:* ${demand.category}`,
    `⚡ *Prioridade:* ${priorityTag}`,
    `🔄 *Status:* ${statusEmoji} ${demand.status}`,
    `👤 *Responsável:* ${member?.name || 'Não atribuído'}`,
    `🎯 *Para quem entregar:* ${demand.requester}`,
    deadlineTag,
  ];

  if (demand.description?.trim()) {
    lines.push(`📝 *Briefing:* ${demand.description.trim()}`);
  }

  if (demand.files_link?.trim()) {
    lines.push(`🔗 *Link dos Arquivos:* ${demand.files_link.trim()}`);
  }

  return lines.join('\n');
}

export function generateBatchWhatsAppReport(
  demands: Demand[],
  members: TeamMember[],
  reportTitle = 'RELATÓRIO DE DEMANDAS - COMSOC DEC'
): string {
  const memberMap = new Map(members.map(m => [m.id, m]));
  const now = new Date();
  const dateStr = formatBrazilianDate(now.toISOString());

  const activeDemands = demands.filter(d => d.status !== 'Concluído');
  const completedDemands = demands.filter(d => d.status === 'Concluído');

  const lines = [
    `📢 *${reportTitle.toUpperCase()}*`,
    `🗓️ *Atualizado em:* ${dateStr}`,
    `📊 *Total:* ${demands.length} | *Ativas:* ${activeDemands.length} | *Concluídas:* ${completedDemands.length}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    '',
  ];

  if (demands.length === 0) {
    lines.push('Nenhuma demanda encontrada para este filtro.');
    return lines.join('\n');
  }

  // Active demands first
  if (activeDemands.length > 0) {
    lines.push('⚡ *DEMANDAS ATIVAS / EM ANDAMENTO:*');
    lines.push('');

    // Sort active: overdue first, then by due date
    const sortedActive = [...activeDemands].sort((a, b) => {
      const aTime = new Date(a.due_date).getTime();
      const bTime = new Date(b.due_date).getTime();
      return aTime - bTime;
    });

    sortedActive.forEach((d, index) => {
      const member = memberMap.get(d.assignee_id);
      const deadline = analyzeDeadline(d.due_date, d.status);
      const statusEmoji = STATUS_EMOJIS[d.status] || '📌';

      let alertText = '';
      if (deadline.status === 'overdue') alertText = ' ⚠️ *[ATRASADO]*';
      if (deadline.status === 'due-soon') alertText = ' ⏰ *[URGÊNCIA DE PRAZO]*';

      lines.push(`${index + 1}. ${statusEmoji} *${d.title}*${alertText}`);
      lines.push(`   • Responsável: ${member?.name || 'A definir'}`);
      lines.push(`   • Para: ${d.requester}`);
      lines.push(`   • Prazo: ${formatBrazilianDate(d.due_date)} (${deadline.relativeText})`);
      lines.push(`   • Status: ${d.status} | Prioridade: ${d.priority}`);
      if (d.files_link) {
        lines.push(`   • Arquivos: ${d.files_link}`);
      }
      lines.push('');
    });
  }

  // Completed demands summary
  if (completedDemands.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('✅ *CONCLUÍDAS RECENTEMENTE:*');
    completedDemands.slice(0, 10).forEach(d => {
      const member = memberMap.get(d.assignee_id);
      lines.push(`• ${d.title} (Entregue para: ${d.requester} | Resp: ${member?.name || 'Equipe'})`);
    });
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('_Enviado via Painel ComSoc DEC_');

  return lines.join('\n');
}

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

export function generateSingleDemandWhatsAppText(
  demand: Demand, 
  member?: TeamMember,
  allMembers?: TeamMember[]
): string {
  const deadlineAnalysis = analyzeDeadline(demand.due_date, demand.status);
  const statusEmoji = STATUS_EMOJIS[demand.status] || '📋';
  const priorityTag = PRIORITY_EMOJIS[demand.priority] || demand.priority;

  let deadlineTag = `📅 *Prazo:* ${formatBrazilianDate(demand.due_date)}`;
  if (demand.due_date && deadlineAnalysis.status === 'overdue') {
    deadlineTag += ' ⚠️ *(ATRASADO)*';
  } else if (demand.due_date && deadlineAnalysis.status === 'due-soon') {
    deadlineTag += ' ⏰ *(VENCE EM BREVE)*';
  }

  const lines = [
    `*DEMANDA - COMSOC DEC*`,
    `📌 *Tarefa:* ${demand.title}`,
    `🏷️ *Categoria:* ${demand.category}`,
    `⚡ *Prioridade:* ${priorityTag}`,
    `🔄 *Status:* ${statusEmoji} ${demand.status}`,
  ];

  // Assignees list with roles / descriptions
  const memberMap = allMembers ? new Map(allMembers.map(m => [m.id, m])) : undefined;
  if (demand.additional_assignees && demand.additional_assignees.length > 0) {
    lines.push(`👥 *Equipe Responsável:*`);
    lines.push(`   • ${member?.name || 'Não atribuído'} *(Principal)*`);
    for (const add of demand.additional_assignees) {
      const addMember = memberMap?.get(add.member_id);
      const name = addMember ? addMember.name : 'Integrante';
      const taskDesc = add.role_description ? ` - _${add.role_description}_` : '';
      lines.push(`   • ${name} *(Co-responsável)*${taskDesc}`);
    }
  } else {
    lines.push(`👤 *Responsável:* ${member?.name || 'Não atribuído'}`);
  }

  lines.push(`🎯 *Para quem entregar:* ${demand.requester}`);
  lines.push(deadlineTag);

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

    // Sort active: overdue first, then by due date (unscheduled at the end)
    const getTimestamp = (dateStr?: string) => {
      if (!dateStr) return Infinity;
      if (!dateStr.includes('T')) {
        const parts = dateStr.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59).getTime();
      }
      return new Date(dateStr).getTime() || Infinity;
    };

    const sortedActive = [...activeDemands].sort((a, b) => {
      return getTimestamp(a.due_date) - getTimestamp(b.due_date);
    });

    sortedActive.forEach((d, index) => {
      const member = memberMap.get(d.assignee_id);
      const deadline = analyzeDeadline(d.due_date, d.status);
      const statusEmoji = STATUS_EMOJIS[d.status] || '📌';

      let alertText = '';
      if (deadline.status === 'overdue') alertText = ' ⚠️ *[ATRASADO]*';
      if (deadline.status === 'due-soon') alertText = ' ⏰ *[URGÊNCIA DE PRAZO]*';

      let teamText = member?.name || 'A definir';
      if (d.additional_assignees && d.additional_assignees.length > 0) {
        const coNames = d.additional_assignees
          .map(a => memberMap.get(a.member_id)?.name.split(' ')[0])
          .filter(Boolean)
          .join(', ');
        if (coNames) {
          teamText += ` (+ ${coNames})`;
        }
      }

      lines.push(`${index + 1}. ${statusEmoji} *${d.title}*${alertText}`);
      lines.push(`   • Responsáveis: ${teamText}`);
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

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { analyzeDeadline, formatBrazilianDate } from '../src/utils/dateUtils.ts';
import { generateSingleDemandWhatsAppText, generateBatchWhatsAppReport } from '../src/utils/whatsappExport.ts';
import { 
  analyzeDemandCompletion, 
  calculateReportStats, 
  generateReportExecutiveText, 
  generateReportCSV,
  getPeriodDateRange 
} from '../src/utils/reportUtils.ts';
import { 
  isMemberAssignedToDemand, 
  getMemberRoleInDemand, 
  getAllDemandAssignees 
} from '../src/utils/assigneeHelpers.ts';

describe('dateUtils logic tests', () => {
  test('completed demands should always return completed analysis', () => {
    const pastDate = new Date(Date.now() - 100000000).toISOString();
    const result = analyzeDeadline(pastDate, 'Concluído');
    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.badgeLabel, 'Concluído');
    assert.strictEqual(result.isUrgentNotice, false);
  });

  test('overdue deadline should return overdue with isUrgentNotice true', () => {
    const pastDate = new Date(Date.now() - 3600000 * 25).toISOString(); // 25 hours ago
    const result = analyzeDeadline(pastDate, 'Em Produção');
    assert.strictEqual(result.status, 'overdue');
    assert.strictEqual(result.badgeLabel, 'Atrasado');
    assert.strictEqual(result.isUrgentNotice, true);
  });

  test('on-track deadline should return on-track', () => {
    const futureDate = new Date(Date.now() + 3600000 * 24 * 7).toISOString(); // 7 days ahead
    const result = analyzeDeadline(futureDate, 'A Fazer');
    assert.strictEqual(result.status, 'on-track');
    assert.strictEqual(result.badgeLabel, 'No prazo');
  });

  test('formatBrazilianDate formats properly', () => {
    const formatted = formatBrazilianDate('2026-10-25T14:30:00', true);
    assert.ok(formatted.includes('25/10/2026'));
    assert.ok(formatted.includes('14:30'));
  });
});

describe('whatsappExport logic tests', () => {
  test('generates single demand WhatsApp message with required tags', () => {
    const demand = {
      id: 'd1',
      title: 'Vídeo Institucional',
      description: 'Vídeo de 2 minutos para YouTube',
      assignee_id: 'm1',
      requester: 'Gabinete',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      category: 'Vídeo / Edição' as const,
      priority: 'Alta' as const,
      status: 'Em Produção' as const,
      files_link: 'https://drive.google.com/test',
      created_at: new Date().toISOString(),
    };
    const member = {
      id: 'm1',
      name: 'Gabriel Santos',
      role: 'Editor de Vídeo',
      avatar_color: '#8B5CF6',
    };

    const text = generateSingleDemandWhatsAppText(demand, member);
    assert.ok(text.includes('Vídeo Institucional'));
    assert.ok(text.includes('Gabriel Santos'));
    assert.ok(text.includes('Gabinete'));
    assert.ok(text.includes('https://drive.google.com/test'));
    assert.ok(text.includes('⚙️ Em Produção'));
  });

  test('generates WhatsApp message with multiple assignees and individual task descriptions', () => {
    const demand = {
      id: 'd2',
      title: 'Cobertura e Vídeo Especial',
      description: 'Vídeo institucional com cobertura',
      assignee_id: 'm1',
      additional_assignees: [
        { member_id: 'm2', role_description: 'Gravar imagens aéreas com drone' },
        { member_id: 'm3', role_description: 'Tratar fotos para o boletim' },
      ],
      requester: 'Comando',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      category: 'Vídeo / Edição' as const,
      priority: 'Alta' as const,
      status: 'Em Produção' as const,
      created_at: new Date().toISOString(),
    };
    const members = [
      { id: 'm1', name: 'Carlos Ramos', role: 'Coordenador', avatar_color: '#3B82F6' },
      { id: 'm2', name: 'Amanda Foto', role: 'Operadora de Drone', avatar_color: '#10B981' },
      { id: 'm3', name: 'Beatriz Lima', role: 'Designer', avatar_color: '#EC4899' },
    ];

    const text = generateSingleDemandWhatsAppText(demand, members[0], members);
    assert.ok(text.includes('Carlos Ramos *(Principal)*'));
    assert.ok(text.includes('Amanda Foto *(Co-responsável)* - _Gravar imagens aéreas com drone_'));
    assert.ok(text.includes('Beatriz Lima *(Co-responsável)* - _Tratar fotos para o boletim_'));

    const batch = generateBatchWhatsAppReport([demand], members);
    assert.ok(batch.includes('Carlos Ramos (+ Amanda, Beatriz)'));
  });
});

describe('assigneeHelpers logic tests', () => {
  const sampleDemand = {
    id: 'd_test',
    title: 'Projeto Multidisciplinar',
    description: 'Campanha integrada',
    assignee_id: 'mem_1',
    additional_assignees: [
      { member_id: 'mem_2', role_description: 'Design dos banners digitais' },
      { member_id: 'mem_4', role_description: 'Fotos dos participantes' },
    ],
    requester: 'Gabinete',
    due_date: '2026-10-30T10:00:00',
    category: 'Design / Arte' as const,
    priority: 'Alta' as const,
    status: 'Em Produção' as const,
    created_at: '2026-10-20T08:00:00',
  };

  const sampleMembers = [
    { id: 'mem_1', name: 'Carlos Ramos', role: 'Coordenador', avatar_color: '#3B82F6' },
    { id: 'mem_2', name: 'Beatriz Lima', role: 'Designer', avatar_color: '#EC4899' },
    { id: 'mem_3', name: 'Gabriel Santos', role: 'Editor', avatar_color: '#8B5CF6' },
    { id: 'mem_4', name: 'Amanda Ferreira', role: 'Fotógrafa', avatar_color: '#10B981' },
  ];

  test('isMemberAssignedToDemand returns true for primary and additional assignees', () => {
    assert.strictEqual(isMemberAssignedToDemand(sampleDemand, 'mem_1'), true);
    assert.strictEqual(isMemberAssignedToDemand(sampleDemand, 'mem_2'), true);
    assert.strictEqual(isMemberAssignedToDemand(sampleDemand, 'mem_4'), true);
    assert.strictEqual(isMemberAssignedToDemand(sampleDemand, 'mem_3'), false);
    assert.strictEqual(isMemberAssignedToDemand(sampleDemand, 'mem_non_existing'), false);
    assert.strictEqual(isMemberAssignedToDemand(sampleDemand, ''), false);
  });

  test('getMemberRoleInDemand correctly identifies primary vs co-assignee and returns role description', () => {
    const role1 = getMemberRoleInDemand(sampleDemand, 'mem_1');
    assert.deepStrictEqual(role1, { isPrimary: true });

    const role2 = getMemberRoleInDemand(sampleDemand, 'mem_2');
    assert.strictEqual(role2?.isPrimary, false);
    assert.strictEqual(role2?.roleDescription, 'Design dos banners digitais');

    const role3 = getMemberRoleInDemand(sampleDemand, 'mem_3');
    assert.strictEqual(role3, null);
  });

  test('getAllDemandAssignees resolves all assignees with proper objects and order', () => {
    const all = getAllDemandAssignees(sampleDemand, sampleMembers);
    assert.strictEqual(all.length, 3);
    assert.strictEqual(all[0].member.name, 'Carlos Ramos');
    assert.strictEqual(all[0].isPrimary, true);

    assert.strictEqual(all[1].member.name, 'Beatriz Lima');
    assert.strictEqual(all[1].isPrimary, false);
    assert.strictEqual(all[1].roleDescription, 'Design dos banners digitais');

    assert.strictEqual(all[2].member.name, 'Amanda Ferreira');
    assert.strictEqual(all[2].isPrimary, false);
    assert.strictEqual(all[2].roleDescription, 'Fotos dos participantes');
  });
});

describe('reportUtils logic tests', () => {

  test('analyzeDemandCompletion correctly detects on-time delivery', () => {
    const dueDate = '2026-10-15T18:00:00';
    const completedAt = '2026-10-15T14:00:00'; // 4 hours early
    const demand = {
      id: 'd1',
      title: 'Arte Digital',
      description: 'Arte para banner',
      assignee_id: 'm1',
      requester: 'DOC',
      due_date: dueDate,
      category: 'Design / Arte' as const,
      priority: 'Média' as const,
      status: 'Concluído' as const,
      created_at: '2026-10-14T08:00:00',
      completed_at: completedAt,
    };

    const status = analyzeDemandCompletion(demand);
    assert.strictEqual(status.isOnTime, true);
    assert.strictEqual(status.statusLabel, 'No Prazo');
    assert.ok(status.differenceFormatted.includes('antes do prazo'));
  });

  test('analyzeDemandCompletion correctly detects late delivery', () => {
    const dueDate = '2026-10-15T12:00:00';
    const completedAt = '2026-10-16T15:00:00'; // > 1 day late
    const demand = {
      id: 'd2',
      title: 'Edição de Vídeo',
      description: 'Vídeo institucional',
      assignee_id: 'm2',
      requester: 'Gabinete DEC',
      due_date: dueDate,
      category: 'Vídeo / Edição' as const,
      priority: 'Alta' as const,
      status: 'Concluído' as const,
      created_at: '2026-10-10T08:00:00',
      completed_at: completedAt,
    };

    const status = analyzeDemandCompletion(demand);
    assert.strictEqual(status.isOnTime, false);
    assert.strictEqual(status.statusLabel, 'Fora do Prazo');
    assert.ok(status.differenceFormatted.includes('atraso'));
  });

  test('calculateReportStats aggregates metrics and breakdown by member across periods', () => {
    const refDate = new Date('2026-10-19T12:00:00Z');
    const members = [
      { id: 'm1', name: 'Carlos Ramos', role: 'Chefe', avatar_color: '#3B82F6' },
      { id: 'm2', name: 'Beatriz Lima', role: 'Designer', avatar_color: '#EC4899' },
    ];

    const demands = [
      // Completed 10 days ago (within 30 days) - On time
      {
        id: 'd1',
        title: 'Trabalho Recente No Prazo',
        description: 'Desc',
        assignee_id: 'm2',
        requester: 'DPIMA',
        due_date: '2026-10-10T18:00:00Z',
        category: 'Design / Arte' as const,
        priority: 'Alta' as const,
        status: 'Concluído' as const,
        created_at: '2026-10-05T10:00:00Z',
        completed_at: '2026-10-09T15:00:00Z',
      },
      // Completed 20 days ago (within 30 days) - Late
      {
        id: 'd2',
        title: 'Trabalho Recente Fora do Prazo',
        description: 'Desc',
        assignee_id: 'm2',
        requester: 'DPIMA',
        due_date: '2026-09-25T12:00:00Z',
        category: 'Design / Arte' as const,
        priority: 'Média' as const,
        status: 'Concluído' as const,
        created_at: '2026-09-20T10:00:00Z',
        completed_at: '2026-09-29T16:00:00Z',
      },
      // Completed 50 days ago (outside 30 days, inside 60 days) - On time
      {
        id: 'd3',
        title: 'Trabalho Antigo No Prazo',
        description: 'Desc',
        assignee_id: 'm1',
        requester: 'Gabinete DEC',
        due_date: '2026-09-01T18:00:00Z',
        category: 'Redação / Nota' as const,
        priority: 'Baixa' as const,
        status: 'Concluído' as const,
        created_at: '2026-08-25T10:00:00Z',
        completed_at: '2026-08-30T10:00:00Z',
      },
      // Active (not completed)
      {
        id: 'd4',
        title: 'Trabalho Em Andamento',
        description: 'Desc',
        assignee_id: 'm1',
        requester: 'DOM',
        due_date: '2026-10-25T18:00:00Z',
        category: 'Redação / Nota' as const,
        priority: 'Alta' as const,
        status: 'Em Produção' as const,
        created_at: '2026-10-18T10:00:00Z',
      },
    ];

    // Check 30_days stats
    const stats30 = calculateReportStats(demands, members, '30_days', undefined, undefined, refDate);
    assert.strictEqual(stats30.totalCompleted, 2);
    assert.strictEqual(stats30.onTimeCount, 1);
    assert.strictEqual(stats30.lateCount, 1);
    assert.strictEqual(stats30.onTimeRate, 50);
    assert.strictEqual(stats30.lateRate, 50);

    const beatriz = stats30.memberSummaries.find(m => m.memberId === 'm2');
    assert.ok(beatriz);
    assert.strictEqual(beatriz.totalCompleted, 2);
    assert.strictEqual(beatriz.onTimeCount, 1);
    assert.strictEqual(beatriz.lateCount, 1);
    assert.strictEqual(beatriz.onTimeRate, 50);

    // Check 60_days stats - should include d3 as well (total 3 completed)
    const stats60 = calculateReportStats(demands, members, '60_days', undefined, undefined, refDate);
    assert.strictEqual(stats60.totalCompleted, 3);
    assert.strictEqual(stats60.onTimeCount, 2);
    assert.strictEqual(stats60.lateCount, 1);
    assert.strictEqual(stats60.onTimeRate, 67);

    // Check executive text and CSV exports
    const execText = generateReportExecutiveText(stats30);
    assert.ok(execText.includes('RELATÓRIO DE GESTÃO E PRODUTIVIDADE'));
    assert.ok(execText.includes('Total de Trabalhos Concluídos: 2'));
    assert.ok(execText.includes('Entregues no Prazo: 1 (50%)'));
    assert.ok(execText.includes('Beatriz Lima'));

    const csv = generateReportCSV(stats30, members);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('Trabalho Recente No Prazo'));
    assert.ok(csv.includes('No Prazo'));
    assert.ok(csv.includes('Fora do Prazo'));
  });

  test('getPeriodDateRange handles 30, 60, 90, 1 year and all time', () => {
    const ref = new Date('2026-10-19T12:00:00Z');
    const r30 = getPeriodDateRange('30_days', ref);
    const r60 = getPeriodDateRange('60_days', ref);
    const r90 = getPeriodDateRange('90_days', ref);
    const r1y = getPeriodDateRange('1_year', ref);
    const rAll = getPeriodDateRange('all_time', ref);

    const diff30 = (r30.endDate.getTime() - r30.startDate.getTime()) / (1000 * 60 * 60 * 24);
    assert.ok(diff30 >= 30 && diff30 <= 31);

    const diff60 = (r60.endDate.getTime() - r60.startDate.getTime()) / (1000 * 60 * 60 * 24);
    assert.ok(diff60 >= 60 && diff60 <= 61);

    const diff90 = (r90.endDate.getTime() - r90.startDate.getTime()) / (1000 * 60 * 60 * 24);
    assert.ok(diff90 >= 90 && diff90 <= 91);

    const diff1y = (r1y.endDate.getTime() - r1y.startDate.getTime()) / (1000 * 60 * 60 * 24);
    assert.ok(diff1y >= 365 && diff1y <= 366);

    assert.strictEqual(rAll.startDate.getFullYear(), 2020);
  });
});

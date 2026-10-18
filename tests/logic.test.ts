import { test, describe } from 'node:test';
import assert from 'node:assert';
import { analyzeDeadline, formatBrazilianDate } from '../src/utils/dateUtils.ts';
import { generateSingleDemandWhatsAppText, generateBatchWhatsAppReport } from '../src/utils/whatsappExport.ts';

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
});

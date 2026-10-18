import { DemandStatus } from '../types';

export interface DeadlineAnalysis {
  status: 'overdue' | 'due-soon' | 'on-track' | 'completed';
  badgeLabel: string;
  relativeText: string;
  formattedDate: string;
  isUrgentNotice: boolean;
}

export function formatBrazilianDate(isoDate: string, includeTime = true): string {
  if (!isoDate) return '-';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

export function analyzeDeadline(dueDate: string, currentStatus: DemandStatus): DeadlineAnalysis {
  if (currentStatus === 'Concluído') {
    return {
      status: 'completed',
      badgeLabel: 'Concluído',
      relativeText: 'Entregue com sucesso',
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: false,
    };
  }

  if (!dueDate) {
    return {
      status: 'on-track',
      badgeLabel: 'Sem prazo',
      relativeText: 'Sem data definida',
      formattedDate: 'Não especificado',
      isUrgentNotice: false,
    };
  }

  const now = new Date();
  const target = new Date(dueDate);

  if (isNaN(target.getTime())) {
    return {
      status: 'on-track',
      badgeLabel: 'Data inválida',
      relativeText: '-',
      formattedDate: dueDate,
      isUrgentNotice: false,
    };
  }

  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const targetDayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const nowDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const calendarDayDiff = Math.round((targetDayStart - nowDayStart) / (1000 * 60 * 60 * 24));

  const hoursStr = String(target.getHours()).padStart(2, '0') + ':' + String(target.getMinutes()).padStart(2, '0');

  // Case 1: Already passed
  if (diffMs < 0) {
    const overdueDays = Math.max(1, Math.abs(calendarDayDiff));
    return {
      status: 'overdue',
      badgeLabel: 'Atrasado',
      relativeText: calendarDayDiff === 0 
        ? `Passou hoje às ${hoursStr}`
        : `Atrasado há ${overdueDays} ${overdueDays === 1 ? 'dia' : 'dias'}`,
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: true,
    };
  }

  // Case 2: Due today or tomorrow (or within 48h)
  if (calendarDayDiff === 0) {
    return {
      status: 'due-soon',
      badgeLabel: 'Vence Hoje',
      relativeText: `Hoje até às ${hoursStr}`,
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: true,
    };
  }

  if (calendarDayDiff === 1) {
    return {
      status: 'due-soon',
      badgeLabel: 'Vence Amanhã',
      relativeText: `Amanhã às ${hoursStr}`,
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: true,
    };
  }

  // Case 3: Due within 3 days
  if (diffHours <= 72) {
    return {
      status: 'due-soon',
      badgeLabel: 'Vence em breve',
      relativeText: `Em ${calendarDayDiff} dias`,
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: false,
    };
  }

  // Case 4: On track
  return {
    status: 'on-track',
    badgeLabel: 'No prazo',
    relativeText: `Em ${diffDays} dias`,
    formattedDate: formatBrazilianDate(dueDate),
    isUrgentNotice: false,
  };
}

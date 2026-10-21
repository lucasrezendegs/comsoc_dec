import { DemandStatus } from '../types';

export interface DeadlineAnalysis {
  status: 'overdue' | 'due-soon' | 'on-track' | 'completed';
  badgeLabel: string;
  relativeText: string;
  formattedDate: string;
  isUrgentNotice: boolean;
}

export function formatBrazilianDate(isoDate?: string, includeTime = true): string {
  if (!isoDate || isoDate.trim() === '') return 'Sem data definida';
  try {
    const hasTime = isoDate.includes('T');
    
    // If it's a date-only string (e.g. "YYYY-MM-DD")
    if (!hasTime) {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }

    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (!includeTime || !hasTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

export function analyzeDeadline(dueDate?: string, currentStatus?: DemandStatus): DeadlineAnalysis {
  if (currentStatus === 'Concluído') {
    return {
      status: 'completed',
      badgeLabel: 'Concluído',
      relativeText: 'Entregue com sucesso',
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: false,
    };
  }

  if (currentStatus === 'Atrasado') {
    return {
      status: 'overdue',
      badgeLabel: 'Atrasado',
      relativeText: 'Prazo expirado',
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: true,
    };
  }

  if (!dueDate || dueDate.trim() === '') {
    return {
      status: 'on-track',
      badgeLabel: 'Sem prazo',
      relativeText: 'Sem data definida',
      formattedDate: 'Sem data definida',
      isUrgentNotice: false,
    };
  }

  const hasTime = dueDate.includes('T');
  const now = new Date();
  let target: Date;

  if (!hasTime) {
    const parts = dueDate.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return {
        status: 'on-track',
        badgeLabel: 'Sem prazo',
        relativeText: 'Sem data definida',
        formattedDate: 'Sem data definida',
        isUrgentNotice: false,
      };
    }
    // Date-only deadline: expires at 23:59:59 of that local day
    target = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
  } else {
    target = new Date(dueDate);
  }

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

  const targetDayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const nowDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const calendarDayDiff = Math.round((targetDayStart - nowDayStart) / (1000 * 60 * 60 * 24));

  const hoursStr = hasTime
    ? String(target.getHours()).padStart(2, '0') + ':' + String(target.getMinutes()).padStart(2, '0')
    : '';

  // Case 1: Already passed
  if (diffMs < 0) {
    const overdueDays = Math.max(1, Math.abs(calendarDayDiff));
    let relativeText: string;
    if (calendarDayDiff === 0) {
      relativeText = hasTime ? `Passou hoje às ${hoursStr}` : 'Venceu hoje';
    } else {
      relativeText = `Atrasado há ${overdueDays} ${overdueDays === 1 ? 'dia' : 'dias'}`;
    }
    return {
      status: 'overdue',
      badgeLabel: 'Atrasado',
      relativeText,
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: true,
    };
  }

  // Case 2: Due today
  if (calendarDayDiff === 0) {
    return {
      status: 'due-soon',
      badgeLabel: 'Vence Hoje',
      relativeText: hasTime ? `Hoje até às ${hoursStr}` : 'Hoje (dia todo)',
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: true,
    };
  }

  // Case 3: Due tomorrow
  if (calendarDayDiff === 1) {
    return {
      status: 'due-soon',
      badgeLabel: 'Vence Amanhã',
      relativeText: hasTime ? `Amanhã às ${hoursStr}` : 'Amanhã',
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: true,
    };
  }

  // Case 4: Due within 3 days
  if (diffHours <= 72) {
    return {
      status: 'due-soon',
      badgeLabel: 'Vence em breve',
      relativeText: `Em ${calendarDayDiff} dias`,
      formattedDate: formatBrazilianDate(dueDate),
      isUrgentNotice: false,
    };
  }

  // Case 5: On track
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    status: 'on-track',
    badgeLabel: 'No prazo',
    relativeText: `Em ${diffDays} dias`,
    formattedDate: formatBrazilianDate(dueDate),
    isUrgentNotice: false,
  };
}

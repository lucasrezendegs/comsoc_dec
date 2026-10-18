import React from 'react';
import { 
  Video, 
  Palette, 
  Camera, 
  FileText, 
  Printer, 
  FolderGit2, 
  AlertTriangle, 
  Flame, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  CircleDashed,
  Loader2
} from 'lucide-react';
import { DemandCategory, DemandPriority, DemandStatus } from '../types';

export function getCategoryIcon(category: DemandCategory): React.ReactElement {
  switch (category) {
    case 'Vídeo / Edição':
      return React.createElement(Video, { className: "w-3.5 h-3.5" });
    case 'Design / Arte':
      return React.createElement(Palette, { className: "w-3.5 h-3.5" });
    case 'Fotografia / Cobertura':
      return React.createElement(Camera, { className: "w-3.5 h-3.5" });
    case 'Redação / Nota':
      return React.createElement(FileText, { className: "w-3.5 h-3.5" });
    case 'Impressão / Material':
      return React.createElement(Printer, { className: "w-3.5 h-3.5" });
    default:
      return React.createElement(FolderGit2, { className: "w-3.5 h-3.5" });
  }
}

export function getCategoryBadgeClass(category: DemandCategory): string {
  switch (category) {
    case 'Vídeo / Edição':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
    case 'Design / Arte':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800/40';
    case 'Fotografia / Cobertura':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/40';
    case 'Redação / Nota':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
    case 'Impressão / Material':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
}

export function getPriorityBadge(priority: DemandPriority) {
  switch (priority) {
    case 'Urgente':
      return {
        label: 'Urgente',
        className: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-200 dark:border-red-800/60 font-semibold animate-pulse',
        icon: React.createElement(Flame, { className: "w-3.5 h-3.5 text-red-600 dark:text-red-400" }),
      };
    case 'Alta':
      return {
        label: 'Alta',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800/50',
        icon: React.createElement(AlertTriangle, { className: "w-3.5 h-3.5 text-orange-600 dark:text-orange-400" }),
      };
    case 'Média':
      return {
        label: 'Média',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
        icon: React.createElement(ArrowUpRight, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400" }),
      };
    case 'Baixa':
      return {
        label: 'Baixa',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        icon: React.createElement(Clock, { className: "w-3.5 h-3.5 text-slate-500" }),
      };
  }
}

export function getStatusBadge(status: DemandStatus) {
  switch (status) {
    case 'A Fazer':
      return {
        label: 'A Fazer',
        className: 'bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200 border-slate-300 dark:border-slate-700',
        icon: React.createElement(CircleDashed, { className: "w-3.5 h-3.5 text-slate-500" }),
      };
    case 'Em Produção':
      return {
        label: 'Em Produção',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-800',
        icon: React.createElement(Loader2, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" }),
      };
    case 'Em Revisão':
      return {
        label: 'Em Revisão',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        icon: React.createElement(Clock, { className: "w-3.5 h-3.5 text-amber-600 dark:text-amber-400" }),
      };
    case 'Concluído':
      return {
        label: 'Concluído',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
        icon: React.createElement(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" }),
      };
  }
}

export const PRESET_AVATAR_COLORS = [
  { label: 'Azul Real', hex: '#3B82F6' },
  { label: 'Rosa Pink', hex: '#EC4899' },
  { label: 'Roxo Violeta', hex: '#8B5CF6' },
  { label: 'Esmeralda', hex: '#10B981' },
  { label: 'Âmbar Dourado', hex: '#F59E0B' },
  { label: 'Vermelho Coral', hex: '#EF4444' },
  { label: 'Ciano Oceano', hex: '#06B6D4' },
  { label: 'Índigo Noite', hex: '#6366F1' },
];

export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

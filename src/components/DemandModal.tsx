import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Calendar, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  Link as LinkIcon, 
  User, 
  FileText,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Users,
  UserPlus
} from 'lucide-react';
import { Demand, DemandAssignee, DemandCategory, DemandPriority, DemandStatus, TeamMember } from '../types';
import { useToast } from './Toast';

interface DemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (demand: Demand) => void;
  editingDemand?: Demand | null;
  members: TeamMember[];
  defaultAssigneeId?: string;
}

const CATEGORIES: DemandCategory[] = [
  'Vídeo / Edição',
  'Design / Arte',
  'Fotografia / Cobertura',
  'Redação / Nota',
  'Impressão / Material',
  'Outros',
];

const PRIORITIES: DemandPriority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];
const STATUSES: DemandStatus[] = ['A Fazer', 'Em Produção', 'Em Revisão', 'Atrasado', 'Concluído'];

export const DemandModal: React.FC<DemandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDemand,
  members,
  defaultAssigneeId,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [additionalAssignees, setAdditionalAssignees] = useState<DemandAssignee[]>([]);
  const [requester, setRequester] = useState('');
  const [hasNoDate, setHasNoDate] = useState(false);
  const [hasNoTime, setHasNoTime] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [category, setCategory] = useState<DemandCategory>('Design / Arte');
  const [priority, setPriority] = useState<DemandPriority>('Média');
  const [status, setStatus] = useState<DemandStatus>('A Fazer');
  const [filesLink, setFilesLink] = useState('');

  // Helper to format date offset in YYYY-MM-DD
  const getOffsetDateStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (editingDemand) {
      setTitle(editingDemand.title || '');
      setDescription(editingDemand.description || '');
      setAssigneeId(editingDemand.assignee_id || '');
      setAdditionalAssignees(editingDemand.additional_assignees ? [...editingDemand.additional_assignees] : []);
      setRequester(editingDemand.requester || '');
      setCategory(editingDemand.category || 'Design / Arte');
      setPriority(editingDemand.priority || 'Média');
      setStatus(editingDemand.status || 'A Fazer');
      setFilesLink(editingDemand.files_link || '');

      // Parse existing due_date
      const rawDue = (editingDemand.due_date || '').trim();
      if (!rawDue) {
        setHasNoDate(true);
        setHasNoTime(true);
        setDateValue('');
        setTimeValue('');
      } else if (rawDue.includes('T')) {
        const [dPart, tPart] = rawDue.split('T');
        setHasNoDate(false);
        setDateValue(dPart);
        if (tPart && tPart.trim()) {
          setHasNoTime(false);
          setTimeValue(tPart.slice(0, 5));
        } else {
          setHasNoTime(true);
          setTimeValue('');
        }
      } else {
        // Date only (no time)
        setHasNoDate(false);
        setHasNoTime(true);
        setDateValue(rawDue.slice(0, 10));
        setTimeValue('');
      }
    } else {
      setTitle('');
      setDescription('');
      setAssigneeId(defaultAssigneeId || members[0]?.id || '');
      setAdditionalAssignees([]);
      setRequester('');
      setCategory('Design / Arte');
      setPriority('Média');
      setStatus('A Fazer');
      setFilesLink('');

      // New demand defaults to tomorrow, 18:00
      setHasNoDate(false);
      setHasNoTime(false);
      setDateValue(getOffsetDateStr(1));
      setTimeValue('18:00');
    }
  }, [editingDemand, isOpen, defaultAssigneeId, members]);

  const handleToggleNoDate = (checked: boolean) => {
    setHasNoDate(checked);
    if (checked) {
      // If no date, automatically has no time
      setHasNoTime(true);
    } else {
      setHasNoTime(false);
      if (!dateValue) {
        setDateValue(getOffsetDateStr(1));
      }
      if (!timeValue) {
        setTimeValue('18:00');
      }
    }
  };

  const handleToggleNoTime = (checked: boolean) => {
    if (hasNoDate) return;
    setHasNoTime(checked);
    if (!checked && !timeValue) {
      setTimeValue('18:00');
    }
  };

  const applyQuickDate = (offsetDays: number) => {
    setDateValue(getOffsetDateStr(offsetDays));
    setHasNoDate(false);
  };

  const handleAddAdditionalAssignee = () => {
    const usedIds = new Set([assigneeId, ...additionalAssignees.map(a => a.member_id)]);
    const availableMember = members.find(m => !usedIds.has(m.id));
    setAdditionalAssignees(prev => [
      ...prev,
      { member_id: availableMember ? availableMember.id : (members[0]?.id || ''), role_description: '' },
    ]);
  };

  const handleUpdateAdditionalAssignee = (index: number, field: 'member_id' | 'role_description', value: string) => {
    setAdditionalAssignees(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveAdditionalAssignee = (index: number) => {
    setAdditionalAssignees(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('O Título da Tarefa é obrigatório.', 'error');
      return;
    }

    if (!requester.trim()) {
      showToast('Informe para quem entregar / solicitante.', 'error');
      return;
    }

    // Calculate final due_date
    let finalDueDate = '';
    if (!hasNoDate) {
      if (!dateValue.trim()) {
        showToast('Informe a Data de Entrega ou marque "Sem data definida".', 'error');
        return;
      }
      if (hasNoTime || !timeValue.trim()) {
        finalDueDate = dateValue.trim();
      } else {
        finalDueDate = `${dateValue.trim()}T${timeValue.trim()}`;
      }
    }

    const cleanedAdditional: DemandAssignee[] = additionalAssignees
      .filter(a => a.member_id && a.member_id !== assigneeId)
      .map(a => ({
        member_id: a.member_id,
        role_description: a.role_description?.trim() || undefined,
      }));

    const demandToSave: Demand = {
      id: editingDemand ? editingDemand.id : `dem_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      assignee_id: assigneeId,
      additional_assignees: cleanedAdditional.length > 0 ? cleanedAdditional : undefined,
      requester: requester.trim(),
      due_date: finalDueDate,
      category,
      priority,
      status,
      files_link: filesLink.trim(),
      created_at: editingDemand ? editingDemand.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: editingDemand?.completed_at,
    };

    onSave(demandToSave);
    showToast(editingDemand ? 'Demanda atualizada com sucesso!' : 'Nova demanda cadastrada no painel!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editingDemand ? 'Editar Demanda' : 'Cadastrar Nova Demanda'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seção de Comunicação Social
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Título da Tarefa */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Título da Tarefa *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Edição do vídeo institucional de encerramento de ano"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 font-medium"
            />
          </div>

          {/* Para quem entregar / Solicitante */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Para quem entregar / Solicitante *</span>
            </label>
            <input
              type="text"
              required
              value={requester}
              onChange={e => setRequester(e.target.value)}
              placeholder="Ex: Chefia do Gabinete, Diretoria Geral, RH, Assessoria de Imprensa..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </div>

          {/* Equipe Responsável pela Demanda (Responsável Principal + Responsáveis Adicionais) */}
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Responsáveis pela Demanda</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Defina o responsável principal e adicione outros membros com suas respectivas atribuições.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAdditionalAssignee}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-100/90 dark:bg-sky-950/80 hover:bg-sky-200 dark:hover:bg-sky-900 border border-sky-300/80 dark:border-sky-800 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Adicionar mais uma pessoa responsável nesta demanda"
              >
                <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Adicionar mais um responsável</span>
              </button>
            </div>

            {/* Responsável Principal */}
            <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Responsável Principal</span>
                </span>
                <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800/60">
                  Líder da Demanda
                </span>
              </div>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer font-medium"
              >
                <option value="">A definir / Sem responsável principal</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de Responsáveis Adicionais */}
            {additionalAssignees.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  <span>Co-responsáveis Adicionais ({additionalAssignees.length})</span>
                  <span className="text-[10px] normal-case text-slate-400 font-normal">
                    Cada pessoa terá sua atribuição específica registrada
                  </span>
                </div>

                {additionalAssignees.map((assignee, idx) => {
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-2xs animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Responsável Adicional
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalAssignee(idx)}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-1 rounded-md transition cursor-pointer"
                          title="Remover este responsável da demanda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* Seleção do Membro */}
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Pessoa Responsável:
                          </label>
                          <select
                            value={assignee.member_id}
                            onChange={e => handleUpdateAdditionalAssignee(idx, 'member_id', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer font-medium"
                          >
                            <option value="">Selecione o integrante...</option>
                            {members.map(m => (
                              <option 
                                key={m.id} 
                                value={m.id}
                                disabled={m.id === assigneeId}
                              >
                                {m.name} — {m.role} {m.id === assigneeId ? '(Já é Principal)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Espaço para descricionar o que aquela pessoa terá que fazer */}
                        <div className="sm:col-span-7">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                            <span>O que esta pessoa terá que fazer nesta demanda:</span>
                          </label>
                          <textarea
                            rows={2}
                            value={assignee.role_description || ''}
                            onChange={e => handleUpdateAdditionalAssignee(idx, 'role_description', e.target.value)}
                            placeholder="Descreva a atribuição: ex. 'Gravar captação de áudio e entrevistas', 'Criar artes dos stories', 'Revisar ortografia'..."
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prazo de Entrega: Data e Horário Separados + Opções */}
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Prazo de Entrega</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Defina a data e o horário limite de conclusão.
                </p>
              </div>

              {/* Atalhos Rápidos de Data */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyQuickDate(0)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-300 transition cursor-pointer"
                  title="Definir prazo para hoje"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickDate(1)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-300 transition cursor-pointer"
                  title="Definir prazo para amanhã"
                >
                  Amanhã
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickDate(3)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-300 transition cursor-pointer"
                  title="Definir prazo para daqui a 3 dias"
                >
                  Em 3 dias
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickDate(7)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-300 transition cursor-pointer"
                  title="Definir prazo para daqui a 1 semana"
                >
                  Em 1 semana
                </button>
              </div>
            </div>

            {/* Inputs de Data e Horário em 2 Colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Coluna 1: Data de Entrega */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Data de Entrega</span>
                  {hasNoDate && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      (Sem data definida)
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  disabled={hasNoDate}
                  value={hasNoDate ? '' : dateValue}
                  onChange={e => {
                    setDateValue(e.target.value);
                    if (hasNoDate) setHasNoDate(false);
                  }}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs transition ${
                    hasNoDate
                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700/50 cursor-not-allowed opacity-60'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500'
                  }`}
                />
              </div>

              {/* Coluna 2: Horário Limite */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Horário Limite</span>
                  </span>
                  {(hasNoTime || hasNoDate) && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {hasNoDate ? '(Indisponível sem data)' : '(Dia inteiro / Sem horário)'}
                    </span>
                  )}
                </label>
                <input
                  type="time"
                  disabled={hasNoTime || hasNoDate}
                  value={hasNoTime || hasNoDate ? '' : timeValue}
                  onChange={e => {
                    setTimeValue(e.target.value);
                    if (hasNoTime) setHasNoTime(false);
                  }}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs transition ${
                    hasNoTime || hasNoDate
                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700/50 cursor-not-allowed opacity-60'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500'
                  }`}
                />
              </div>
            </div>

            {/* Opções (Checkboxes) */}
            <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center gap-4 text-xs border-t border-slate-200/70 dark:border-slate-700/70">
              {/* Opção 1: Sem data definida */}
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={hasNoDate}
                  onChange={e => handleToggleNoDate(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                />
                <div>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                    Sem data definida
                  </span>
                  <span className="text-[11px] text-slate-400 block sm:inline sm:ml-1">
                    (automaticamente não tem horário definido)
                  </span>
                </div>
              </label>

              {/* Opção 2: Sem horário definido */}
              <label className={`flex items-center gap-2 select-none group ${
                hasNoDate ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  disabled={hasNoDate}
                  checked={hasNoTime || hasNoDate}
                  onChange={e => handleToggleNoTime(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                />
                <div>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                    Sem horário definido
                  </span>
                  <span className="text-[11px] text-slate-400 block sm:inline sm:ml-1">
                    (pode ter data, mas para o dia inteiro)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Categoria, Prioridade e Status em 3 colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Categoria */}
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as DemandCategory)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 cursor-pointer"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as DemandPriority)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none font-semibold cursor-pointer ${
                  priority === 'Urgente'
                    ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800'
                    : priority === 'Alta'
                    ? 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800'
                    : priority === 'Média'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Atual */}
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Status Atual
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as DemandStatus)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none font-semibold cursor-pointer ${
                  status === 'Concluído'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                    : status === 'Em Produção'
                    ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                    : status === 'Em Revisão'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição / Briefing */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Descrição / Briefing (orientações e detalhes técnicos)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva dimensões, público-alvo, referências visuais, roteiro ou instruções específicas..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-none"
            />
          </div>

          {/* Link de Arquivos / Entrega */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Link de Arquivos / Entrega (Google Drive, Canva, Figma, OneDrive...)</span>
            </label>
            <input
              type="url"
              value={filesLink}
              onChange={e => setFilesLink(e.target.value)}
              placeholder="https://drive.google.com/... ou https://canva.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold shadow-sm transition"
            >
              {editingDemand ? 'Atualizar Demanda' : 'Criar Demanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

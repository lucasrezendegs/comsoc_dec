import React, { useState } from 'react';
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  Check, 
  Mail, 
  Briefcase, 
  Palette,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { Demand, TeamMember } from '../types';
import { isMemberAssignedToDemand } from '../utils/assigneeHelpers';
import { PRESET_AVATAR_COLORS, getInitials } from '../utils/styleHelpers';
import { useToast } from './Toast';

interface TeamManagementProps {
  members: TeamMember[];
  demands: Demand[];
  onSaveMember: (member: TeamMember) => void;
  onDeleteMember: (id: string) => void;
  onViewMemberDemands?: (memberId: string) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  members,
  demands,
  onSaveMember,
  onDeleteMember,
  onViewMemberDemands,
}) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [avatarColor, setAvatarColor] = useState(PRESET_AVATAR_COLORS[0].hex);

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setRole('');
    setEmail('');
    setAvatarColor(PRESET_AVATAR_COLORS[Math.floor(Math.random() * PRESET_AVATAR_COLORS.length)].hex);
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setEmail(member.email || '');
    setAvatarColor(member.avatar_color || PRESET_AVATAR_COLORS[0].hex);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      showToast('Por favor, preencha o Nome e a Função do membro.', 'error');
      return;
    }

    const memberToSave: TeamMember = {
      id: editingMember ? editingMember.id : `mem_${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      email: email.trim() || undefined,
      avatar_color: avatarColor,
      created_at: editingMember?.created_at || new Date().toISOString(),
    };

    onSaveMember(memberToSave);
    showToast(editingMember ? 'Membro atualizado com sucesso!' : 'Novo membro cadastrado!', 'success');
    setIsModalOpen(false);
  };

  const handleDelete = (member: TeamMember) => {
    const activeTasks = demands.filter(d => d.assignee_id === member.id && d.status !== 'Concluído').length;
    let message = `Deseja realmente remover ${member.name} da equipe?`;
    if (activeTasks > 0) {
      message += `\n⚠️ Atenção: este integrante possui ${activeTasks} demanda(s) ativa(s)!`;
    }

    if (window.confirm(message)) {
      onDeleteMember(member.id);
      showToast(`${member.name} foi removido da equipe.`, 'info');
    }
  };

  const roleSuggestions = [
    'Chefe da Seção / Coordenação',
    'Designer Gráfico',
    'Editor de Vídeo & Motion',
    'Fotógrafo & Cobertura',
    'Redator & Assessor de Imprensa',
    'Social Media / Comunicação Digital',
    'Relações Públicas',
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Equipe da Seção de Comunicação Social</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {members.length} integrantes
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre os profissionais, defina especialidades e cores para identificação rápida nas demandas.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 active:scale-95 text-white transition shadow-sm self-start sm:self-center shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Adicionar Novo Membro</span>
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => {
          const memberDemands = demands.filter(d => isMemberAssignedToDemand(d, member.id));
          const activeTasks = memberDemands.filter(d => d.status !== 'Concluído').length;
          const completedTasks = memberDemands.filter(d => d.status === 'Concluído').length;

          return (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 shadow-xs hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold text-white shadow-md shrink-0"
                    style={{ backgroundColor: member.avatar_color || '#3B82F6' }}
                  >
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{member.name}</span>
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{member.role}</span>
                    </div>
                  </div>
                </div>
              </div>

              {member.email && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono truncate bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}

              {/* Task Counters */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Ativas</span>
                  <span className={`text-base font-bold ${
                    activeTasks > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {activeTasks}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Concluídas</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {completedTasks}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                {onViewMemberDemands ? (
                  <button
                    type="button"
                    onClick={() => onViewMemberDemands(member.id)}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition cursor-pointer flex items-center gap-1 hover:underline"
                    title={`Ver as demandas de ${member.name}`}
                  >
                    <span>Ver Demandas</span>
                    <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {activeTasks} ativa(s) • {completedTasks} concluída(s)
                  </span>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Editar dados do integrante"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    title="Remover integrante"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>{editingMember ? 'Editar Integrante' : 'Novo Integrante da Seção'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {/* Nome */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Mariana Castro"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                />
              </div>

              {/* Função / Especialidade */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Função / Especialidade *
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="Ex: Editor de Vídeo, Designer, Fotógrafo, Redator..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {roleSuggestions.slice(0, 4).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRole(s)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      {s.split('/')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Institucional (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nome@orgao.gov.br"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                />
              </div>

              {/* Cor do Avatar */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Cor do Avatar de Identificação
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {name ? getInitials(name) : 'CS'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {PRESET_AVATAR_COLORS.map(color => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setAvatarColor(color.hex)}
                        className={`w-6 h-6 rounded-lg transition-transform ${
                          avatarColor === color.hex ? 'scale-115 ring-2 ring-offset-2 ring-slate-800 dark:ring-white' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm transition"
                >
                  {editingMember ? 'Salvar Alterações' : 'Cadastrar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

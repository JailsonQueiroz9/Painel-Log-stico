import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Users, Check, Loader2, Save, Hash, Trash2 } from 'lucide-react';
import { User, ChatGroup, GroupCreatePayload } from '../types';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  group: ChatGroup;
  onUpdate: (id: string, payload: GroupCreatePayload) => Promise<void>;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  currentUser,
  group,
  onUpdate 
}) => {
  const [groupName, setGroupName] = useState(group.name);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(group.members || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGroupName(group.name);
      setSelectedMembers(group.members || []);
      setSearchTerm('');
    }
  }, [isOpen, group]);

  const availableUsers = useMemo(() => {
    return users.filter(u => u.id !== currentUser?.id && u.name !== currentUser?.name);
  }, [users, currentUser]);

  const filteredUsers = useMemo(() => {
    return availableUsers.filter(u => 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableUsers, searchTerm]);

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredUsers.map(u => u.id));
    }
  };

  const handleUpdate = async () => {
    if (!groupName.trim()) {
      alert("Por favor, insira um nome para o grupo.");
      return;
    }

    if (!group.id) {
      alert("Grupo nativo ou sem ID não pode ser editado aqui.");
      return;
    }

    setIsLoading(true);
    try {
      const members = Array.from(new Set([...selectedMembers, currentUser?.id].filter(Boolean) as string[]));

      await onUpdate(group.id, {
        name: groupName.toUpperCase(),
        members: members
      });
      
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error);
      alert("Falha ao atualizar grupo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isBaseGroup = group.sheetName === 'CHAT' || group.sheetName === 'LOG_INT';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-500 border border-primary-500/20">
              <Hash size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Gerenciar Grupo</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">Controle de Membros</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Nome do Grupo */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic flex items-center gap-2">
              <Hash size={12} /> Nome do Canal
            </label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isBaseGroup}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all uppercase tracking-widest disabled:opacity-50"
              placeholder="EX: LOGÍSTICA EXTERNA"
            />
            {isBaseGroup && (
              <p className="text-[10px] text-amber-500 font-bold italic mt-2">
                * Canais base do sistema não podem ter o nome alterado.
              </p>
            )}
          </div>

          {/* Seleção de Membros */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic flex items-center gap-2">
                <Users size={12} /> Membros ({selectedMembers.length + 1})
              </label>
              <button 
                onClick={toggleSelectAll}
                disabled={isBaseGroup}
                className="text-[10px] font-black text-primary-500 hover:text-primary-400 uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {selectedMembers.length === filteredUsers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="BUSCAR COLABORADORES..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[10px] font-black text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all uppercase tracking-widest placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {/* Current User is always a member */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary-500/20 bg-primary-600/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary-600/20">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">{currentUser?.name}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 truncate">{currentUser?.email}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white">
                  <Check size={12} />
                </div>
              </div>

              {filteredUsers.map(user => {
                const isSelected = selectedMembers.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    disabled={isBaseGroup}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected 
                        ? 'border-primary-500/50 bg-primary-600/10' 
                        : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all overflow-hidden ${
                      isSelected 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-white/5'
                    }`}>
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        (user.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-black uppercase truncate tracking-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        {user.name}
                      </p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 scale-100' 
                        : 'border-2 border-slate-200 dark:border-white/10 scale-90 opacity-50'
                    }`}>
                      {isSelected && <Check size={12} />}
                    </div>
                  </button>
                );
              })}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Nenhum colaborador encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-200 dark:hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          {!isBaseGroup && (
            <button 
              onClick={handleUpdate}
              disabled={isLoading || !groupName.trim()}
              className="px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar Alterações
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;

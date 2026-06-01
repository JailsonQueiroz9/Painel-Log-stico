
import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  Search,
  User as UserIcon,
  Layout,
  BarChart,
  History,
  Settings as SettingsIcon,
  Zap,
  MessageSquare,
  Clock,
  RefreshCw,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { User, ViewType } from '../types';
import { storageService } from '../services/storageService';
import UserModal from './UserModal';

interface UserManagementProps {
  users: User[];
  onRefreshUsers: () => void;
  currentUser: User | null;
  theme?: 'dark' | 'light';
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onRefreshUsers, currentUser, theme = 'dark' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Deseja realmente EXCLUIR este acesso permanentemente?')) return;
    setDeletingUserId(id);
    try {
      await storageService.deleteRecord(id, "CADASTRO USUÁRIO");
      onRefreshUsers();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.name || u.USUÁRIO || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || u['E-MAIL'] || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-custom-main">
      
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Cabeçalho Pro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`p-4 ${theme === 'light' ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-primary-600/10 border-primary-500/20 text-primary-500'} rounded-2xl border`}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-custom-main">Configurações de Acesso</h1>
              <p className={`${theme === 'light' ? 'text-slate-500' : 'text-slate-600'} text-[9px] font-black uppercase tracking-[0.4em] mt-1 italic`}>Gerenciamento de Operadores e Permissões</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group w-full md:w-80">
              <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-slate-400' : 'text-slate-700'}`} />
              <input 
                type="text" 
                placeholder="BUSCAR OPERADOR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} text-custom-main rounded-xl pl-12 pr-4 py-3 text-[10px] font-black focus:outline-none focus:border-primary-500 transition-all uppercase tracking-widest placeholder:text-slate-400 shadow-sm`}
              />
            </div>
            <button 
              onClick={() => { setEditingUser(undefined); setIsUserModalOpen(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg glow-primary active:scale-95 shrink-0"
            >
              <UserPlus size={16} /> NOVO USUÁRIO
            </button>
          </div>
        </div>

        {/* Lista de Usuários Estilo Imagem de Referência */}
        <div className="space-y-4">
          {filteredUsers.map((u) => {
            const initials = (u.name || u.USUÁRIO || '?').charAt(0).toUpperCase();
            const isAdmin = u.role === 'admin' || String(u.PAPEL || u.role).toLowerCase() === 'admin';
            
            // Verificação de status estrita: apenas 'ativo' (minúsculo) é Ativo.
            const isActive = String(u.status || '').toLowerCase().trim() === 'ativo';
            const location = u.location || u.Location || 'N/A';

            return (
              <div key={u.id} className={`bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-900 rounded-[32px] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8 ${theme === 'light' ? 'hover:bg-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.03)]' : 'hover:bg-white/5 shadow-xl'} transition-all group`}>
                
                {/* Perfil */}
                <div className="flex items-center gap-6 min-w-[280px]">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'text-slate-900' : 'text-slate-900 dark:text-white'} text-2xl font-black shadow-lg ${isAdmin ? 'bg-primary-600 shadow-primary-600/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-custom-main uppercase tracking-tight">{u.name || u.USUÁRIO}</h3>
                    <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'} font-bold lowercase opacity-60`}>{u.email || u['E-MAIL']}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-primary-500/70">
                      <MapPin size={10} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{location}</span>
                    </div>
                  </div>
                </div>

                {/* Módulos Autorizados conforme Imagem */}
                <div className="flex flex-col gap-3">
                  <span className={`text-[8px] font-black ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'} uppercase tracking-[0.3em] italic ml-1`}>Telas Autorizadas</span>
                  <div className="flex items-center gap-2">
                    <PermissionIcon active={u.allowedViews?.includes('dashboard')} theme={theme} label="DSH" icon={<Layout size={14} />} />
                    <PermissionIcon active={u.allowedViews?.includes('reports')} theme={theme} label="REP" icon={<BarChart size={14} />} />
                    <PermissionIcon active={u.allowedViews?.includes('history')} theme={theme} icon={<History size={14} />} label="HST" />
                    <PermissionIcon active={u.allowedViews?.includes('chat')} theme={theme} label="CHT" icon={<MessageSquare size={14} />} />
                    <PermissionIcon active={u.allowedViews?.includes('follow-up-pre')} theme={theme} label="PRE" icon={<Clock size={14} />} />
                    <PermissionIcon active={u.allowedViews?.includes('follow-up')} theme={theme} label="FOL" icon={<Zap size={14} />} />
                    <PermissionIcon active={u.allowedViews?.includes('settings')} theme={theme} label="CFG" icon={<SettingsIcon size={14} />} />
                  </div>
                </div>

                {/* Nível e Status Badge - Alinhado à imagem enviada */}
                <div className="flex flex-col items-center justify-center min-w-[140px] gap-2 lg:border-l lg:border-slate-200 dark:border-white/5 lg:pl-8">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-primary-500' : 'text-slate-500'}`}>
                    NÍVEL: {isAdmin ? 'ADMIN' : 'USER'}
                  </p>
                  <div className={`px-5 py-1.5 rounded-lg border transition-all ${isActive ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-rose-500 border-rose-500/30 bg-rose-500/5 shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{isActive ? 'ATIVO' : 'INATIVO'}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="p-3 text-slate-600 hover:text-slate-900 dark:text-white transition-colors"><Edit3 size={18} /></button>
                  {u.id !== currentUser?.id && (
                    <button onClick={() => handleDeleteUser(u.id)} className="p-3 text-slate-800 hover:text-rose-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => { setIsUserModalOpen(false); setEditingUser(undefined); }} 
        onSave={onRefreshUsers} 
        editingUser={editingUser}
        theme={theme}
      />
    </div>
  );
};

const PermissionIcon = ({ active, label, icon, theme }: { active?: boolean; label: string; icon: any; theme: 'light' | 'dark' }) => (
  <div className={`w-12 h-12 flex flex-col items-center justify-center gap-0.5 border rounded-xl transition-all duration-300 ${active ? 'bg-primary-600/10 border-primary-500 text-primary-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : `bg-transparent ${theme === 'light' ? 'border-slate-100' : 'border-slate-900'} text-slate-900 opacity-20`}`}>
    {icon}
    <span className="text-[7px] font-black tracking-tighter">{label}</span>
  </div>
);

export default UserManagement;

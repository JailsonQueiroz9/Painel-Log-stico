
import React, { useState } from 'react';
import { 
  Users, Plus, Search, Hash, AtSign, 
  ChevronDown, ChevronRight, MessageSquare, Clock,
  PanelLeftClose
} from 'lucide-react';
import { ChatGroup, User } from '../types';
import { storageService } from '../services/storageService';

interface SidebarChatProps {
  currentUser: User | null;
  users: User[];
  groups: ChatGroup[];
  activeSession: ChatGroup;
  onSelect: (session: ChatGroup) => void;
  onAddGroup: () => void;
  unreadMap: Record<string, number>;
  previews: Record<string, string>;
  isOpen?: boolean;
  onToggle?: () => void;
  googleToken?: string | null;
  googleSpaces?: any[];
  onConnectGoogle?: () => void;
  onDisconnectGoogle?: () => void;
  loadingGoogleSpaces?: boolean;
}

const SidebarChat: React.FC<SidebarChatProps> = ({ 
  currentUser, users, groups, activeSession, onSelect, onAddGroup, unreadMap, previews, isOpen = true, onToggle,
  googleToken, googleSpaces, onConnectGoogle, onDisconnectGoogle, loadingGoogleSpaces
}) => {
  const [q, setQ] = useState('');
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);
  const [isDMsOpen, setIsDMsOpen] = useState(true);

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (u.name || '').toLowerCase().includes(q.toLowerCase())
  );

  const visibleGroups = React.useMemo(() => {
    return groups.filter(g => {
      const isBaseGroup = g.sheetName === 'CHAT' || g.sheetName === 'LOG_INT';
      if (isBaseGroup) return true;
      return g.members && currentUser?.id && g.members.includes(currentUser.id);
    });
  }, [groups, currentUser]);

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 flex flex-col shrink-0">
      <div className="p-8 border-b border-slate-200 dark:border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <MessageSquare size={18} className="text-primary-500" />
             <h2 className="text-custom-main font-black uppercase text-[10px] tracking-[0.3em] italic">Comunicações</h2>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onAddGroup} 
              className="p-2 text-slate-500 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all"
              title="Criar novo grupo operacional"
            >
              <Plus size={16} />
            </button>
            {onToggle && (
              <button 
                onClick={onToggle} 
                className="p-2 text-slate-500 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all"
                title="Ocultar Sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" />
          <input 
            type="text" 
            placeholder="BUSCAR EQUIPE..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-[9px] font-black text-custom-main outline-none focus:border-primary-500 transition-all uppercase tracking-widest placeholder:text-slate-800"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* GRUPOS */}
        <div className="space-y-4">
          <button 
            onClick={() => setIsGroupsOpen(!isGroupsOpen)}
            className="w-full flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] px-2 hover:text-primary-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users size={10} /> Canais Operacionais
            </div>
            {isGroupsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {isGroupsOpen && (
            <div className="space-y-1">
              {visibleGroups.map(g => (
              <button 
                key={g.sheetName}
                onClick={() => onSelect(g)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative border ${activeSession.sheetName === g.sheetName ? 'bg-primary-600/10 border-primary-500/20 text-white' : 'text-slate-500 hover:bg-white/5 border-transparent'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activeSession.sheetName === g.sheetName ? 'bg-primary-600 border-primary-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-700'}`}>
                  <Hash size={18} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase truncate tracking-tight">{g.name}</p>
                    {unreadMap[g.sheetName] > 0 && (
                      <span className="bg-primary-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                        {unreadMap[g.sheetName]}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] opacity-40 truncate mt-0.5 italic">
                    {previews[g.sheetName] || "Sem mensagens recentes"}
                  </p>
                </div>
              </button>
            ))}
          </div>
          )}
        </div>

        {/* DMs */}
        <div className="space-y-4">
          <button 
            onClick={() => setIsDMsOpen(!isDMsOpen)}
            className="w-full flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] px-2 hover:text-primary-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AtSign size={10} /> Mensagens Diretas
            </div>
            {isDMsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {isDMsOpen && (
            <div className="space-y-1">
              {filteredUsers.map(u => {
              const dmSheet = storageService.buildDM(currentUser?.name || '', u.name || '');
              const isActive = activeSession.sheetName === dmSheet;
              return (
                <button 
                  key={u.id}
                  onClick={() => onSelect({ name: u.name, sheetName: dmSheet, type: 'dm', unreadCount: 0, lastReadCount: 0, members: [] })}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative border ${isActive ? 'bg-emerald-600/10 border-emerald-500/20 text-white' : 'text-slate-500 hover:bg-white/5 border-transparent'}`}
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-black text-[10px] overflow-hidden ${isActive ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-600'}`}>
                      {u.profileImage ? (
                        <img 
                          src={u.profileImage} 
                          alt={u.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || 'U') + '&background=random';
                          }}
                        />
                      ) : (
                        (u.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0c1425] rounded-full shadow-lg" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase truncate tracking-tight">{u.name}</p>
                      {unreadMap[dmSheet] > 0 && (
                        <span className="bg-emerald-500 text-slate-900 dark:text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                          {unreadMap[dmSheet]}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] opacity-40 truncate mt-0.5">
                      {previews[dmSheet] || "Abrir chat privado"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* GOOGLE CHAT INTEGRADO */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
          <div className="w-full flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animator-pulse" />
              Google Chat™ Salas
            </div>
            {googleToken && onDisconnectGoogle && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDisconnectGoogle(); }}
                className="text-[7px] text-slate-700 hover:text-rose-500 font-bold tracking-tight uppercase hover:underline"
              >
                desconectar
              </button>
            )}
          </div>

          {!googleToken ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col gap-3">
              <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest leading-normal">
                Conecte-se com salas corporativas reais do Google Workspace.
              </p>
              <button 
                onClick={onConnectGoogle}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[8px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg active:scale-95"
              >
                CONECTAR GOOGLE CHAT
              </button>
            </div>
          ) : loadingGoogleSpaces ? (
            <div className="text-center py-4">
              <span className="text-[7px] font-black uppercase tracking-widest text-slate-700 animate-pulse">Buscando canais...</span>
            </div>
          ) : googleSpaces && googleSpaces.length > 0 ? (
            <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              {googleSpaces.map(space => {
                const isActive = activeSession.sheetName === space.name;
                return (
                  <button 
                    key={space.name}
                    onClick={() => onSelect({ name: space.displayName || 'Google Chat Space', sheetName: space.name, type: 'google-chat', unreadCount: 0, lastReadCount: 0, members: [] })}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative border ${isActive ? 'bg-blue-600/10 border-blue-500/20 text-white' : 'text-slate-500 hover:bg-white/5 border-transparent'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-[10px] overflow-hidden ${isActive ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-blue-500'}`}>
                      {space.displayName ? space.displayName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[11px] font-black uppercase truncate tracking-tight">{space.displayName || 'Unnamed Space'}</p>
                      <p className="text-[8px] opacity-40 uppercase font-bold tracking-wider mt-0.5">Google Chat Space</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl text-center border border-slate-200 dark:border-white/5">
              <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest leading-normal">Nenhum canal ativo encontrado.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-primary-600/20 overflow-hidden shrink-0">
              {currentUser?.profileImage ? (
                <img 
                  src={currentUser.profileImage} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser?.name || 'U') + '&background=random';
                  }}
                />
              ) : (
                currentUser?.name?.charAt(0).toUpperCase() || "U"
              )}
           </div>
           <div className="min-w-0">
              <p className="text-[9px] font-black text-custom-main uppercase truncate">{currentUser?.name}</p>
              <p className="text-[7px] text-slate-600 font-bold uppercase tracking-widest">Sessão Operacional</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarChat;


import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Settings, 
  ChevronRight, 
  LogOut,
  ChevronLeft,
  User as UserIcon,
  Menu,
  X,
  Zap,
  History as HistoryIcon,
  Clock,
  Users,
  Palette,
  Mail
} from 'lucide-react';
import { User, ViewType, FilterState, AWBStatus } from '../types';
import ProfileModal from './ProfileModal';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  colorTheme: string;
  onChangeColorTheme: (theme: string) => void;
  onUserUpdate?: (updatedUser: User) => void;
  onOpenThemeSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, onLogout, currentView, onNavigate, filters, onFilterChange, theme, onToggleTheme, colorTheme, onChangeColorTheme, onUserUpdate, onOpenThemeSettings
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems: { icon: any; label: string; view: ViewType }[] = [
    { icon: LayoutDashboard, label: 'Painel Geral', view: 'dashboard' },
    { icon: MessageSquare, label: 'Chat Equipe', view: 'chat' },
    { icon: HistoryIcon, label: 'Histórico', view: 'history' },
    { icon: Clock, label: 'Follow-UP PRÉ', view: 'follow-up-pre' },
    { icon: Zap, label: 'Follow-UP AWB', view: 'follow-up' },
    { icon: Mail, label: 'Central Gmail', view: 'gmail' },
    { icon: Users, label: 'Cadastro Usuários', view: 'users' },
    { icon: Settings, label: 'Configurações', view: 'settings' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (user.role === 'admin') return true;
    return user.allowedViews?.includes(item.view);
  });

  const toggleStatus = (status: AWBStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  const userInitial = (user.name || user.USUÁRIO || 'U').charAt(0).toUpperCase();

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[70]">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-[65] lg:relative lg:flex flex-col h-screen transition-all duration-300 ease-in-out
        ${theme === 'light' ? 'bg-white border-blue-100 shadow-[20px_0_40px_rgba(59,130,246,0.03)]' : 'bg-custom-main border-slate-900/50'}
        border-r text-custom-main
        ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        ${collapsed && !mobileOpen ? 'lg:w-20' : 'lg:w-72'}
      `}>
        
        <div className="p-8 pb-6 flex items-center justify-between">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-black italic shadow-lg shadow-primary-600/20"><Zap size={16} /></div>
              <div className="leading-none">
                <span className="text-custom-main font-black text-lg tracking-tighter uppercase italic">Follow-UP</span>
                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-0.5">Air Logistics v3.2</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto"><Zap size={24} className="text-primary-500" /></div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1.5 text-slate-600 hover:text-slate-900 dark:text-white transition-colors">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="px-4 space-y-1 mt-4 overflow-y-auto no-scrollbar flex-1">
          {filteredMenuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => { onNavigate(item.view); setMobileOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                currentView === item.view 
                  ? 'bg-primary-600 text-white shadow-xl shadow-primary-900/10' 
                  : `text-custom-main opacity-70 hover:opacity-100 ${theme === 'light' ? 'hover:bg-blue-50/50' : 'hover:bg-white/10'}`
              } ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
            >
              <item.icon size={18} className={`${currentView === item.view ? 'text-white' : `text-custom-main ${theme === 'light' ? 'opacity-80' : 'opacity-60'} group-hover:opacity-100 group-hover:text-primary-500`}`} />
              {(!collapsed || mobileOpen) && (
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={`mt-auto p-6 border-t ${theme === 'light' ? 'border-blue-50 bg-white' : 'border-white/5 bg-custom-main'} space-y-6`}>
          {(!collapsed || mobileOpen) && (
            <div className="space-y-3">
              <button 
                onClick={onOpenThemeSettings}
                className={`flex items-center justify-between w-full p-3 ${theme === 'light' ? 'bg-blue-50/20 hover:bg-blue-100/40' : 'bg-white/5 hover:bg-white/10'} border ${theme === 'light' ? 'border-blue-100/50' : 'border-white/5'} rounded-xl transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <Palette size={18} className="text-primary-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-custom-main opacity-70 group-hover:opacity-100 transition-colors">Tema do Sistema</span>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-primary-400 transition-colors" />
              </button>
            </div>
          )}

          {(!collapsed || mobileOpen) && (
            <button 
              onClick={() => setIsProfileOpen(true)}
              className={`w-full flex items-center gap-4 px-2 py-3 ${theme === 'light' ? 'hover:bg-blue-50/30' : 'hover:bg-white/5'} rounded-2xl transition-all text-left`}
            >
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-primary-600/20 shrink-0 overflow-hidden">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name || user.USUÁRIO} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || user.USUÁRIO || 'U') + '&background=random';
                    }}
                  />
                ) : (
                  userInitial
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-custom-main font-black text-xs uppercase truncate">
                  {user.name || user.USUÁRIO}
                </span>
                <span className="text-[9px] text-slate-600 font-bold truncate">
                  {user.cargo || 'Operador Logístico'}
                </span>
              </div>
            </button>
          )}

          <div className={`${collapsed && !mobileOpen ? 'flex justify-center' : ''}`}>
            <button 
              onClick={onLogout} 
              className={`
                flex items-center gap-3 transition-all group
                ${collapsed && !mobileOpen 
                  ? `w-12 h-12 justify-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-primary-500/20'} border rounded-xl hover:bg-rose-500/10 hover:border-rose-500/30` 
                  : `w-full px-5 py-3.5 ${theme === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-white/5 hover:bg-white/10 border-white/5'} border rounded-xl`
                }
              `}
            >
              <LogOut 
                size={20} 
                className={`${collapsed && !mobileOpen ? 'text-custom-main' : 'text-slate-500'} group-hover:text-rose-500 transition-colors`} 
              />
              {(!collapsed || mobileOpen) && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-custom-main opacity-70 group-hover:opacity-100 transition-colors">
                  Encerrar Sessão
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[64] lg:hidden" />}

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
        onNavigate={onNavigate}
        onUserUpdate={onUserUpdate}
      />
    </>
  );
};

export default Sidebar;

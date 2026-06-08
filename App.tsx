
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Auth from './components/Auth';
import Settings from './components/Settings';
import History from './components/History';
import FollowUp from './components/FollowUp';
import UserManagement from './components/UserManagement';
import ThemeSettings from './components/ThemeSettings';
import GmailCenter from './components/GmailCenter';
import { User, ViewType, FilterState } from './types';
import { storageService } from './services/storageService';
import { AlertCircle, X, RefreshCw, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [colorTheme, setColorTheme] = useState<string>('theme-dass');
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPendingAlert, setShowPendingAlert] = useState(true);
  const [lastPendingCount, setLastPendingCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
    period: 'todos'
  });

  const loadUsers = async () => {
    try {
      const cloudUsers = await storageService.getUsers();
      if (cloudUsers.length > 0) {
        setUsersList(cloudUsers);
        localStorage.setItem('app_users', JSON.stringify(cloudUsers));
        
        if (user) {
          const updatedSelf = cloudUsers.find(u => u.id === user.id);
          if (updatedSelf) {
            setUser(updatedSelf);
            localStorage.setItem('auth_user', JSON.stringify(updatedSelf));
          }
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar usuários:", e);
      setGlobalError("Erro de sincronização: A base de dados pode estar inacessível no momento.");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const savedUser = localStorage.getItem('auth_user');
        const savedTheme = localStorage.getItem('app_theme') as 'dark' | 'light';
        const savedColorTheme = localStorage.getItem('app_color_theme');
        
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.warn("Sessão corrompida, limpando...");
            localStorage.removeItem('auth_user');
          }
        }
        
        setTheme(savedTheme || 'dark');
        if (savedColorTheme) {
          setColorTheme(savedColorTheme);
          if (savedColorTheme === 'theme-custom') {
            const primary = localStorage.getItem('customPrimary');
            const secondary = localStorage.getItem('customSecondary');
            const tertiary = localStorage.getItem('customTertiary');
            
            if (primary || secondary || tertiary) {
              const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
              };

              if (secondary) {
                const rgb = hexToRgb(secondary);
                if (rgb) {
                  document.documentElement.style.setProperty('--color-primary-400', rgb);
                  document.documentElement.style.setProperty('--color-primary-500', rgb);
                  document.documentElement.style.setProperty('--color-primary-600', rgb);
                  document.documentElement.style.setProperty('--color-primary-900', rgb);
                }
              }
              if (primary) {
                const rgb = hexToRgb(primary);
                if (rgb) document.documentElement.style.setProperty('--color-bg-main', rgb);
              }
              if (tertiary) {
                const rgb = hexToRgb(tertiary);
                if (rgb) document.documentElement.style.setProperty('--color-text-main', rgb);
              }
            }
          }
        }
        
        await loadUsers();
      } catch (err) {
        console.error("Falha crítica no boot:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const pendingUsersCount = user?.role === 'admin' 
    ? usersList.filter(u => String(u.status || u.STATUS || '').toLowerCase().trim() === 'inativo').length 
    : 0;

  useEffect(() => {
    if (pendingUsersCount > lastPendingCount) {
      setShowPendingAlert(true);
    }
    setLastPendingCount(pendingUsersCount);
  }, [pendingUsersCount]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const interval = setInterval(async () => {
      try {
        const cloudUsers = await storageService.getUsers();
        if (cloudUsers.length > 0) {
          setUsersList(cloudUsers);
          localStorage.setItem('app_users', JSON.stringify(cloudUsers));
        }
      } catch (err) {
        console.warn("Erro de background na busca de novos operadores:", err);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const handleNavigate = (view: ViewType) => {
    if (user && user.role !== 'admin') {
      const allowed = user.allowedViews || [];
      const email = (user.email || user['E-MAIL'] || '').toLowerCase();
      const name = (user.name || user.USUÁRIO || '').toLowerCase();
      const isPortalDass = email.includes('portaldass') || name.includes('portaldass');
      
      const extraViews = allowed.filter(v => v !== 'dashboard');
      const hasNoAuthorizedModules = extraViews.length === 0;

      if (isPortalDass || hasNoAuthorizedModules) {
        setCurrentView('dashboard');
        return;
      } else if (view !== 'dashboard' && !allowed.includes(view)) {
        setCurrentView('dashboard');
        return;
      }
    }
    setCurrentView(view);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    loadUsers();
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const handleChangeColorTheme = (newTheme: string) => {
    setColorTheme(newTheme);
    localStorage.setItem('app_color_theme', newTheme);
  };

  if (isInitializing) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center ${theme === 'light' ? 'bg-slate-50' : 'bg-custom-main'} gap-4`}>
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin shadow-xl"></div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Iniciando Portal Logístico v3.2...</p>
      </div>
    );
  }

  if (!user) return <Auth onLogin={handleLogin} />;

  const renderContent = () => {
    let authorizedView = currentView;
    if (user && user.role !== 'admin') {
      const allowed = user.allowedViews || [];
      const email = (user.email || user['E-MAIL'] || '').toLowerCase();
      const name = (user.name || user.USUÁRIO || '').toLowerCase();
      const isPortalDass = email.includes('portaldass') || name.includes('portaldass');
      
      const extraViews = allowed.filter(v => v !== 'dashboard');
      const hasNoAuthorizedModules = extraViews.length === 0;

      if (isPortalDass || hasNoAuthorizedModules) {
        authorizedView = 'dashboard';
      } else if (currentView !== 'dashboard' && !allowed.includes(currentView)) {
        authorizedView = 'dashboard';
      }
    }

    switch (authorizedView) {
      case 'dashboard':
        return <Dashboard filters={filters} theme={theme} />;
      case 'chat':
        return <Chat />;
      case 'settings':
        return <Settings theme={theme} users={usersList} onRefreshUsers={loadUsers} />;
      case 'users':
        return <UserManagement users={usersList} onRefreshUsers={loadUsers} currentUser={user} theme={theme} />;
      case 'history':
        return <History theme={theme} />;
      case 'follow-up-pre':
        return <FollowUp filters={filters} isPreMode={true} theme={theme} />;
      case 'follow-up':
        return <FollowUp filters={filters} theme={theme} />;
      case 'gmail':
        return <GmailCenter theme={theme} />;
      default:
        return <Dashboard filters={filters} />;
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${colorTheme} text-custom-main bg-custom-main relative`}>
      {/* Subtle background tint based on primary color */}
      <div className="absolute inset-0 bg-primary-900/5 pointer-events-none z-0" />
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-900/10 to-transparent pointer-events-none z-0" />

      {globalError && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-rose-600 text-slate-900 dark:text-white px-8 py-4 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-4">
              <AlertCircle size={20} />
              <p className="text-[10px] font-black uppercase tracking-widest">{globalError}</p>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={() => { setGlobalError(null); loadUsers(); }} className="p-2 hover:bg-white/10 rounded-lg transition-all flex items-center gap-2 text-[8px] font-bold uppercase">
                <RefreshCw size={14} /> Tentar Novamente
             </button>
             <button onClick={() => setGlobalError(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X size={16} />
             </button>
           </div>
        </div>
      )}

      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        filters={filters} 
        onFilterChange={setFilters} 
        theme={theme} 
        onToggleTheme={handleToggleTheme}
        colorTheme={colorTheme}
        onChangeColorTheme={handleChangeColorTheme}
        onUserUpdate={handleUserUpdate}
        onOpenThemeSettings={() => setIsThemeSettingsOpen(true)}
        pendingUsersCount={pendingUsersCount}
      />
      {renderContent()}

      {/* Alerta flutuante de novo usuário para Administrador */}
      {user && user.role === 'admin' && pendingUsersCount > 0 && currentView !== 'users' && showPendingAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-[32px] border border-rose-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl shadow-rose-950/10 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 shrink-0">
              <ShieldAlert size={20} className="animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest italic">Acesso Pendente</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase leading-snug">
                Há {pendingUsersCount} {pendingUsersCount === 1 ? 'operador aguardando' : 'operadores aguardando'} liberação de acesso ao sistema.
              </p>
              <div className="flex items-center gap-2 pt-3">
                <button 
                  onClick={() => handleNavigate('users')} 
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 animate-pulse"
                >
                  Liberar Acesso
                </button>
                <button 
                  onClick={() => setShowPendingAlert(false)} 
                  className="px-3 py-2 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                >
                  Depois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ThemeSettings 
        isOpen={isThemeSettingsOpen}
        onClose={() => setIsThemeSettingsOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        colorTheme={colorTheme}
        onChangeColorTheme={handleChangeColorTheme}
      />
    </div>
  );
};

export default App;

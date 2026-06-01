
import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Mail, Lock, RotateCw, Layout, BarChart, History, Settings, Zap, MessageSquare, MapPin, AlignLeft, Briefcase, Edit3, Clock, Users, ToggleLeft, Upload } from 'lucide-react';
import { User, ViewType } from '../types';
import { storageService } from '../services/storageService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  editingUser?: User;
  theme: 'dark' | 'light';
  isSelfEdit?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, editingUser, theme, isSelfEdit = false }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    senha: '',
    role: 'user',
    status: 'ativo',
    allowedViews: ['dashboard'],
    bio: '',
    location: '',
    birthday: '',
    cargo: '',
    profileImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingUser) {
      // Fix: Normalização estrita do status para garantir compatibilidade com o tipo 'ativo' | 'inativo'
      const rawStatus = String(editingUser.status || editingUser.STATUS || '').toLowerCase().trim();
      const normalizedStatus: 'ativo' | 'inativo' = rawStatus === 'ativo' ? 'ativo' : 'inativo';

      setFormData({
        ...editingUser,
        name: editingUser.name || editingUser.USUÁRIO || '',
        email: editingUser.email || editingUser['E-MAIL'] || '',
        senha: editingUser.senha || editingUser.SENHA || '',
        status: normalizedStatus,
        allowedViews: editingUser.allowedViews || ['dashboard'],
        bio: editingUser.bio || editingUser.Bio || '',
        location: editingUser.location || editingUser.Location || '',
        birthday: editingUser.birthday || editingUser.Birthday || '',
        cargo: editingUser.cargo || editingUser.Cargo || '',
        profileImage: editingUser.profileImage || ''
      });
    } else {
      setFormData({
        name: '', email: '', senha: '', role: 'user', status: 'ativo',
        allowedViews: ['dashboard'], bio: '', location: '', birthday: '',
        cargo: '', profileImage: ''
      });
    }
    setError('');
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const id = editingUser?.id || editingUser?.ID || Math.random().toString(36).substring(2, 11);
    
    const viewMapping: Record<ViewType, string> = {
      dashboard: 'DASHBOARD',
      reports: 'RELATORIOS',
      history: 'HISTORICO',
      chat: 'CHAT EQUIPE',
      'follow-up-pre': 'FOLLOW-UP-PRE',
      'follow-up': 'FOLLOW-UP',
      settings: 'CONFIGURAÇÕES',
      users: 'USUARIOS',
      gmail: 'GMAIL'
    };

    const allowedViews = formData.allowedViews || ['dashboard'];
    const permsString = allowedViews.map(v => viewMapping[v]).join('; ');

    const payload = {
      ID: id,
      USUÁRIO: formData.name || '',
      "E-MAIL": formData.email || '',
      SENHA: formData.senha || '',
      PAPEL: formData.role === 'admin' ? 'Admin' : 'User',
      STATUS: formData.status || 'ativo',
      "Permissões de Tela (Módulos)": permsString,
      Bio: formData.bio || '',
      Location: formData.location || '',
      Birthday: formData.birthday || '',
      Cargo: formData.cargo || '',
      Img: formData.profileImage || ''
    };

    try {
      await storageService.saveUser(payload);
      onSave({
        ...formData,
        id,
        allowedViews,
        bio: formData.bio,
        location: formData.location,
        cargo: formData.cargo
      } as User);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar no banco de dados:", err);
      setError('Falha na sincronização com o banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert Google Drive URLs to direct image URLs
    if (name === 'profileImage' && value.includes('drive.google.com/file/d/')) {
      const match = value.match(/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        setFormData(prev => ({ ...prev, [name]: `https://lh3.googleusercontent.com/d/${match[1]}` }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError('');
      const url = await storageService.uploadFile(file);
      setFormData(prev => ({ ...prev, profileImage: url }));
    } catch (err) {
      console.error("Erro ao fazer upload da imagem:", err);
      setError('Falha ao enviar a imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleViewPermission = (view: ViewType) => {
    const current = formData.allowedViews || [];
    const updated = current.includes(view)
      ? current.filter(v => v !== view)
      : [...current, view];
    setFormData(prev => ({ ...prev, allowedViews: updated as ViewType[] }));
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-100 dark:bg-slate-800 w-full max-w-2xl rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-500 border border-primary-500/20">
                <Edit3 size={20} />
             </div>
             <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-custom-main">
                  {isSelfEdit ? 'Meu Perfil' : 'Configurar Operador'}
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">
                   {isSelfEdit ? 'Ajuste seus dados pessoais' : 'Sincronização Direta com Google Sheets'}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em] border-b border-slate-200 dark:border-slate-800 pb-2 italic">1. Identidade e Acesso</h3>
            
            <div className="space-y-4 mb-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserIcon size={12} /> Foto do Perfil</label>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.profileImage ? (
                    <img 
                      src={formData.profileImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.name || 'User') + '&background=random';
                      }}
                    />
                  ) : (
                    <UserIcon size={32} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <label className="relative flex items-center justify-center gap-2 w-full bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-primary-500 hover:text-primary-500 transition-all cursor-pointer group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <RotateCw size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} className="group-hover:-translate-y-1 transition-transform" />
                    )}
                    <span>{isUploading ? 'Enviando...' : 'Clique para enviar uma foto'}</span>
                  </label>
                  <input 
                    name="profileImage" 
                    value={formData.profileImage} 
                    onChange={handleChange} 
                    placeholder="Ou cole a URL da imagem aqui..." 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className={`grid ${isSelfEdit ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserIcon size={12} /> Nome de Exibição</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-custom-main focus:outline-none focus:border-primary-500 uppercase transition-all" />
              </div>
              
              {!isSelfEdit && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Lock size={12} /> Senha de Segurança</label>
                  <input required type="password" name="senha" value={formData.senha} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-custom-main focus:outline-none focus:border-primary-500 transition-all" />
                </div>
              )}
            </div>

            {!isSelfEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Mail size={12} /> E-mail Profissional</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-custom-main focus:outline-none focus:border-primary-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap size={12} /> Status da Conta</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-[10px] font-black text-custom-main focus:outline-none focus:border-primary-500 transition-all uppercase appearance-none">
                    <option value="ativo" className="bg-white dark:bg-slate-900">Ativo (Acesso Liberado)</option>
                    <option value="inativo" className="bg-white dark:bg-slate-900">Inativo (Acesso Bloqueado)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] border-b border-slate-200 dark:border-slate-800 pb-2 italic">2. Perfil Operacional</h3>
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><AlignLeft size={12} /> Biografia do Operador</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-custom-main focus:border-primary-500 outline-none transition-all resize-none" placeholder="Descrição da função e competências..." />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Hub / Localização</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-custom-main focus:outline-none focus:border-primary-500 uppercase transition-all" placeholder="Ex: ITB-BA" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Briefcase size={12} /> Cargo / Função</label>
                    <input name="cargo" value={formData.cargo} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-custom-main focus:outline-none focus:border-primary-500 uppercase transition-all" placeholder="Ex: ANALISTA FOLLOW-UP" />
                  </div>
               </div>
            </div>
          </div>

          {!isSelfEdit && (
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] border-b border-slate-200 dark:border-slate-800 pb-2 italic">3. Controle de Módulos Autorizados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={14} /> },
                  { id: 'reports', label: 'Relatórios', icon: <BarChart size={14} /> },
                  { id: 'history', label: 'Histórico', icon: <History size={14} /> },
                  { id: 'chat', label: 'Chat Equipe', icon: <MessageSquare size={14} /> },
                  { id: 'follow-up-pre', label: 'Follow-UP PRÉ', icon: <Clock size={14} /> },
                  { id: 'follow-up', label: 'Follow-UP', icon: <Zap size={14} /> },
                  { id: 'users', label: 'Usuários', icon: <Users size={14} /> },
                  { id: 'settings', label: 'Config', icon: <Settings size={14} /> },
                  { id: 'gmail', label: 'Gmail', icon: <Mail size={14} /> },
                ].map(view => {
                  const isActive = formData.allowedViews?.includes(view.id as ViewType);
                  return (
                    <button 
                      key={view.id} 
                      type="button" 
                      onClick={() => toggleViewPermission(view.id as ViewType)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                        isActive 
                          ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-600/20' 
                          : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 opacity-60'
                      }`}
                    >
                      {view.icon} {view.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-6 flex flex-col md:flex-row gap-4 border-t border-slate-200 dark:border-slate-800">
             <button type="button" onClick={onClose} className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 dark:text-white transition-all">Cancelar</button>
             <button 
              type="submit" 
              disabled={loading} 
              className="flex-[2] py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white bg-primary-600 rounded-[24px] hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
             >
               {loading ? <RotateCw className="animate-spin" size={20} /> : <Save size={20} />} 
               {loading ? 'Sincronizando Banco...' : 'Confirmar Sincronização'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;

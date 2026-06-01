import React, { useState } from 'react';
import { X, Moon, Sun, Palette, Check, Plus, Search, Home, User, Edit2, Layers, Tag, Trash2, Eye, Layout, Package, BarChart3 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import VisualDashboard from './VisualDashboard';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  colorTheme: string;
  onChangeColorTheme: (theme: string) => void;
}

const THEME_COLORS: Record<string, { primary: string, secondary: string, neutral: string }> = {
  'theme-blue': { primary: '#3b82f6', secondary: '#1e293b', neutral: '#64748b' },
  'theme-teal': { primary: '#14b8a6', secondary: '#0f172a', neutral: '#64748b' },
  'theme-emerald': { primary: '#10b981', secondary: '#064e3b', neutral: '#64748b' },
  'theme-violet': { primary: '#8b5cf6', secondary: '#4c1d95', neutral: '#64748b' },
  'theme-rose': { primary: '#f43f5e', secondary: '#881337', neutral: '#64748b' },
  'theme-amber': { primary: '#f59e0b', secondary: '#78350f', neutral: '#64748b' },
  'theme-ocean': { primary: '#06b6d4', secondary: '#164e63', neutral: '#64748b' },
  'theme-sunset': { primary: '#f97316', secondary: '#7c2d12', neutral: '#64748b' },
  'theme-forest': { primary: '#10b981', secondary: '#134e4a', neutral: '#64748b' },
  'theme-nebula': { primary: '#d946ef', secondary: '#701a75', neutral: '#64748b' },
  'theme-midnight': { primary: '#6366f1', secondary: '#312e81', neutral: '#64748b' },
  'theme-dass': { primary: '#e21b22', secondary: '#050a14', neutral: '#64748b' },
  'theme-industrial': { primary: '#3b82f6', secondary: '#040a16', neutral: '#64748b' },
};

const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  isOpen, onClose, theme, onToggleTheme, colorTheme, onChangeColorTheme
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customPrimary, setCustomPrimary] = useState(() => localStorage.getItem('customPrimary') || '#0b1221');
  const [customSecondary, setCustomSecondary] = useState(() => localStorage.getItem('customSecondary') || '#3b82f6');
  const [customTertiary, setCustomTertiary] = useState(() => localStorage.getItem('customTertiary') || '#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!isOpen) return null;

  const currentColors = colorTheme === 'theme-custom' 
    ? { primary: customSecondary, secondary: customPrimary, tertiary: customTertiary, neutral: '#64748b' }
    : { ...(THEME_COLORS[colorTheme] || { 
        primary: '#3b82f6', 
        secondary: theme === 'dark' ? '#1e293b' : '#f1f5f9', 
        neutral: '#64748b' 
      }), tertiary: '#ffffff' };

  const applyCustomColor = () => {
    // Update the CSS variables dynamically for the custom theme
    const rgbSecondary = hexToRgb(customSecondary);
    const rgbPrimary = hexToRgb(customPrimary);
    const rgbTertiary = hexToRgb(customTertiary);
    
    // Save to localStorage
    localStorage.setItem('customPrimary', customPrimary);
    localStorage.setItem('customSecondary', customSecondary);
    localStorage.setItem('customTertiary', customTertiary);
    
    // Secondary color maps to our system's primary (buttons/icons)
    document.documentElement.style.setProperty('--color-primary-400', rgbSecondary);
    document.documentElement.style.setProperty('--color-primary-500', rgbSecondary);
    document.documentElement.style.setProperty('--color-primary-600', rgbSecondary);
    document.documentElement.style.setProperty('--color-primary-900', rgbSecondary);
    
    // Primary color maps to our system's background
    document.documentElement.style.setProperty('--color-bg-main', rgbPrimary);

    // Tertiary color maps to our system's text
    document.documentElement.style.setProperty('--color-text-main', rgbTertiary);
    
    onChangeColorTheme('theme-custom');
    setShowColorPicker(false);
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
  };

  const colorThemes = [
    { id: 'theme-teal', color: 'bg-teal-500', name: 'Teal' },
    { id: 'theme-emerald', color: 'bg-emerald-500', name: 'Emerald' },
    { id: 'theme-blue', color: 'bg-primary-600', name: 'Blue' },
    { id: 'theme-violet', color: 'bg-violet-600', name: 'Violet' },
    { id: 'theme-rose', color: 'bg-rose-600', name: 'Rose' },
    { id: 'theme-amber', color: 'bg-amber-500', name: 'Amber' },
    { id: 'theme-ocean', color: 'bg-gradient-to-r from-primary-600 to-cyan-500', name: 'Ocean' },
    { id: 'theme-sunset', color: 'bg-gradient-to-r from-rose-600 to-amber-500', name: 'Sunset' },
    { id: 'theme-forest', color: 'bg-gradient-to-r from-emerald-600 to-teal-500', name: 'Forest' },
    { id: 'theme-nebula', color: 'bg-gradient-to-r from-violet-600 to-pink-600', name: 'Nebula' },
    { id: 'theme-midnight', color: 'bg-gradient-to-r from-slate-700 to-indigo-600', name: 'Midnight' },
    { id: 'theme-industrial', color: 'bg-[#050a14]', name: 'Industrial' },
    { id: 'theme-dass', color: 'bg-[#e21b22]', name: 'Grupo Dass' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-[340px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/5 z-[101] shadow-2xl p-8 flex flex-col gap-10 animate-in slide-in-from-right duration-300 overflow-y-auto custom-scrollbar`}>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white">
            <Palette size={20} className="text-primary-500" />
            <h2 className="text-sm font-black uppercase tracking-widest">Aparência</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white/5 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modo de Exibição</p>
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
            <button 
              onClick={() => theme !== 'dark' && onToggleTheme()}
              className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-primary-500/50 shadow-[inset_0_0_15px_rgba(var(--color-primary-500),0.15)]' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
            >
              <Moon size={16} className={theme === 'dark' ? 'text-primary-400' : ''} /> Dark
            </button>
            <button 
              onClick={() => theme !== 'light' && onToggleTheme()}
              className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-xs font-bold transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-primary-500/50 shadow-[inset_0_0_15px_rgba(var(--color-primary-500),0.15)]' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
            >
              <Sun size={16} className={theme === 'light' ? 'text-primary-500' : ''} /> Light
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cor Principal</p>
          <div className="grid grid-cols-4 gap-3">
            {colorThemes.map(t => (
              <button
                key={t.id}
                onClick={() => onChangeColorTheme(t.id)}
                className={`w-full aspect-square rounded-2xl ${t.color} flex items-center justify-center transition-all relative group ${colorTheme === t.id ? 'ring-2 ring-primary-500 ring-offset-4 ring-offset-[#0b1221] scale-105 shadow-lg shadow-primary-500/20' : 'opacity-70 hover:opacity-100 hover:scale-105 hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-[#0b1221]'}`}
                title={t.name}
              >
                {colorTheme === t.id && <Check size={18} className="text-slate-900 dark:text-white drop-shadow-md" />}
              </button>
            ))}
            <div
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full aspect-square rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:bg-white/5 hover:border-white/20 group relative cursor-pointer"
              title="Nova Cor"
            >
              <Plus size={16} className="text-slate-500 group-hover:text-slate-900 dark:text-white transition-colors" />
              <span className="text-[8px] font-bold uppercase text-slate-500 group-hover:text-slate-900 dark:text-white transition-colors">Nova</span>
              
              {showColorPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 w-48" onClick={e => e.stopPropagation()}>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Primary (Fundo)</p>
                    <input 
                      type="color" 
                      value={customPrimary} 
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Secondary (Botões)</p>
                    <input 
                      type="color" 
                      value={customSecondary} 
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Terciária (Fontes)</p>
                    <input 
                      type="color" 
                      value={customTertiary} 
                      onChange={(e) => setCustomTertiary(e.target.value)}
                      className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none"
                    />
                  </div>
                  <button 
                    onClick={applyCustomColor}
                    className="w-full py-3 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                  >
                    Confirmar Alteração
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 pb-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visualização do Tema</p>
            <button 
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-all group px-3 py-1.5 bg-primary-500/10 rounded-full border border-primary-500/20"
            >
              <Eye size={12} className="group-hover:scale-110 transition-transform" /> FULL PREVIEW
            </button>
          </div>
          
          <div className="bg-custom-main rounded-[32px] border border-slate-200 dark:border-white/5 p-5 overflow-hidden space-y-5 shadow-inner">
            {/* Color Palette Preview */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                  <span>Primary</span>
                  <span className="font-mono text-[8px]">{currentColors.primary}</span>
                </div>
                <div 
                  className={`h-12 w-full rounded-2xl border border-white/10 flex flex-col justify-end p-1.5 shadow-lg transition-all duration-500 ${colorTheme !== 'theme-custom' ? 'bg-primary-500 shadow-primary-500/20' : ''}`}
                  style={{ backgroundColor: colorTheme === 'theme-custom' ? customSecondary : undefined }}
                >
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-1.5 flex-1 bg-white rounded-full" style={{ opacity: i * 0.1 }} />)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                  <span>Secondary</span>
                  <span className="font-mono text-[8px]">{currentColors.secondary}</span>
                </div>
                <div 
                  className="h-12 w-full rounded-2xl border border-white/10 flex flex-col justify-end p-1.5 transition-all duration-500"
                  style={{ backgroundColor: currentColors.secondary }}
                >
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-1.5 flex-1 bg-white rounded-full" style={{ opacity: i * 0.1 }} />)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                  <span>Neutral</span>
                  <span className="font-mono text-[8px]">{currentColors.neutral}</span>
                </div>
                <div 
                  className="h-12 w-full rounded-2xl border border-white/10 flex flex-col justify-end p-1.5 transition-all duration-500"
                  style={{ backgroundColor: currentColors.neutral }}
                >
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-1.5 flex-1 bg-white rounded-full" style={{ opacity: i * 0.1 }} />)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                  <span>Tertiary</span>
                  <span className="font-mono text-[8px]">{currentColors.tertiary}</span>
                </div>
                <div 
                  className="h-12 w-full rounded-2xl border border-white/10 flex flex-col justify-end p-1.5 transition-all duration-500"
                  style={{ backgroundColor: currentColors.tertiary }}
                >
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-1.5 flex-1 bg-white rounded-full" style={{ opacity: i * 0.1 }} />)}
                  </div>
                </div>
              </div>
            </div>

            {/* Typography & Elements Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center gap-2 shadow-sm">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 self-start">Headline</span>
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Aa</span>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center gap-2.5 shadow-sm">
                <div className="flex gap-2 w-full">
                  <div className="h-7 flex-1 bg-primary-500 rounded-xl flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-white shadow-sm shadow-primary-500/20">Primary</div>
                  <div className="h-7 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-slate-500">Secondary</div>
                </div>
                <div className="flex gap-2 w-full">
                  <div className="h-7 flex-1 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-white">Inverted</div>
                  <div className="h-7 flex-1 border border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-slate-500">Outlined</div>
                </div>
              </div>
            </div>

            {/* Search & Nav Preview */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex items-center gap-4 shadow-sm">
                <Search size={16} className="text-primary-500" />
                <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex items-center justify-around shadow-sm">
                <div className="p-2 bg-primary-500 rounded-xl text-white shadow-lg shadow-primary-500/20"><Home size={16} /></div>
                <Search size={16} className="text-slate-400 hover:text-primary-500 transition-colors cursor-pointer" />
                <User size={16} className="text-slate-400 hover:text-primary-500 transition-colors cursor-pointer" />
              </div>
            </div>

            {/* Status Badge Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-white/5 flex flex-col gap-3 shadow-sm">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status Badges</span>
              <div className="flex flex-col gap-2">
                <StatusBadge status="EM TRÂNSITO" />
                <StatusBadge status="ENTREGUE" />
              </div>
            </div>

            {/* Action Buttons Preview */}
            <div className="flex items-center justify-center gap-3">
              <div className="p-2.5 bg-slate-900 dark:bg-slate-800 rounded-xl text-white hover:scale-110 transition-transform cursor-pointer shadow-md"><Edit2 size={14} /></div>
              <div className="p-2.5 bg-primary-500 rounded-xl text-white hover:scale-110 transition-transform cursor-pointer shadow-lg shadow-primary-500/20"><Layers size={14} /></div>
              <div className="p-2.5 bg-amber-500 rounded-xl text-white hover:scale-110 transition-transform cursor-pointer shadow-md"><Tag size={14} /></div>
              <div className="p-2.5 bg-rose-600 rounded-xl text-white hover:scale-110 transition-transform cursor-pointer shadow-md"><Trash2 size={14} /></div>
            </div>
          </div>
        </div>

      </div>

      {/* Full Preview Modal */}
      {isPreviewOpen && (
        <VisualDashboard isModal onClose={() => setIsPreviewOpen(false)} />
      )}
    </>
  );
};

export default ThemeSettings;

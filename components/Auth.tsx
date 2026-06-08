import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Lock, Mail, ChevronRight, AlertCircle, 
  Loader2, User as UserIcon, Briefcase, ArrowLeft, CheckCircle2 
} from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ error: '', success: '' });
  
  const [form, setForm] = useState({ email: '', password: '', name: '', cargo: '' });
  const [particles, setParticles] = useState<Array<any>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 5 + 3,
      opacity: Math.random() * 0.4 + 0.2
    }));
    setParticles(newParticles);
  }, []);

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const fillDemoAccess = () => {
    setForm({
      email: 'Portaldass@grupodass.com',
      password: '123456',
      name: '',
      cargo: ''
    });
    setStatusMsg({ error: '', success: 'DADOS DEMONSTRATIVOS APLICADOS!' });
    setTimeout(() => setStatusMsg({ error: '', success: '' }), 2000);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg({ error: '', success: '' });
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Lógica de Registro
        const payload = {
          ID: Math.random().toString(36).substring(2, 11),
          USUÁRIO: form.name.trim().toUpperCase(),
          "E-MAIL": form.email.trim().toLowerCase(),
          SENHA: form.password,
          PAPEL: 'User',
          STATUS: 'ativo',
          Cargo: form.cargo.trim().toUpperCase(),
        };

        await storageService.saveUser(payload);
        setStatusMsg({ error: '', success: 'CADASTRO REALIZADO! VOLTANDO AO LOGIN...' });
        setTimeout(() => setIsRegistering(false), 2000);

      } else {
        // Lógica de Login CORRIGIDA
        const users = await storageService.getUsers();
        
        const foundUser = users.find(u => {
          // Busca flexível: tenta encontrar o email em qualquer variação de nome de coluna
          const uEmail = (u["E-MAIL"] || u.email || (u as any)["Email"] || '').toString().toLowerCase().trim();
          const uPass = (u.SENHA || u.senha || (u as any)["Senha"] || '').toString().trim();
          
          return uEmail === form.email.trim().toLowerCase() && uPass === form.password.trim();
        });

        if (foundUser) {
          const status = (foundUser.STATUS || foundUser.status || '').toString().toLowerCase().trim();
          if (status !== 'ativo') {
            setStatusMsg({ error: 'ACESSO NEGADO: USUÁRIO INATIVO OU PENDENTE', success: '' });
          } else {
            onLogin(foundUser);
          }
        } else {
          // Fallback para o acesso demonstrativo manual (mesmo se a planilha falhar)
          if (form.email.toLowerCase() === 'portaldass@grupodass.com' && form.password === '123456') {
             onLogin({
               id: 'DEMO', name: 'PORTALDASS', email: form.email,
               role: 'user', status: 'ativo', allowedViews: [], cargo: 'OPERADOR LOGÍSTICO'
             });
          } else {
            setStatusMsg({ error: 'E-MAIL OU SENHA INCORRETOS', success: '' });
          }
        }
      }
    } catch (err) {
      console.error("Erro no Auth:", err);
      setStatusMsg({ error: 'FALHA DE COMUNICAÇÃO COM A PLANILHA', success: '' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-custom-main flex flex-col items-center justify-center p-6 select-none relative overflow-hidden font-sans text-custom-main">
      
      <div className="particles-container opacity-40">
        {particles.map(p => (
          <div key={p.id} className="particle" style={{
            left: p.left, top: p.top, width: `${p.size}px`, height: `${p.size}px`,
            animationDuration: `${p.duration}s`, opacity: p.opacity
          }} />
        ))}
      </div>

      <div className="flex flex-col items-center mb-10 text-center relative z-10 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-slate-900 border border-white/10 rounded-[28px] flex items-center justify-center mb-6 shadow-2xl">
          <Shield size={40} className="text-white" strokeWidth={1.2} />
        </div>
        <h1 className="text-3xl md:text-[42px] font-black italic text-custom-main leading-tight uppercase tracking-tighter mb-2">
          PORTAL LOGÍSTICA<br/><span className="bg-gradient-to-r from-white via-slate-400 to-slate-600 bg-clip-text text-transparent">FOLLOW-UP DASS-ITB</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.6em]">
          Enterprise Cloud Sync V3.2
        </p>
      </div>

      <div 
        key={isRegistering ? 'reg' : 'log'}
        className="w-full max-w-md bg-slate-900/30 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 shadow-2xl relative z-10 border border-white/5 slide-in-right"
      >
        <form onSubmit={handleAuthAction} className="space-y-6">
          <header className="flex items-center justify-between border-b border-white/5 pb-6 mb-2">
            <h2 className="text-custom-main text-base font-black uppercase italic tracking-widest">
              {isRegistering ? 'Solicitar Acesso' : 'Acesso Restrito'}
            </h2>
            {isRegistering && (
              <button type="button" onClick={() => setIsRegistering(false)} className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase transition-all">
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
          </header>

          {(statusMsg.error || statusMsg.success) && (
            <div className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in zoom-in-95 ${
              statusMsg.error ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
            }`}>
              {statusMsg.error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{statusMsg.error || statusMsg.success}</span>
            </div>
          )}

          <div className="space-y-5">
            {isRegistering && (
              <InputGroup label="Nome Operador" icon={<UserIcon size={18}/>} placeholder="NOME COMPLETO" value={form.name} onChange={(v: string) => updateField('name', v)} />
            )}

            <InputGroup label="E-mail Corporativo" type="email" icon={<Mail size={18}/>} placeholder="SEU@EMPRESA.COM" value={form.email} onChange={(v: string) => updateField('email', v)} />

            <InputGroup label="Senha" type="password" icon={<Lock size={18}/>} placeholder="••••••••" value={form.password} onChange={(v: string) => updateField('password', v)} />

            {isRegistering && (
              <InputGroup label="Cargo / Setor" icon={<Briefcase size={18}/>} placeholder="EX: PCP / FOLLOW-UP" value={form.cargo} onChange={(v: string) => updateField('cargo', v)} />
            )}
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[12px] hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{isRegistering ? 'Efetivar Solicitação' : 'Entrar no Sistema'} <ChevronRight size={18}/></>}
            </button>
          </div>

          {!isRegistering && (
            <div className="pt-2 space-y-5 text-center">
              <button 
                type="button" 
                onClick={() => { setIsRegistering(true); setStatusMsg({ error: '', success: '' }); }}
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white"
              >
                Ainda não possui conta? <span className="text-link-white ml-1 underline underline-offset-4">Cadastrar agora</span>
              </button>

              <button 
                type="button"
                onClick={fillDemoAccess}
                className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 group transition-all hover:border-white/20 hover:bg-white/[0.08]"
              >
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 group-hover:text-white">
                   Acesso Demonstrativo (Clique para Preencher)
                </p>
                <code className="text-[11px] text-slate-400 block font-mono">
                  Portaldass@grupodass.com | 123456
                </code>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, placeholder, value, type = "text", onChange }: any) => (
  <div className="space-y-1.5 group">
    <label className="text-slate-500 text-[9px] font-black uppercase ml-2 tracking-widest group-focus-within:text-custom-main transition-colors">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-white transition-all">
        {icon}
      </div>
      <input 
        required
        type={type}
        value={value}
        className="w-full bg-black/40 neon-input-white rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-custom-main placeholder:text-slate-800 transition-all outline-none border border-white/5 focus:border-white/20"
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  </div>
);

export default Auth;
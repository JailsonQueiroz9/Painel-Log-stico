import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, Send, Inbox, FileText, RefreshCw, Search, Plus, 
  Trash2, AlertCircle, ExternalLink, Lock, CheckCircle, 
  FileCheck2, ChevronRight, X, Sparkles, Loader2, Key, Info,
  CornerUpLeft, Reply
} from 'lucide-react';
import { storageService, SHEETS } from '../services/storageService';
import { AWBRecord } from '../types';
import EmailChipInput from './EmailChipInput';

interface GmailCenterProps {
  theme?: 'dark' | 'light';
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
}

const DEFAULT_CLIENT_ID = "1041920786961-oihb1vsc80qge2or948q43v5g6unb7ve.apps.googleusercontent.com";

export const GmailCenter: React.FC<GmailCenterProps> = ({ theme = 'light' }) => {
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  
  // Lists
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('subject:(AWB OR embarque OR Dass OR rastreamento)');
  const [selectedMsg, setSelectedMsg] = useState<GmailMessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Compose Form
  const [awbRecords, setAwbRecords] = useState<AWBRecord[]>([]);
  const [preRecords, setPreRecords] = useState<AWBRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedAwbForTemplate, setSelectedAwbForTemplate] = useState<string>('');
  
  const [composeForm, setComposeForm] = useState({
    to: [] as string[],
    cc: [] as string[],
    bcc: [] as string[],
    subject: '',
    body: '',
    addAwbDetails: true
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ error: '', success: '' });
  
  // User Profile
  const [userProfile, setUserProfile] = useState<{ email: string; name: string; picture?: string } | null>(null);

  // Initialize and load tokens
  useEffect(() => {
    const savedToken = localStorage.getItem('google_gmail_token');
    const savedClientId = localStorage.getItem('google_gmail_client_id') || DEFAULT_CLIENT_ID;
    
    setGoogleClientId(savedClientId);
    if (savedToken) {
      setGmailToken(savedToken);
    }

    // Check location hash for returned token from OAuth Redirect
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        setGmailToken(accessToken);
        localStorage.setItem('google_gmail_token', accessToken);
        // Clear hash gracefully
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Sync / check profile when token is changed
  useEffect(() => {
    if (gmailToken) {
      fetchUserProfile(gmailToken);
      fetchMessages(gmailToken, searchQuery, activeTab);
    } else {
      setUserProfile(null);
      setMessages([]);
    }
  }, [gmailToken, activeTab]);

  // Handle auto loading AWB records for drafting
  useEffect(() => {
    if (activeTab === 'compose') {
      loadShipmentRecords();
    }
  }, [activeTab]);

  const loadShipmentRecords = async () => {
    setLoadingRecords(true);
    try {
      const [awbList, preList] = await Promise.all([
        storageService.getRecords(SHEETS.AWB),
        storageService.getRecords(SHEETS.PRE)
      ]);
      setAwbRecords(awbList || []);
      setPreRecords(preList || []);
    } catch (e) {
      console.error("Erro ao carregar registros de embarque:", e);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile({
          email: data.email,
          name: data.name,
          picture: data.picture
        });
      } else {
        // Token expired or invalid
        handleLogout();
      }
    } catch (e) {
      console.error("Erro ao ler perfil do Google OAuth:", e);
    }
  };

  const fetchMessages = async (token: string, query: string, folder: 'inbox' | 'sent' | 'compose') => {
    if (!token) return;
    setLoadingMessages(true);
    setFetchError(null);
    try {
      const q = folder === 'sent' 
        ? `${query} from:me` 
        : query;
        
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        let errorMessage = `Falha ao listar mensagens`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) {
            errorMessage = `${errData.error.message} (${res.status})`;
          }
        } catch (_) {}
        
        if (res.status === 401) {
          handleLogout();
          alert(`Sua sessão expirou ou o token é inválido: ${errorMessage}. Por favor, faça login novamente.`);
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        // Fetch headers for each message details asynchronously
        const list = await Promise.all(
          data.messages.slice(0, 15).map(async (m: { id: string }) => {
            try {
              const itemRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=minimal`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (itemRes.ok) {
                const item = await itemRes.json();
                return item;
              }
            } catch (e) {
              console.error(e);
            }
            return { id: m.id, snippet: "Sem prévia disponível" };
          })
        );
        setMessages(list.filter(Boolean));
      } else {
        setMessages([]);
      }
    } catch (e: any) {
      console.error(e);
      setFetchError(e.message || 'Falha ao listar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchMessageDetail = async (id: string) => {
    if (!gmailToken) return;
    setLoadingDetail(true);
    setSelectedMsg(null);
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
        headers: { Authorization: `Bearer ${gmailToken}` }
      });
      if (!res.ok) throw new Error("Erro ao abrir e-mail");
      
      const data = await res.json();
      const headers = data.payload.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      
      // Parse multi-part body or standard body
      let bodyText = "";
      if (data.payload.body?.data) {
        bodyText = decodeURIComponent(escape(atob(data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))));
      } else if (data.payload.parts) {
        // Try looking for HTML part
        const htmlPart = data.payload.parts.find((p: any) => p.mimeType === 'text/html');
        const textPart = data.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        const targetPart = htmlPart || textPart || data.payload.parts[0];
        
        if (targetPart && targetPart.body?.data) {
          bodyText = decodeURIComponent(escape(atob(targetPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))));
        } else if (targetPart && targetPart.parts) {
          const subPart = targetPart.parts.find((p: any) => p.mimeType === 'text/html') || targetPart.parts[0];
          if (subPart && subPart.body?.data) {
            bodyText = decodeURIComponent(escape(atob(subPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))));
          }
        }
      }

      setSelectedMsg({
        id: data.id,
        threadId: data.threadId,
        snippet: data.snippet,
        subject: getHeader('subject') || "(Sem Assunto)",
        from: getHeader('from'),
        to: getHeader('to'),
        date: getHeader('date'),
        body: bodyText || data.snippet
      });
    } catch (e) {
      console.error("Erro:", e);
      alert("Não foi possível carregar a mensagem completa.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleLogout = () => {
    setGmailToken(null);
    localStorage.removeItem('google_gmail_token');
    setUserProfile(null);
  };

  const handleApplyAwbTemplate = (idString: string) => {
    setSelectedAwbForTemplate(idString);
    if (!idString) return;
    
    const [sheet, id] = idString.split('::');
    const records = sheet === 'AWB' ? awbRecords : preRecords;
    const item = records.find(r => r.id === id);
    
    if (!item) return;

    const awbNumber = item.AWB || item.awbNumber || "N/A";
    const status = item.Status || item.status || "Pendente";
    const fornecedor = item.Fornecedor || item.fornecedor || "N/A";
    const marca = item.Marca || item.marca || "N/A";
    const obs = item.Observação || item.observacao || "Acompanhamento operacional regular em trânsito.";
    
    const trackingLink = "https://aereodasspcpfollow.netlify.app/";
    const titleText = `Follow-UP de Embarque - AWB: ${awbNumber}`;

    // Compile beautiful e-mail template HTML
    const emailHtmlBody = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#1e293b; max-width:600px; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; margin:0 auto; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
        <div style="background-color:#e21b22; padding:28px 32px; color:white;">
          <h2 style="margin:0; font-size:20px; font-weight:800; text-transform:uppercase; letter-spacing:1px; font-family:'Segoe UI',sans-serif;">Relatório de Rastreamento</h2>
          <p style="margin:4px 0 0 0; font-size:10px; opacity:0.85; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">GRUPO DASS • LOGÍSTICA & PCP</p>
        </div>
        <div style="padding:32px; background-color:#ffffff;">
          <p style="font-size:14px; line-height:1.6; color:#475569; margin:0 0 24px 0;">Olá, segue o status atualizado do embarque para acompanhamento logístico.</p>
          
          <table style="width:100%; border-collapse:collapse; margin-bottom:28px;">
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; width:140px;">Número AWB</td>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:800; color:#e21b22; font-family:monospace; font-size:15px;">${awbNumber}</td>
            </tr>
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">Fornecedor</td>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:600; font-size:13px; color:#0f172a;">${fornecedor}</td>
            </tr>
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">Marca / Canal</td>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:600; text-transform:uppercase; font-size:13px; color:#0f172a;">${marca}</td>
            </tr>
            <tr>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">Status Atual</td>
              <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:900; font-size:13px; color:#16a34a;">${status}</td>
            </tr>
          </table>
          
          <div style="background-color:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:28px;">
            <h4 style="margin:0 0 10px 0; font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:1px; font-weight:800;">Histórico do Follow-Up</h4>
            <p style="margin:0; font-size:13px; line-height:1.6; color:#334155; white-space:pre-wrap;">${obs}</p>
          </div>

          <div style="text-align:center; margin-top:12px;">
            <a href="${trackingLink}" style="display:inline-block; background-color:#e21b22; color:#ffffff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:1px; box-shadow:0 4px 10px rgba(226, 27, 34, 0.15);">Consultar Rastreio Real-Time</a>
          </div>
        </div>
        <div style="padding:16px 32px; background-color:#f8fafc; text-align:center; border-top:1px solid #f1f5f9;">
          <p style="margin:0; font-size:9px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Este é um e-mail operacional de alta prioridade • Grupo Dass Logística</p>
        </div>
      </div>
    `;

    setComposeForm(prev => ({
      ...prev,
      subject: titleText,
      body: emailHtmlBody
    }));
  };

  const executeSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailToken) return;
    if (composeForm.to.length === 0) {
      setStatusMsg({ error: "Insira ao menos um destinatário (Para)", success: "" });
      return;
    }

    setSendingEmail(true);
    setStatusMsg({ error: '', success: '' });

    try {
      // Create MIME base64 message standard
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(composeForm.subject)))}?=`;
      let mimeString = '';
      mimeString += `To: ${composeForm.to.join(', ')}\r\n`;
      if (composeForm.cc.length > 0) mimeString += `Cc: ${composeForm.cc.join(', ')}\r\n`;
      if (composeForm.bcc.length > 0) mimeString += `Bcc: ${composeForm.bcc.join(', ')}\r\n`;
      mimeString += `Subject: ${utf8Subject}\r\n`;
      mimeString += `MIME-Version: 1.0\r\n`;
      if (composeForm.body.trim().startsWith('<')) {
        mimeString += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
      } else {
        mimeString += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
      }
      mimeString += `${composeForm.body}\r\n`;

      const base64SafeMime = btoa(unescape(encodeURIComponent(mimeString)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64SafeMime })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error?.message || "Ocorreu um erro no servidor do Gmail");
      }

      setStatusMsg({ error: '', success: 'E-MAIL ENVIADO COM SUCESSO A PARTIR DA SUA CONTA OPERACIONAL!' });
      
      // Reset compose form
      setComposeForm({
        to: [],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        addAwbDetails: true
      });
      setSelectedAwbForTemplate('');

      // Refresh sent items
      setTimeout(() => {
        setStatusMsg({ error: '', success: '' });
        setActiveTab('sent');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setStatusMsg({ error: `Erro ao enviar e-mail: ${err.message || err}`, success: '' });
    } finally {
      setSendingEmail(false);
    }
  };

  const startOAuthFlow = () => {
    const DISCO_CLIENT_ID = googleClientId || DEFAULT_CLIENT_ID;
    const REDIRECT_URI = window.location.origin + window.location.pathname;
    
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${DISCO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(scopes.join(' '))}`;
    
    window.open(AUTH_URL, 'Google OAuth Gmail', 'width=650,height=650');
    alert("Iniciando fluxo de login do Google Workspace. Se a janela de login não abrir ou disser 'bloqueado', por favor certifique-se de que o seu navegador permite popups.");
  };

  const getSubjectHeader = (payload: any) => {
    if (!payload || !payload.headers) return "(Sem Assunto)";
    const h = payload.headers.find((header: any) => header.name.toLowerCase() === 'subject');
    return h ? h.value : "(Sem Assunto)";
  };

  const getFromHeader = (payload: any) => {
    if (!payload || !payload.headers) return "Desconhecido";
    const h = payload.headers.find((header: any) => header.name.toLowerCase() === 'from');
    return h ? h.value : "Desconhecido";
  };

  const getDateHeader = (payload: any) => {
    if (!payload || !payload.headers) return "";
    const h = payload.headers.find((header: any) => header.name.toLowerCase() === 'date');
    return h ? h.value : "";
  };

  // Login form fallback input for token
  const [tokenInput, setTokenInput] = useState('');

  if (!gmailToken) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/20 overflow-y-auto">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#e21b22]" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#e21b22]/10 rounded-2xl flex items-center justify-center text-[#e21b22]">
                <Mail size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#e21b22] uppercase">MÓDULO DE INTEGRAÇÃO</span>
                <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">CENTRAL GMAIL CORPORATIVO</h1>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase">
              Para despachar relatórios de rastreamento AWB instantâneos, responder dúvidas de fornecedores e consultar ordens de logística direto pelo seu Gmail corporativo, conecte sua conta Google no sistema.
            </p>

            {/* Custom Google Client ID Info card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <span className="text-[9px] font-black uppercase text-[#e21b22] tracking-widest block">PASSOS DE CONFIGURAÇÃO DE CREDENCIAIS</span>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Key size={12} /> Google Client ID</label>
                <input 
                  type="text"
                  value={googleClientId}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setGoogleClientId(val);
                    localStorage.setItem('google_gmail_client_id', val);
                  }}
                  placeholder="ID do cliente gerado no Google Cloud Console"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#e21b22]"
                />
              </div>

              <div className="bg-slate-100 dark:bg-black/40 p-3 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 text-[8px] font-bold text-slate-500 uppercase leading-relaxed">
                <span>URI DE REDIRECIONAMENTO AUTORIZADO NO CONSOLE:</span>
                <div className="flex gap-2">
                  <input 
                    readOnly
                    value={window.location.origin + window.location.pathname}
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-blue-500 dark:text-blue-400 text-[8px]"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + window.location.pathname);
                      alert("Copiado!");
                    }}
                    className="px-2 bg-slate-800 text-white rounded text-[8px]"
                  >
                    COPIAR
                  </button>
                </div>
              </div>

              {/* Proactive alert about OAuth error 401 */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                <span className="font-extrabold uppercase tracking-wider block text-amber-600 dark:text-amber-400">⚠️ ESTÁ VENDO O ERRO "invalid_client / 401"?</span>
                <p className="leading-relaxed">
                  O Google rejeita o login com erro <strong className="font-black">401: invalid_client</strong> se o ID do Cliente fornecido não for válido para esta URL do app ou se as políticas de TI do <strong className="font-bold">Grupo Dass</strong> bloquearem a criação automática de projetos de desenvolvedor no seu e-mail corporativo.
                </p>
                <div className="pt-1.5 space-y-1 font-bold text-[9px] uppercase leading-tight">
                  <p>1. Crie um projeto em um Google e-mail pessoal (@gmail.com) no Console do Google Cloud.</p>
                  <p>2. Vá em Tela de Consentimento OAuth, configure como externa e adicione o escopo do Gmail.</p>
                  <p>3. Gere um ID do cliente da Web adicionando a URI acima nas <strong className="text-[#e21b22]">URIs de redirecionamento autorizadas</strong>.</p>
                  <p>4. Cole o ID gerado no campo acima e tente a autorização novamente.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={startOAuthFlow}
              className="w-full h-14 bg-[#e21b22] hover:bg-[#c21218] transition-all text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-[#e21b22]/20 flex items-center justify-center gap-3"
            >
              <Mail size={18} /> AUTORIZAR COM CONTA GOOGLE
            </button>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">OU INSERIR ACCESS TOKEN MANUALMENTE</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <div className="flex gap-3">
              <input 
                type="password"
                placeholder="Insira seu Google Access Token manualmente..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 bg-white dark:bg-[#040a16] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#e21b22]"
              />
              <button 
                onClick={() => {
                  const cleaned = tokenInput.trim();
                  if (cleaned) {
                    setGmailToken(cleaned);
                    localStorage.setItem('google_gmail_token', cleaned);
                  }
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
              >
                SALVAR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950/20 text-custom-main">
      {/* Sidebar folders */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#050a14] flex flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#e21b22]/10 rounded-xl flex items-center justify-center text-[#e21b22]">
              <Mail size={18} />
            </div>
            <div className="leading-none">
              <span className="text-[9px] font-black text-[#e21b22] uppercase tracking-wider block">GMAIL CORPORATIVO</span>
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">LOGÍSTICA DASS</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setActiveTab('compose');
              setSelectedMsg(null);
            }}
            className="w-full py-3 px-4 bg-[#e21b22] hover:bg-[#c21218] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#e21b22]/10 flex items-center justify-center gap-2"
          >
            <Plus size={14} /> NOVO E-MAIL
          </button>

          <nav className="space-y-1">
            <button 
              onClick={() => { setActiveTab('inbox'); setSelectedMsg(null); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'inbox' ? 'bg-primary-500/10 text-primary-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500'}`}
            >
              <span className="flex items-center gap-3">
                <Inbox size={15} /> CAIXA DE ENTRADA
              </span>
            </button>

            <button 
              onClick={() => { setActiveTab('sent'); setSelectedMsg(null); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'sent' ? 'bg-primary-500/10 text-primary-500' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500'}`}
            >
              <span className="flex items-center gap-3">
                <Send size={15} /> ENVIADOS MEUS
              </span>
            </button>
          </nav>
        </div>

        {/* User Account Details */}
        {userProfile && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {userProfile.picture ? (
                <img src={userProfile.picture} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-white/20" />
              ) : (
                <div className="w-8 h-8 bg-slate-300 dark:bg-slate-700 text-xs font-bold rounded-full flex items-center justify-center uppercase">{userProfile.name.charAt(0)}</div>
              )}
              <div className="leading-tight overflow-hidden">
                <p className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase truncate text-ellipsis">{userProfile.name}</p>
                <p className="text-[7.5px] font-bold text-slate-400 lowercase truncate text-ellipsis" title={userProfile.email}>{userProfile.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-1.5 hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-lg transition-colors" title="Desconectar Gmail">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Main Mail Frame */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#030712]">
        
        {/* Mobile headers and control indicators */}
        <div className="md:hidden p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#050a14]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setActiveTab('inbox'); setSelectedMsg(null); }}
              className={`p-2 rounded-lg text-xs font-bold ${activeTab === 'inbox' ? 'bg-[#e21b22] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-white'}`}
            >
              Inbox
            </button>
            <button 
              onClick={() => { setActiveTab('sent'); setSelectedMsg(null); }}
              className={`p-2 rounded-lg text-xs font-bold ${activeTab === 'sent' ? 'bg-[#e21b22] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-white'}`}
            >
              Sent
            </button>
            <button 
              onClick={() => { setActiveTab('compose'); setSelectedMsg(null); }}
              className={`p-2 rounded-lg text-xs font-bold ${activeTab === 'compose' ? 'bg-[#e21b22] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-white'}`}
            >
              Compose
            </button>
          </div>
          {userProfile && (
            <button onClick={handleLogout} className="p-1.5 text-rose-500 bg-rose-500/10 rounded" title="Sair">
              Sair
            </button>
          )}
        </div>

        {/* Email Search, filters and Actions header */}
        {activeTab !== 'compose' && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#040810] flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                placeholder="Busca avançada: ex: subject:AWB..."
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchMessages(gmailToken, searchQuery, activeTab);
                  }
                }}
                className="w-full bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#e21b22]"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => fetchMessages(gmailToken, searchQuery, activeTab)}
                disabled={loadingMessages}
                className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-white select-none transition-all duration-300 disabled:opacity-50"
                title="Sincronizar Mensagens"
              >
                {loadingMessages ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* Split panel Content frame */}
        <div className="flex-1 flex min-h-0">
          
          {/* Email list / Compose list */}
          {activeTab === 'compose' ? (
            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#e21b22] flex items-center gap-2"><Sparkles size={14} /> NOVO DESPACHO OPERACIONAL PELO GMAIL</h2>
                <div className="flex gap-3">
                  <select 
                    value={selectedAwbForTemplate} 
                    onChange={(e) => handleApplyAwbTemplate(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase rounded-lg px-2 py-1.5 text-slate-800 dark:text-white"
                  >
                    <option value="">-- AUTO COMPILAR AWB --</option>
                    <optgroup label="Embarques AWB Activo">
                      {awbRecords.map(r => (
                        <option key={r.id} value={`AWB::${r.id}`}>AWB: {r.AWB || r.awbNumber || 'S/N'} ({r.Fornecedor || 'S/F'})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Embarques PRÉ Activo">
                      {preRecords.map(r => (
                        <option key={r.id} value={`PRE::${r.id}`}>PRÉ: {r.AWB || r.awbNumber || 'S/N'} ({r.Fornecedor || 'S/F'})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {statusMsg.success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle size={15} /> {statusMsg.success}
                </div>
              )}

              {statusMsg.error && (
                <div className="p-4 bg-rose-600/15 border border-rose-600/20 rounded-xl text-rose-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle size={15} /> {statusMsg.error}
                </div>
              )}

              <form onSubmit={executeSendEmail} className="space-y-4 text-xs font-bold">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block">PARA (Destinatários)</label>
                    <EmailChipInput 
                      emails={composeForm.to}
                      onChange={(emails) => setComposeForm(prev => ({ ...prev, to: emails }))}
                      placeholder="email@destino.com.br"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block">Cópia (CC)</label>
                    <EmailChipInput 
                      emails={composeForm.cc}
                      onChange={(emails) => setComposeForm(prev => ({ ...prev, cc: emails }))}
                      placeholder="copia@destino.com.br"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 block">Cópia Oculta (BCC)</label>
                  <EmailChipInput 
                    emails={composeForm.bcc}
                    onChange={(emails) => setComposeForm(prev => ({ ...prev, bcc: emails }))}
                    placeholder="copiaoculta@destino.com.br"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 block">Assunto do E-mail</label>
                  <input 
                    type="text"
                    required
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Digite o assunto relevante do follow-up..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 placeholder:text-slate-400 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 block">Corpo da Mensagem (HTML ou Texto)</label>
                    <span className="text-[8px] text-blue-500 uppercase font-black tracking-widest">{composeForm.body.startsWith('<') ? 'MODO HTML DETECTADO' : 'MODO TEXTO DETECTADO'}</span>
                  </div>
                  <textarea 
                    rows={12}
                    required
                    value={composeForm.body}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Digite seu e-mail corporativo ou carregue um template de AWB acima..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 placeholder:text-slate-400 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full py-4 bg-[#e21b22] hover:bg-[#c21218] text-white uppercase text-[10px] font-black tracking-widest rounded-xl shadow-xl shadow-[#e21b22]/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> ENVIANDO E-MAIL DE LOGÍSTICA...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> DESPACHAR E-MAIL VIA GMAIL
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Inbox lists view */}
              <div className={`flex-1 flex flex-col min-w-0 ${selectedMsg ? 'hidden lg:flex' : 'flex'}`}>
                {loadingMessages ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-slate-500">
                    <Loader2 size={24} className="animate-spin text-[#e21b22]" />
                    <span className="text-[9px] tracking-widest uppercase font-black">Consolidando e-mails corporativos...</span>
                  </div>
                ) : fetchError ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center max-w-md mx-auto overflow-y-auto">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
                      <AlertCircle size={24} />
                    </div>
                    <div className="space-y-1.5 leading-tight">
                      <span className="text-[9px] tracking-widest uppercase font-black text-rose-500 block">ERRO DE CONEXÃO AO GMAIL</span>
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">Falha ao se conectar com a API do Gmail</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed max-w-xs">{fetchError}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-[9px] text-left uppercase text-slate-500 leading-normal">
                      <p className="font-extrabold text-[#e21b22]">⚠️ CAUSA PROVÁVEL:</p>
                      <p>O token do Google dura apenas 1 hora. Se você usou o botão de login, ou colou o token há mais de uma hora, ele expirou.</p>
                      <p className="font-extrabold text-blue-500 pt-1">🔑 COMO CORRIGIR:</p>
                      <p>Sua organização (Grupo Dass) bloqueia redirecionamentos automáticos. Use uma janela pessoal do Google OAuth ou o Google OAuth Playground para gerar um novo token temporário do Gmail e cole-o no campo de token manual ao fazer login.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleLogout()}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                      >
                        Desconectar Conta
                      </button>
                      <button 
                        onClick={() => fetchMessages(gmailToken, searchQuery, activeTab)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <RefreshCw size={12} /> Tentar Novamente
                      </button>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-slate-500">
                    <Mail size={32} className="opacity-20" />
                    <span className="text-[9px] tracking-widest uppercase font-black text-slate-400">Nenhum e-mail de logística encontrado na consulta</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                    {messages.map((m) => {
                      const subject = getSubjectHeader(m);
                      const from = getFromHeader(m);
                      const date = getDateHeader(m);
                      const active = selectedMsg?.id === m.id;
                      
                      return (
                        <div 
                          key={m.id}
                          onClick={() => fetchMessageDetail(m.id)}
                          className={`p-4 cursor-pointer transition-all ${active ? 'bg-slate-100 dark:bg-slate-900/60 border-l-4 border-l-[#e21b22]' : 'hover:bg-slate-50 dark:hover:bg-slate-900/20'}`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-[10px] font-black truncate max-w-[150px] uppercase text-slate-800 dark:text-slate-200">{from.split('<')[0] || from}</span>
                            <span className="text-[8px] font-mono whitespace-nowrap text-slate-500">{new Date(date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <h4 className="text-xs font-black truncate text-slate-900 dark:text-white uppercase mb-1">{subject}</h4>
                          <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-relaxed">{m.snippet}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detail section */}
              <div className={`w-full lg:w-[480px] border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/15 flex flex-col overflow-hidden ${selectedMsg ? 'flex' : 'hidden lg:flex'}`}>
                {loadingDetail ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
                    <Loader2 size={24} className="animate-spin text-[#e21b22]" />
                    <span className="text-[9px] tracking-widest font-black uppercase">Consolidando e-mail corporativo...</span>
                  </div>
                ) : selectedMsg ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#050a14] flex items-center justify-between">
                      <button 
                        onClick={() => setSelectedMsg(null)}
                        className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-white"
                      >
                        <X size={16} /> Voltar
                      </button>
                      <h3 className="text-[10px] font-black uppercase text-[#e21b22] tracking-widest flex items-center gap-1.5"><Mail size={12} /> Detalhe de Comunicação</h3>
                      <button 
                        onClick={() => {
                          // Quick reply
                          setActiveTab('compose');
                          setComposeForm({
                            to: [selectedMsg.from.includes('<') ? selectedMsg.from.split('<')[1].replace('>', '') : selectedMsg.from],
                            cc: [],
                            bcc: [],
                            subject: `RE: ${selectedMsg.subject}`,
                            body: `\r\n\r\n--- Em ${selectedMsg.date}, ${selectedMsg.from} escreveu:\r\n> ${selectedMsg.snippet}`,
                            addAwbDetails: false
                          });
                          setSelectedMsg(null);
                        }}
                        className="p-1.5 bg-[#e21b22]/10 hover:bg-[#e21b22]/20 text-[#e21b22] dark:text-red-400 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                        title="Responder"
                      >
                        <CornerUpLeft size={12} /> Resposta
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white leading-snug">{selectedMsg.subject}</h2>
                        
                        <div className="p-4 bg-white dark:bg-[#050a14] border border-slate-100 dark:border-slate-900 rounded-xl space-y-2.5 text-[9.5px] font-bold uppercase">
                          <div className="flex justify-between">
                            <span className="text-slate-400">De:</span>
                            <span className="text-slate-800 dark:text-slate-200 truncate max-w-[250px]">{selectedMsg.from}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Para:</span>
                            <span className="text-slate-800 dark:text-slate-200 truncate max-w-[250px]">{selectedMsg.to}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Data:</span>
                            <span className="text-slate-800 dark:text-slate-200">{selectedMsg.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Render HTML content securely with iframe srcdoc */}
                      <div className="bg-white dark:bg-[#040810] border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
                        {selectedMsg.body.trim().startsWith('<') ? (
                          <iframe 
                            srcDoc={selectedMsg.body}
                            className="w-full h-96 p-4 border-none bg-white font-sans text-slate-900"
                            title="Visualização do E-mail"
                          />
                        ) : (
                          <div className="p-5 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                            {selectedMsg.body}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 gap-2.5 text-center">
                    <Mail size={32} className="opacity-10" />
                    <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">Selecione uma mensagem profissional para ler seu conteúdo completo</span>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default GmailCenter;

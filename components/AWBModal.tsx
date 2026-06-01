
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  X, Save, FileText, 
  Loader2, Mail, ChevronDown, Upload, Paperclip, Zap,
  Truck, Hash, Calendar, Box, Link as LinkIcon, Info, FileStack
} from 'lucide-react';
import { AWBRecord, AWBStatus } from '../types';
import { storageService, toInputDate, SHEETS } from '../services/storageService';
import EmailChipInput from './EmailChipInput';

// 1. Tipagem Estrita (Removendo o 'any')
interface AWBFormData {
  ID?: string;
  Fornecedor: string;
  Saída: string;
  "NF's": string;
  AWB: string;
  Status: AWBStatus;
  Chegada: string;
  Marca: string;
  Material: string;
  Observação: string;
  Rastreio: string;
  Documentos: string;
  send_email: boolean;
  email_to: string[];
  email_cc: string[];
  email_bcc: string[];
  email_body: string;
}

interface AWBModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRecord?: AWBRecord;
  isNFMode?: boolean; 
  theme?: 'dark' | 'light';
}

// 2. Valores Iniciais extraídos para fora do componente para evitar recriação
const INITIAL_FORM_DATA: AWBFormData = {
  Fornecedor: '', Saída: '', "NF's": '', AWB: '', Status: AWBStatus.EM_TRANSITO,
  Chegada: '', Marca: '', Material: '', Observação: '', Rastreio: '', Documentos: '',
  send_email: false, email_to: [], email_cc: [], email_bcc: [], email_body: ''
};

// 3. React.memo para evitar rerenders se o pai atualizar mas as props não mudarem
const AWBModal: React.FC<AWBModalProps> = memo(({ isOpen, onClose, onSave, editingRecord, isNFMode = false, theme = 'dark' }) => {
  const [formData, setFormData] = useState<AWBFormData>(INITIAL_FORM_DATA);
  
  const [loading, setLoading] = useState(false);
  const [showEmailSection, setShowEmailSection] = useState(false); 
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. useCallback para handlers de input (evita recriar funções a cada render)
  const handleInputChange = useCallback((field: keyof AWBFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    if (editingRecord) {
      const dataSaida = isNFMode 
        ? (editingRecord["Previsão Agend."] || editingRecord.Saída || editingRecord.saida)
        : (editingRecord.Saída || editingRecord.saida);
      
      const linkRef = isNFMode 
        ? (editingRecord["Link Agendamento"] || editingRecord.Rastreio || editingRecord.rastreio)
        : (editingRecord.Rastreio || editingRecord.rastreio);

      setFormData({
        ID: editingRecord.id || editingRecord.ID,
        Fornecedor: editingRecord.Fornecedor || editingRecord.fornecedor || '',
        Saída: toInputDate(dataSaida),
        "NF's": editingRecord["NF's"] || editingRecord.nfs || '',
        AWB: editingRecord.AWB || editingRecord.awbNumber || '',
        Status: (editingRecord.Status || editingRecord.status || AWBStatus.EM_TRANSITO) as AWBStatus,
        Chegada: toInputDate(editingRecord.Chegada || editingRecord.chegada),
        Marca: editingRecord.Marca || editingRecord.marca || '',
        Material: editingRecord.Material || editingRecord.material || '',
        Observação: editingRecord.Observação || editingRecord.observacao || '',
        Rastreio: linkRef || '',
        Documentos: editingRecord.Documentos || editingRecord.documentos || '',
        send_email: editingRecord.send_email || false,
        email_to: editingRecord.email_to ? String(editingRecord.email_to).split(',').filter(e => e.trim()) : [],
        email_cc: editingRecord.email_cc ? String(editingRecord.email_cc).split(',').filter(e => e.trim()) : [],
        email_bcc: editingRecord.email_bcc ? String(editingRecord.email_bcc).split(',').filter(e => e.trim()) : [],
        email_body: editingRecord.email_body || ''
      });
      setPendingFiles([]);
    } else {
      setFormData({
        ...INITIAL_FORM_DATA,
        AWB: isNFMode ? '-' : ''
      });
      setPendingFiles([]);
    }
    setShowEmailSection(false);
  }, [editingRecord, isOpen, isNFMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalDocs = formData.Documentos || '';
      if (pendingFiles.length > 0) {
        const uploadedUrls = [];
        for (const file of pendingFiles) {
          const url = await storageService.uploadFile(file);
          uploadedUrls.push(url);
        }
        const existingDocs = String(finalDocs).split('|').filter(l => l.trim().startsWith('http'));
        finalDocs = [...existingDocs, ...uploadedUrls].join('|');
      }

      const payload: any = {
        ID: formData.ID || Math.random().toString(36).substring(2, 11),
        Fornecedor: formData.Fornecedor,
        "NF's": formData["NF's"],
        Status: formData.Status,
        Chegada: formData.Chegada,
        Marca: formData.Marca,
        Material: formData.Material,
        Observação: formData.Observação,
        Documentos: finalDocs,
        send_email: formData.send_email,
        email_to: formData.email_to.join(','),
        email_cc: formData.email_cc.join(','),
        email_bcc: formData.email_bcc.join(','),
        email_body: formData.email_body
      };

      if (isNFMode) {
        payload["Previsão Agend."] = formData.Saída;
        payload["Link Agendamento"] = formData.Rastreio;
        payload["AWB"] = "-";
      } else {
        payload["Saída"] = formData.Saída;
        payload["AWB"] = formData.AWB;
        payload["Rastreio"] = formData.Rastreio;
      }

      await storageService.saveRecord(payload, isNFMode ? SHEETS.PRE : SHEETS.AWB);
      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden">
      <div className="bg-custom-main w-full max-w-4xl rounded-[24px] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 text-custom-main">
        
        <div className="px-10 py-8 flex items-center justify-between border-b border-slate-200 dark:border-white/5 shrink-0">
          <div className="space-y-1">
             <h2 className="text-2xl font-black text-custom-main italic tracking-tighter uppercase">
              {editingRecord ? (isNFMode ? 'ATUALIZAR PRÉ-EMBARQUE' : 'ATUALIZAR EMBARQUE') : (isNFMode ? 'NOVO PRÉ-EMBARQUE' : 'NOVO LANÇAMENTO AWB')}
            </h2>
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.5em]">CLOUD SYNC ENTERPRISE 3.2</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-slate-900 dark:text-white transition-all border border-slate-200 dark:border-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-10 space-y-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Truck size={12} className="text-primary-500" /> Fornecedor
              </label>
              <input required value={formData.Fornecedor} onChange={(e) => handleInputChange('Fornecedor', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main uppercase outline-none focus:border-primary-600/50 transition-all placeholder:text-slate-700" placeholder="EX: BRANYL" />
            </div>

            {!isNFMode && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} className="text-primary-500" /> AWB NUMBER
                </label>
                <input required={!isNFMode} value={formData.AWB} onChange={(e) => handleInputChange('AWB', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all placeholder:text-slate-700" placeholder="000-00000000" />
              </div>
            )}

            {/* Campo de Data Estilizado Conforme Imagem */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} className="text-primary-500" /> SAÍDA
              </label>
              <div className="relative">
                  <input 
                  type="date" 
                  value={formData.Saída} 
                  onChange={(e) => handleInputChange('Saída', e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all appearance-none" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Hash size={12} className="text-primary-500" /> NF'S
              </label>
              <input required value={formData["NF's"]} onChange={(e) => handleInputChange("NF's", e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all placeholder:text-slate-700" placeholder="EX: 1234, 5678" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                MARCA
              </label>
              <div className="relative">
                <select 
                  value={formData.Marca} 
                  onChange={(e) => handleInputChange('Marca', e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all uppercase appearance-none cursor-pointer pr-10"
                >
                  <option value="">SELECIONE A MARCA</option>
                  <option value="FILA">FILA</option>
                  <option value="UMBRO">UMBRO</option>
                  <option value="ASICS">ASICS</option>
                  <option value="OUTROS">OUTROS</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                STATUS OPERACIONAL
              </label>
              <div className="relative">
                <select value={formData.Status} onChange={(e) => handleInputChange('Status', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all uppercase appearance-none cursor-pointer pr-10">
                  {Object.values(AWBStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white pointer-events-none" />
              </div>
            </div>

            {!isNFMode && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <LinkIcon size={12} className="text-primary-500" /> LINK RASTREIO
                </label>
                <input value={formData.Rastreio} onChange={(e) => handleInputChange('Rastreio', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all placeholder:text-slate-700" placeholder="https://..." />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} className="text-emerald-500" /> CHEGADA
              </label>
              <input type="date" value={formData.Chegada} onChange={(e) => handleInputChange('Chegada', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all appearance-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Info size={12} className="text-primary-500" /> MATERIAL
              </label>
              <input value={formData.Material} onChange={(e) => handleInputChange('Material', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main uppercase outline-none focus:border-primary-600/50 transition-all placeholder:text-slate-700" placeholder="EX: TÊNIS / VESTUÁRIO" />
            </div>
          </div>

          <div className="md:col-span-full space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OBSERVAÇÕES DO LOTE</label>
            <textarea value={formData.Observação} onChange={(e) => handleInputChange('Observação', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all placeholder:text-slate-700 resize-none min-h-[100px] uppercase" placeholder="INFORMAÇÕES ADICIONAIS..." />
          </div>

          <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            <button 
              type="button" 
              onClick={() => setShowEmailSection(!showEmailSection)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 hover:bg-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-2 text-primary-500">
                <Mail size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">NOTIFICAÇÃO POR E-MAIL</span>
              </div>
              <ChevronDown size={16} className={`text-slate-500 transition-transform ${showEmailSection ? 'rotate-180' : ''}`} />
            </button>
            
            {showEmailSection && (
              <div className="p-6 bg-slate-50 dark:bg-slate-950 space-y-6 border-t border-slate-200 dark:border-white/5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={formData.send_email} 
                      onChange={(e) => handleInputChange('send_email', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-slate-600 rounded bg-transparent peer-checked:bg-white peer-checked:border-white transition-all"></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-primary-400 transition-colors">
                    ENVIAR DETALHES E ARQUIVOS POR E-MAIL APÓS SALVAR
                  </span>
                </label>

                {formData.send_email && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                          <span>PARA (E-MAIL PRINCIPAL)</span>
                          <span className="text-slate-700">SEPARE POR VÍRGULAS</span>
                        </label>
                        <EmailChipInput 
                          emails={formData.email_to} 
                          onChange={(emails) => handleInputChange('email_to', emails)} 
                          placeholder="email@destino.com, outro@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                          <span>CC (CÓPIA)</span>
                          <span className="text-slate-700">SEPARE POR VÍRGULAS</span>
                        </label>
                        <EmailChipInput 
                          emails={formData.email_cc} 
                          onChange={(emails) => handleInputChange('email_cc', emails)} 
                          placeholder="copia@email.com, cc@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                          <span>CCO (CÓPIA OCULTA)</span>
                          <span className="text-slate-700">SEPARE POR VÍRGULAS</span>
                        </label>
                        <EmailChipInput 
                          emails={formData.email_bcc} 
                          onChange={(emails) => handleInputChange('email_bcc', emails)} 
                          placeholder="oculta@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12} className="text-primary-500" /> CONTEÚDO PERSONALIZADO DO E-MAIL (CORPO DA MENSAGEM)
                      </label>
                      <textarea 
                        value={formData.email_body} 
                        onChange={(e) => handleInputChange('email_body', e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-6 py-4 text-xs font-black text-custom-main outline-none focus:border-primary-600/50 transition-all placeholder:text-slate-700 resize-none min-h-[100px]" 
                        placeholder="Escreva aqui a mensagem que será enviada aos destinatários..." 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Upload size={12} className="text-emerald-500" /> DOCUMENTOS DIGITAIS (PDF_1 AO PDF_11)
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:text-white transition-colors">
                  CLIQUE PARA SELECIONAR ARQUIVOS DE NOTA FISCAL OU COMPROVANTES
                </p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
            </div>

            {pendingFiles.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-3">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Arquivos Selecionados ({pendingFiles.length})</h4>
                <div className="space-y-2">
                  {pendingFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Paperclip size={14} className="text-primary-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-500 rounded-md transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-slate-200 dark:border-white/5 shrink-0">
             <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-slate-900 dark:text-white transition-all">CANCELAR</button>
             <button type="submit" disabled={loading} className="w-full md:w-auto md:min-w-[320px] bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50">
               {loading ? <Loader2 size={18} className="animate-spin" /> : <FileStack size={18} />}
               {loading ? 'PROCESSANDO...' : 'EFETIVAR LANÇAMENTO'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default AWBModal;

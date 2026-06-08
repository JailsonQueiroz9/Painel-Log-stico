
import React, { useState, useEffect, useMemo } from 'react';
import { 
  History as HistoryIcon, Search, Calendar, Filter, 
  ChevronDown, FileText, CheckCircle2, Loader2, Download, ExternalLink, RefreshCw,
  ChevronRight, X
} from 'lucide-react';
import { AWBRecord, AWBStatus } from '../types';
import { storageService, formatDate } from '../services/storageService';

interface HistoryProps {
  theme?: 'dark' | 'light';
}

const History: React.FC<HistoryProps> = ({ theme = 'dark' }) => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await storageService.getRecords();
      // Filtra registros que tenham status de finalização (ENTREGUE ou OK)
      // Normalizamos para maiúsculas e removemos espaços para garantir a comparação
      const finishedRecords = data.filter(r => {
        const s = String(r.status || r.Status || '').toUpperCase().trim();
        return s === 'ENTREGUE' || s === 'OK';
      });
      setRecords(finishedRecords);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const search = searchTerm.toLowerCase();
      // Verifica todas as possíveis variações de nomes de campos da planilha
      const awb = String(r.awbNumber || r.AWB || '').toLowerCase();
      const provider = String(r.fornecedor || r.Fornecedor || '').toLowerCase();
      const nfs = String(r.nfs || r["NF's"] || '').toLowerCase();
      
      return awb.includes(search) || provider.includes(search) || nfs.includes(search);
    });
  }, [records, searchTerm]);

  if (loading) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 text-center px-6">
          Acessando Arquivos de Operação Concluída...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-custom-main">
      
      <header className="px-10 py-8 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-5">
           <div className={`w-14 h-14 ${theme === 'light' ? 'bg-emerald-50' : 'bg-emerald-600/10'} border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg`}>
              <HistoryIcon size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">Arquivo de Operações</h2>
             <p className={`${theme === 'light' ? 'text-slate-500' : 'text-slate-500'} text-[9px] font-black uppercase tracking-[0.4em] mt-2`}>Registros Finalizados e Histórico</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
            onClick={loadHistory}
            className={`p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} hover:text-emerald-500 rounded-xl transition-all shadow-sm`}
           >
              <RefreshCw size={18} />
           </button>
           <button className={`px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black ${theme === 'light' ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest rounded-xl hover:text-slate-900 dark:text-white transition-all flex items-center gap-3 shadow-sm`}>
              <Download size={14} /> Exportar Log CSV
           </button>
        </div>
      </header>

      <div className={`px-10 py-6 border-b ${theme === 'light' ? 'border-blue-100 bg-blue-50/20' : 'border-slate-900 bg-white/5'} flex items-center gap-6`}>
        <div className="relative flex-1 group">
           <Search size={18} className={`absolute left-5 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-primary-300' : 'text-slate-600'} group-focus-within:text-emerald-500 transition-colors`} />
           <input 
            type="text" 
            placeholder="PESQUISAR POR AWB OU FORNECEDOR NO HISTÓRICO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${theme === 'light' ? 'bg-white border-blue-100 shadow-[0_4px_20px_rgba(59,130,246,0.04)]' : 'bg-slate-900 border-slate-800 shadow-inner'} rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-slate-900 dark:text-white uppercase focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400`}
           />
        </div>
        <div className="flex items-center gap-4">
           <div className={`flex ${theme === 'light' ? 'bg-white border-blue-100' : 'bg-slate-900 border-slate-800'} p-1.5 rounded-xl border`}>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg shadow-emerald-600/20">Este Mês</button>
              <button className={`px-4 py-2 ${theme === 'light' ? 'text-primary-400' : 'text-slate-300'} rounded-lg text-[9px] font-black uppercase hover:text-emerald-600 transition-colors`}>Este Ano</button>
           </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6">
             <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900/50 flex items-center justify-center border border-slate-200 dark:border-slate-800/50">
                <HistoryIcon size={48} className="opacity-10" />
             </div>
             <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Nenhum registro finalizado encontrado</p>
                <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-2">Os itens aparecem aqui após o status ser alterado para OK ou ENTREGUE</p>
             </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => {
              const docs = r.pdf_links || (r.documentos || r.Documentos ? String(r.documentos || r.Documentos).split('|').filter(l => l.trim().startsWith('http')) : []);
              const currentAwb = r.awbNumber || r.AWB || 'N/A';
              const currentProvider = r.fornecedor || r.Fornecedor || 'N/A';
              const currentBrand = r.marca || r.Marca || 'N/A';
              const finishDate = r.chegada || r.Chegada;

              return (
                <div key={r.id || r.ID} className={`bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-[28px] p-6 flex items-center justify-between hover:border-emerald-500/20 transition-all group relative ${theme === 'light' ? 'shadow-[0_10px_40px_rgba(59,130,246,0.04)]' : ''}`}>
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                        <CheckCircle2 size={20} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{currentAwb}</h4>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Finalizado em {formatDate(finishDate)}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-12">
                     <div className="text-center hidden md:block">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Fornecedor</p>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{currentProvider}</p>
                     </div>
                     <div className="text-center hidden md:block">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Marca</p>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{currentBrand}</p>
                     </div>
                     
                     <div className="relative">
                        <button 
                          onClick={() => docs.length > 0 && setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID))}
                          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shadow-lg ${
                            docs.length > 0 
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-500 hover:text-slate-900 dark:text-white hover:bg-emerald-600' 
                            : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-900 text-slate-800 cursor-not-allowed opacity-30'
                          }`}
                        >
                           <FileText size={18} />
                        </button>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {openDocsId && (() => {
        const selected = records.find(r => (r.id || r.ID) === openDocsId);
        if (!selected) return null;
        const pdfLinks = selected.pdf_links || (selected.documentos || selected.Documentos ? String(selected.documentos || selected.Documentos).split('|').filter(l => l.trim().startsWith('http')) : []);
        return <DocumentModal links={pdfLinks} onClose={() => setOpenDocsId(null)} record={selected} theme={theme} />;
      })()}

    </div>
  );
};

const DocumentModal = ({ 
  links, 
  onClose, 
  record, 
  theme = 'dark' 
}: { 
  links: string[], 
  onClose: () => void, 
  record: AWBRecord, 
  theme?: 'dark' | 'light' 
}) => {
  const awb = record.AWB || record.awbNumber || record["NF's"] || record.nfs || '-';
  const supplier = record.Fornecedor || record.fornecedor || '-';

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="bg-custom-main w-full max-w-lg rounded-[24px] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 text-custom-main">
        
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5 shrink-0">
          <div className="space-y-1">
             <h2 className="text-xl font-black text-custom-main italic tracking-tighter uppercase">
               Documentação Digital
             </h2>
             <p className="text-[9px] font-black tracking-widest text-[#10b981] uppercase flex items-center gap-1.5">
               <FileText size={12} /> {awb} • {supplier}
             </p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-slate-900 dark:text-white transition-all border border-slate-200 dark:border-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Anexos vinculados a esta operação ({links.length})
          </p>
          
          <div className="space-y-3">
            {links.map((url, i) => (
              <a 
                key={i} 
                href={url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-4 p-4 bg-white/5 border border-slate-200 dark:border-white/5 hover:border-[#10b981]/30 hover:bg-[#10b981]/5 rounded-2xl transition-all group"
              >
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-400 group-hover:text-[#10b981] group-hover:bg-[#10b981]/10 border border-slate-200 dark:border-slate-800 transition-colors">
                  <Download size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">Documento PDF {i + 1}</p>
                  <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase truncate mt-1">Download Seguro • Cloud Storage</p>
                </div>
                <ChevronRight size={18} className="text-slate-800 group-hover:text-[#10b981] group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/20 flex justify-end shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all uppercase tracking-widest shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;

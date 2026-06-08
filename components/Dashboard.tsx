
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, RotateCw, Search, Trash2, Package, 
  FileText, Edit3, Loader2, ExternalLink, ChevronDown,
  LayoutGrid, List, ChevronRight, Calendar, Box, Truck,
  Download, ArrowUpDown, ChevronUp, X, FileCheck, AlignLeft,
  Link as LinkIcon, Globe, Zap, Contact, MessageSquare, LogOut, BarChart3
} from 'lucide-react';
import { AWBRecord, AWBStatus, FilterState, User, ViewType } from '../types';
import { storageService, getApiUrl, formatDate, SHEETS } from '../services/storageService';
import AWBModal from './AWBModal';
import StatusBadge from './StatusBadge';
import VisualDashboard from './VisualDashboard';

// Helper universal para extrair todos os PDFs de todas as colunas possíveis
export const getAttachmentLinks = (r: AWBRecord): string[] => {
  const links: string[] = [];
  
  // 1. Verificar coluna principal 'Documentos'
  const mainDocs = r.Documentos || r.documentos;
  if (mainDocs) {
    String(mainDocs).split('|').forEach(l => {
      const t = l.trim();
      if (t.startsWith('http')) links.push(t);
    });
  }

  // 2. Verificar colunas dinâmicas PDF_1 até PDF_11
  for (let i = 1; i <= 11; i++) {
    const key = `PDF_${i}`;
    const val = r[key];
    if (val && String(val).trim().startsWith('http')) {
      links.push(String(val).trim());
    }
  }

  return Array.from(new Set(links)); // Remove duplicatas
};

interface DashboardProps {
  filters: FilterState;
  theme?: 'dark' | 'light';
}

const Dashboard: React.FC<DashboardProps> = ({ filters, theme = 'dark' }) => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AWBRecord | undefined>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'visual'>(() => {
    return (localStorage.getItem('dashboard_view_mode') as 'table' | 'grid' | 'visual') || 'table';
  });

  useEffect(() => {
    localStorage.setItem('dashboard_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch { setCurrentUser(null); }
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await storageService.getRecords(SHEETS.AWB);
      setRecords(data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Deseja EXCLUIR este registro permanentemente?')) return;
    setDeletingId(id);
    try {
      await storageService.deleteRecord(id, SHEETS.AWB);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, record: AWBRecord) => {
    e.stopPropagation();
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const hasPermission = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    // Regra: Somente quem tem acesso às telas de Follow-up (AWB ou PRÉ) pode criar/editar
    const views = (currentUser.allowedViews || []) as ViewType[];
    return views.includes('follow-up') || views.includes('follow-up-pre');
  }, [currentUser]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const s = searchTerm.toLowerCase();
      const searchStr = `${r.Fornecedor} ${r.AWB} ${r["NF's"]} ${r.Marca} ${r.Material} ${r.Rastreio}`.toLowerCase();
      const matchesSearch = searchStr.includes(s);
      const currentStatus = (r.Status || r.status) as AWBStatus;
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(currentStatus);
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, filters.statuses]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-custom-main">
      
      {/* Industrial Dark Header - Fixo como na imagem */}
      <header className="relative bg-[#050a14] px-10 py-10 flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden shadow-2xl z-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-primary-600/20 border border-primary-500/30 rounded-2xl flex items-center justify-center text-primary-400 shadow-lg">
              <Package size={32} />
           </div>
           <div>
             <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Painel Logístico</h2>
             <p className="text-primary-500 text-[10px] font-bold uppercase tracking-[0.5em] mt-3">SISTEMA DASS INDUSTRIAL</p>
           </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           <div className="flex bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-inner">
              <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`} title="Tabela"><List size={22} /></button>
              <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`} title="Cards"><LayoutGrid size={22} /></button>
              <button onClick={() => setViewMode('visual')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'visual' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`} title="Visual"><BarChart3 size={22} /></button>
           </div>
           <button onClick={loadData} className="p-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl transition-all shadow-xl">
              <RotateCw size={22} className={loading ? 'animate-spin' : ''} />
           </button>
           {hasPermission && (
             <button onClick={() => { setEditingRecord(undefined); setIsModalOpen(true); }} className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl glow-primary flex items-center gap-3 transition-all active:scale-95">
               <Plus size={20} /> Novo Embarque
             </button>
           )}
        </div>
      </header>

      {viewMode !== 'visual' && (
        <div className={`px-10 py-6 border-b ${theme === 'light' ? 'border-blue-100 bg-blue-50/20' : 'border-slate-900 bg-white/5'} flex items-center gap-6`}>
          <div className="relative flex-1 group">
             <Search size={18} className={`absolute left-5 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-primary-300' : 'text-slate-600'} group-focus-within:text-primary-500 transition-colors`} />
             <input type="text" placeholder="PESQUISAR CARGA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full ${theme === 'light' ? 'bg-white border-blue-100 shadow-[0_4px_20px_rgba(59,130,246,0.04)]' : 'bg-slate-900 border-slate-800'} border rounded-2xl pl-14 pr-6 py-4 text-[11px] font-black text-custom-main uppercase focus:border-primary-500 outline-none transition-all placeholder:text-slate-400`} />
          </div>
          <p className={`text-[10px] font-black ${theme === 'light' ? 'text-primary-400 bg-white border border-blue-100' : 'text-slate-500 bg-slate-900'} uppercase tracking-widest px-4 py-2 rounded-lg`}>{filteredRecords.length} Resultados</p>
        </div>
      )}

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-10 custom-scrollbar">
        {viewMode === 'visual' ? (
          <VisualDashboard theme={theme} />
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left border-separate border-spacing-y-4 min-w-[1600px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.2em] text-custom-main font-black">
                  <th className="px-4 py-2">Marca</th>
                  <th className="px-4 py-2">Fornecedor</th>
                  <th className="px-4 py-2">Saída</th>
                  <th className="px-4 py-2">NF's</th>
                  <th className="px-4 py-2">AWB</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Rastreio</th>
                  <th className="px-4 py-2">Material</th>
                  <th className="px-4 py-2">Observação</th>
                  <th className="px-4 py-2">Docs</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  const pdfs = getAttachmentLinks(r);
                  const trackVal = r.Rastreio || r.rastreio;
                  return (
                    <tr key={r.id || r.ID} className="bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 transition-all border border-slate-200 dark:border-slate-900 shadow-xl">
                      <td className="px-4 py-6 rounded-l-[24px] text-xs font-black text-custom-main uppercase">{r.Marca || r.marca || '-'}</td>
                      <td className="px-4 py-6 text-xs font-black text-custom-main uppercase">{r.Fornecedor || r.fornecedor}</td>
                      <td className="px-4 py-6 text-xs font-bold text-custom-main">{formatDate(r.Saída || r.saida)}</td>
                      <td className="px-4 py-6 text-[11px] font-bold text-custom-main">{r["NF's"] || r.nfs || '-'}</td>
                      <td className="px-4 py-6 text-xs font-black text-custom-main font-mono tracking-tighter">{r.AWB || r.awbNumber}</td>
                      <td className="px-4 py-6"><StatusBadge status={r.Status || r.status || AWBStatus.EM_TRANSITO} /></td>
                      <td className="px-4 py-6">
                        {trackVal ? (
                          <a 
                            href={String(trackVal).startsWith('http') ? String(trackVal) : `https://www.google.com/search?q=${trackVal}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-2 text-custom-main hover:opacity-80 transition-all group"
                          >
                             <div className="p-2 bg-primary-500/10 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-all">
                                <Globe size={12} />
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-widest hidden xl:inline">Rastrear</span>
                          </a>
                        ) : (
                          <span className="text-custom-main">-</span>
                        )}
                      </td>
                      <td className="px-4 py-6 text-[10px] font-black text-custom-main uppercase">{r.Material || r.material || '-'}</td>
                      <td className="px-4 py-6 text-[10px] font-bold text-custom-main uppercase max-w-[200px] truncate" title={r.Observação || r.observacao}>{r.Observação || r.observacao || '-'}</td>
                      <td className="px-4 py-6 relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); pdfs.length > 0 && setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID)); }}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${pdfs.length > 0 ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-custom-main hover:bg-primary-500 hover:text-white' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-900 text-custom-main cursor-not-allowed opacity-30'}`}
                        >
                           <FileText size={18} />
                           {pdfs.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-[#050a14]">{pdfs.length}</span>}
                        </button>
                      </td>
                      <td className="px-4 py-6 rounded-r-[24px] text-right">
                        {hasPermission && (
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={(e) => handleEdit(e, r)} className="p-3 text-custom-main hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-all"><Edit3 size={18} /></button>
                             <button onClick={(e) => handleDelete(e, r.id || r.ID)} className="p-3 text-custom-main hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredRecords.map((r) => {
              const pdfs = getAttachmentLinks(r);
              const trackVal = r.Rastreio || r.rastreio;
              return (
                <div key={r.id || r.ID} className={`bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-[32px] p-8 hover:bg-white dark:hover:bg-slate-900 transition-all flex flex-col gap-6 group relative ${theme === 'light' ? 'shadow-[0_25px_60px_rgba(59,130,246,0.06)] border-blue-100/50' : 'shadow-2xl'} animate-in zoom-in-95`}>
                   <div className="flex justify-between items-start">
                      <StatusBadge status={r.Status || r.status || AWBStatus.EM_TRANSITO} />
                      <div className="flex items-center gap-1">
                        {trackVal && (
                          <a href={String(trackVal).startsWith('http') ? String(trackVal) : `https://www.google.com/search?q=${trackVal}`} target="_blank" rel="noreferrer" className="p-2.5 bg-primary-600/10 border border-primary-500/20 text-primary-500 rounded-xl hover:bg-primary-600 hover:text-white transition-all" title="Rastrear Carga">
                            <Globe size={16} />
                          </a>
                        )}
                        {pdfs.length > 0 && (
                          <div className="relative">
                            <button onClick={() => setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID))} className="p-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                               <FileCheck size={16} />
                            </button>
                          </div>
                        )}
                        {hasPermission && (
                          <>
                            <button onClick={(e) => handleEdit(e, r)} className="p-2.5 text-custom-main hover:text-primary-500 transition-colors"><Edit3 size={16} /></button>
                            <button onClick={(e) => handleDelete(e, r.id || r.ID)} className="p-2.5 text-custom-main hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                   </div>
                        <div>
                      <h4 className="text-xl font-black text-custom-main font-mono italic tracking-tighter uppercase truncate">{r.AWB || r.awbNumber}</h4>
                      <div className="flex flex-col gap-2 mt-4">
                         <p className={`text-[10px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-custom-main'} uppercase tracking-widest flex items-center gap-2`}>
                           <Truck size={12} className="text-primary-500" /> {r.Fornecedor || r.fornecedor}
                         </p>
                         <p className={`text-[10px] font-black ${theme === 'light' ? 'text-slate-600' : 'text-custom-main'} uppercase tracking-widest ml-5`}>
                           NF: {r["NF's"] || r.nfs || 'N/A'}
                         </p>
                         <p className={`text-[10px] font-black ${theme === 'light' ? 'text-slate-600' : 'text-custom-main'} uppercase tracking-widest flex items-center gap-2`}>
                           <Box size={12} className="text-primary-500" /> {r.Material || r.material || '-'}
                         </p>
                      </div>
                   </div>

                   <div className={`pt-4 border-t ${theme === 'light' ? 'border-blue-50' : 'border-white/5'} space-y-2`}>
                      <p className={`text-[9px] font-black ${theme === 'light' ? 'text-primary-300' : 'text-custom-main'} uppercase tracking-[0.3em] flex items-center gap-2`}>
                        <AlignLeft size={12} /> Observação
                      </p>
                      <p className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-custom-main'} uppercase leading-relaxed line-clamp-2 italic`} title={r.Observação || r.observacao}>
                        {r.Observação || r.observacao || 'SEM OBSERVAÇÃO'}
                      </p>
                   </div>
                   
                   <div className={`mt-auto pt-6 border-t ${theme === 'light' ? 'border-blue-50' : 'border-slate-900'} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className={theme === 'light' ? 'text-primary-300' : 'text-custom-main'} />
                        <span className={`text-[9px] font-black ${theme === 'light' ? 'text-slate-400' : 'text-custom-main'} uppercase tracking-widest`}>{formatDate(r.Saída || r.saida)}</span>
                      </div>
                      <span className={`px-3 py-1 bg-white dark:bg-slate-900 border ${theme === 'light' ? 'border-blue-100/60 shadow-sm' : 'border-slate-800'} rounded-lg text-[8px] font-black ${theme === 'light' ? 'text-primary-400' : 'text-custom-main'} uppercase tracking-widest`}>{r.Marca || r.marca || '-'}</span>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AWBModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRecord(undefined); }} onSave={loadData} editingRecord={editingRecord} />
      {openDocsId && (() => {
        const selected = records.find(r => (r.id || r.ID) === openDocsId);
        if (!selected) return null;
        const pdfLinks = getAttachmentLinks(selected);
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
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
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

export default Dashboard;

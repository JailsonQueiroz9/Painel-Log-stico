
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Package, BarChart3, Layout, ChevronDown
} from 'lucide-react';
import { AWBRecord, AWBStatus } from '../types';
import { storageService, SHEETS } from '../services/storageService';
import StatusBadge from './StatusBadge';

interface VisualDashboardProps {
  onClose?: () => void;
  isModal?: boolean;
  theme?: 'dark' | 'light';
}

const VisualDashboard: React.FC<VisualDashboardProps> = ({ onClose, isModal = false, theme = 'dark' }) => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await storageService.getRecords(SHEETS.AWB);
      setRecords(data);
    } catch (err) {
      console.error("Erro ao carregar dados para o Dashboard Visual:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = records.length;
    
    // Entregas OK (OK ou ENTREGUE)
    const deliveredRecords = records.filter(r => {
      const s = (r.Status || r.status || '').toUpperCase();
      return s === 'ENTREGUE' || s === 'OK';
    });
    const deliveriesOk = deliveredRecords.length;

    const activeRecords = records.filter(r => {
      const s = (r.Status || r.status || '').toUpperCase();
      return s !== 'ENTREGUE' && s !== 'OK' && s !== '';
    });
    const active = activeRecords.length;

    const criticalRecords = records.filter(r => {
      const s = (r.Status || r.status || '').toUpperCase();
      return s === 'ATRASADO';
    });
    const critical = criticalRecords.length;

    // Detailed summaries
    const activeSummary = activeRecords.reduce((acc: any, r) => {
      const s = (r.Status || r.status || 'OUTROS').toUpperCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const criticalSummary = criticalRecords.length > 0 
      ? `Atenção: ${criticalRecords.length} cargas com atraso crítico detectado.`
      : "Nenhum alerta crítico pendente no momento.";

    // Brands
    const getBrandStats = (brandName: string) => {
      const brandRecords = records.filter(r => (r.Marca || r.marca || '').toUpperCase() === brandName);
      const inTransit = brandRecords.filter(r => {
        const s = (r.Status || r.status || '').toUpperCase();
        return s !== 'ENTREGUE' && s !== 'OK';
      }).length;
      const delivered = brandRecords.length - inTransit;
      
      return {
        count: brandRecords.length,
        inTransit,
        delivered,
        avg: getAvgLeadTime(brandRecords)
      };
    };

    // Helper to parse DD/MM/YYYY
    function getAvgLeadTime(filteredRecords: AWBRecord[]) {
      let totalDays = 0;
      let count = 0;
      filteredRecords.forEach(r => {
        const start = parseDate(r.Saída || r.saida || '');
        const end = parseDate(r.Chegada || r.chegada || '');
        if (start && end) {
          const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          if (diff >= 0) {
            totalDays += diff;
            count++;
          }
        }
      });
      return count > 0 ? (totalDays / count).toFixed(1) : '0';
    }

    function parseDate(dateStr: string) {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      const day = parseInt(parts[0].trim());
      const month = parseInt(parts[1].trim()) - 1;
      const year = parseInt(parts[2].trim());
      return new Date(year, month, day);
    }

    const fila = getBrandStats('FILA');
    const umbro = getBrandStats('UMBRO');
    const asics = getBrandStats('ASICS');

    return {
      active,
      activeDetails: Object.entries(activeSummary).map(([k, v]) => `${v} ${k}`).join(' • '),
      deliveriesOk,
      deliveryDetails: `${deliveriesOk} cargas finalizadas com sucesso.`,
      critical,
      criticalDetails: criticalSummary,
      total,
      fila,
      umbro,
      asics
    };
  }, [records]);

  const content = (
    <div className={`flex-1 flex flex-col ${isModal ? 'bg-slate-50 dark:bg-slate-950' : 'bg-transparent'}`}>
      {/* Header */}
      <div className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-12 shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30">
            <Layout size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">DASHBOARD OPERACIONAL</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] italic">VISUALIZAÇÃO EM TEMPO REAL (AWB)</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white rounded-[20px] transition-all hover:scale-110 active:scale-95"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-12">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Sincronizando Base AWB...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  label: 'Pedidos Ativos', 
                  value: stats.active.toLocaleString(), 
                  status: 'EM TRÂNSITO', 
                  progress: Math.min(100, (stats.active / (stats.total || 1)) * 100),
                  details: stats.activeDetails || 'Nenhuma carga ativa'
                },
                { 
                  label: 'Entregas OK', 
                  value: stats.deliveriesOk.toLocaleString(), 
                  status: 'ENTREGUE', 
                  progress: Math.min(100, (stats.deliveriesOk / (stats.total || 1)) * 100),
                  details: stats.deliveryDetails
                },
                { 
                  label: 'Alertas Críticos', 
                  value: stats.critical.toLocaleString(), 
                  status: 'ATRASADO', 
                  progress: Math.min(100, (stats.critical / (stats.total || 1)) * 100),
                  details: stats.criticalDetails
                },
                { 
                  label: 'FILA', 
                  value: stats.fila.count.toLocaleString(), 
                  subValue: `${stats.fila.avg} dias médios`, 
                  status: 'MARCA', 
                  progress: Math.min(100, (stats.fila.count / (stats.total || 1)) * 100),
                  details: `${stats.fila.inTransit} em trânsito • ${stats.fila.delivered} entregues`
                },
                { 
                  label: 'UMBRO', 
                  value: stats.umbro.count.toLocaleString(), 
                  subValue: `${stats.umbro.avg} dias médios`, 
                  status: 'MARCA', 
                  progress: Math.min(100, (stats.umbro.count / (stats.total || 1)) * 100),
                  details: `${stats.umbro.inTransit} em trânsito • ${stats.umbro.delivered} entregues`
                },
                { 
                  label: 'ASICS', 
                  value: stats.asics.count.toLocaleString(), 
                  subValue: `${stats.asics.avg} dias médios`, 
                  status: 'MARCA', 
                  progress: Math.min(100, (stats.asics.count / (stats.total || 1)) * 100),
                  details: `${stats.asics.inTransit} em trânsito • ${stats.asics.delivered} entregues`
                }
              ].map((card, i) => (
                <div key={i} className={`bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 ${theme === 'light' ? 'shadow-[0_20px_50px_rgba(0,0,0,0.05)]' : 'shadow-2xl'} relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-3 bg-primary-500/10 text-primary-500 rounded-2xl shadow-inner"><Package size={20} /></div>
                    <StatusBadge status={card.status} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</p>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{card.value}</h4>
                      </div>
                      {card.subValue && (
                        <p className="text-[10px] font-bold text-primary-500 mb-1">{card.subValue}</p>
                      )}
                    </div>
                    
                    {/* Resumo Detalhado */}
                    <div className="pt-2">
                       <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-relaxed">
                         {card.details}
                       </p>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: `${card.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="h-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 flex items-center justify-center px-12 shrink-0">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic animate-pulse">SISTEMA DE RASTREAMENTO V3.2 • DATABASE SYNC (AWB)</p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
        <div className="relative w-full max-w-6xl h-full bg-slate-50 dark:bg-slate-950 rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default VisualDashboard;

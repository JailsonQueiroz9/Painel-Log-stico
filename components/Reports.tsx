
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend, BarChart, Bar
} from 'recharts';
import { 
  ArrowLeft, Loader2, BarChart3, RefreshCw, Package, Clock, 
  Truck, Box, TrendingUp, AlertTriangle, ChevronDown, Download
} from 'lucide-react';
import { AWBRecord } from '../types';
import { storageService, SHEETS } from '../services/storageService';

interface ChartCardProps {
  title: string;
  subtitle: string;
  trend?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  theme?: 'dark' | 'light';
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, trend, icon, children, theme = 'dark' }) => (
  <div className={`bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-[32px] p-8 ${theme === 'light' ? 'shadow-[0_20px_50px_rgba(59,130,246,0.06)] border-blue-100' : 'shadow-2xl'} relative overflow-hidden group hover:border-primary-500/20 transition-all`}>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
       <div className="flex items-center gap-4">
         {icon && <div className={`${theme === 'light' ? 'text-primary-400' : 'text-primary-500'} opacity-50 group-hover:opacity-100 transition-opacity`}>{icon}</div>}
         <div>
           <h3 className={`text-[11px] font-black ${theme === 'light' ? 'text-primary-900' : 'text-white'} uppercase tracking-widest`}>{title}</h3>
           <p className={`text-[9px] font-bold ${theme === 'light' ? 'text-primary-300' : 'text-slate-600'} uppercase tracking-widest mt-1 italic`}>{subtitle}</p>
         </div>
       </div>
       {trend && (
         <div className="text-right">
            <p className="text-[7px] font-black text-slate-700 uppercase">Indicador</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase">{trend}</p>
         </div>
       )}
    </div>
    {children}
  </div>
);

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const tooltipStyles = {
  contentStyle: { 
    backgroundColor: '#0c1425', 
    border: '1px solid #1e293b', 
    borderRadius: '12px', 
    fontSize: '11px', 
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  },
  itemStyle: { color: '#FFFFFF' },
  labelStyle: { color: '#64748b', marginBottom: '4px' }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#f43f5e', '#ffffff'];

// Fix: Adicionada propriedade 'theme' para alinhar com a chamada no App.tsx
const Reports: React.FC<{ theme?: 'dark' | 'light'; onBack: () => void }> = ({ onBack, theme }) => {
  const [awbRecords, setAwbRecords] = useState<AWBRecord[]>([]);
  const [preRecords, setPreRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [awbData, preData] = await Promise.all([
        storageService.getRecords(SHEETS.AWB),
        storageService.getRecords(SHEETS.PRE)
      ]);
      setAwbRecords(Array.isArray(awbData) ? awbData : []);
      setPreRecords(Array.isArray(preData) ? preData : []);
    } catch (error) {
      console.error("Erro no BI:", error);
      setAwbRecords([]);
      setPreRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateStr: any) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const s = String(dateStr);
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    const parts = s.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const processData = (records: AWBRecord[]) => {
    const weeklyMap: Record<string, any> = {};
    const supplierMap: Record<string, number> = {};
    const materialMap: Record<string, number> = {};
    const brandMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};

    records.forEach(r => {
      // Data/Semana - Adicionado suporte para 'Previsão Agend.' comum na aba PRÉ
      const rawDate = r.saida || r.Saída || r.chegada || r.Chegada || r.saída || r.CHEGADA || r.SAIDA || r["Previsão Agend."];
      const date = parseDate(rawDate);
      if (date && !isNaN(date.getTime())) {
        const weekLabel = `S${getWeekNumber(date)}`;
        if (!weeklyMap[weekLabel]) weeklyMap[weekLabel] = { week: weekLabel, total: 0, ok: 0, delay: 0 };
        weeklyMap[weekLabel].total++;
        const s = String(r.status || r.Status || r.STATUS || '').toUpperCase();
        if (s.includes('OK') || s.includes('ENTREGUE')) weeklyMap[weekLabel].ok++;
        if (s.includes('ATRASADO')) weeklyMap[weekLabel].delay++;
      }

      // Fornecedor
      const supplier = String(r.fornecedor || r.Fornecedor || r.FORNECEDOR || 'DESCONHECIDO').toUpperCase().trim();
      supplierMap[supplier] = (supplierMap[supplier] || 0) + 1;

      // Material
      const material = String(r.material || r.Material || r.MATERIAL || 'NÃO INF.').toUpperCase().trim();
      materialMap[material] = (materialMap[material] || 0) + 1;

      // Marca
      const brand = String(r.marca || r.Marca || r.MARCA || 'OUTROS').toUpperCase().trim();
      brandMap[brand] = (brandMap[brand] || 0) + 1;

      // Status
      const status = String(r.status || r.Status || r.STATUS || 'PENDENTE').toUpperCase().trim();
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    const supplierChart = Object.entries(supplierMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const materialChart = Object.entries(materialMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const brandChart = Object.entries(brandMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      weekly: Object.values(weeklyMap),
      suppliers: supplierChart,
      materials: materialChart,
      brands: brandChart,
      status: Object.entries(statusMap).map(([name, value]) => ({ name, value }))
    };
  };

  const awbBI = useMemo(() => processData(awbRecords), [awbRecords]);
  const preBI = useMemo(() => processData(preRecords), [preRecords]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="text-primary-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Minerando Dados Logísticos...</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto ${theme === 'light' ? 'bg-blue-50/20' : 'bg-custom-main'} p-0 custom-scrollbar pb-32 relative`}>
      {/* Dynamic Header Section - Always Dark Industrial style like the image */}
      <div className={`relative ${theme === 'light' ? 'bg-blue-600' : 'bg-[#050a14]'} p-8 md:p-12 mb-10 overflow-hidden shadow-2xl transition-colors duration-500`}>
        {/* Background Gradients and Effects */}
        <div className={`absolute top-0 right-0 w-[600px] h-full ${theme === 'light' ? 'bg-gradient-to-l from-blue-400/20' : 'bg-gradient-to-l from-primary-600/10'} to-transparent pointer-events-none`} />
        <div className={`absolute top-0 left-0 w-full h-full ${theme === 'light' ? 'bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent)]' : 'bg-[radial-gradient(circle_at_top_left,rgba(var(--color-primary-500),0.15),transparent)]'} pointer-events-none`} />
        
        {/* Decorative elements from image */}
        <div className="absolute -left-10 bottom-0 opacity-20 pointer-events-none select-none">
          <div className={`w-40 h-40 border-[20px] ${theme === 'light' ? 'border-white/10' : 'border-emerald-500/20'} rounded-full blur-2xl`} />
        </div>

        <div className="relative z-10">
          <div className="w-full flex flex-col md:flex-row md:items-start justify-between gap-10 mb-12">
            {/* Date Card */}
            <div className="flex-shrink-0">
              <div className={`${theme === 'light' ? 'bg-white/90 shadow-xl border-blue-400' : 'bg-slate-900/60 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)]'} backdrop-blur-md border-[2px] rounded-2xl p-6 px-10 flex flex-col gap-1 min-w-[240px]`}>
                 <h4 className={`${theme === 'light' ? 'text-primary-900' : 'text-white'} text-xl font-black tracking-tight flex items-center gap-2`}>
                   {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
                 </h4>
                 <p className={`${theme === 'light' ? 'text-primary-600' : 'text-emerald-500'} text-[10px] font-black uppercase tracking-[0.2em]`}>{new Date().getFullYear()} • CICLO INDUSTRIAL</p>
              </div>
            </div>

            {/* Title Section */}
            <div className="flex-1 text-center flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white text-lg font-black uppercase tracking-[0.4em]">{new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}</span>
                <span className="flex gap-1.5 text-xl">💚 💙</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                Relatório de Eficiência Industrial
              </h1>
              <div className={`inline-flex items-center gap-2 ${theme === 'light' ? 'bg-white/20' : 'bg-black/40'} backdrop-blur-md border border-white/5 rounded-full px-8 py-2.5`}>
                <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">
                  RESUMO OPERACIONAL: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Navigation/Actions Section */}
            <div className="flex flex-col items-end gap-4">
              <div className="flex gap-2">
                <button onClick={() => window.print()} className={`flex items-center gap-2 px-4 py-2.5 ${theme === 'light' ? 'bg-white text-primary-600 shadow-lg' : 'bg-white/10 text-white'} hover:bg-white/20 rounded-xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest`}>
                  <Download size={16} /> PDF
                </button>
                <button onClick={onBack} className={`p-3 ${theme === 'light' ? 'bg-white text-primary-600 shadow-lg' : 'bg-white/10 text-white'} hover:bg-white/20 rounded-xl border border-white/10 transition-all group`}>
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            <div className="relative group">
              <select className="appearance-none bg-white text-slate-900 px-10 py-4 pr-14 rounded-2xl text-[11px] font-black uppercase tracking-widest border-none focus:ring-4 focus:ring-primary-500/30 transition-all cursor-pointer shadow-2xl">
                <option>📅 ÚLTIMO DIA ÚTIL</option>
                <option>📅 SEMANA ATUAL</option>
                <option>📅 MÊS ATUAL</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900 border-l border-slate-200 pl-3">
                 <ChevronDown size={16} />
              </div>
            </div>

            <button 
              onClick={fetchData} 
              className="group relative bg-primary-500 hover:bg-primary-600 text-white px-14 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 hover:scale-[1.02] active:scale-95 flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              SINCRONIZAR DADOS
            </button>
          </div>

          {/* Industrial Quote Box */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[28px] p-8 px-14 max-w-2xl mx-auto text-center shadow-2xl relative overflow-hidden group hover:bg-black/50 transition-all">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500" />
            <p className="text-white/90 italic text-base font-medium mb-6 leading-relaxed font-serif">
              "A melhor mensagem é aquela que é entendida com clareza."
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">💡</span>
              <span className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.4em] underline decoration-emerald-500/40 underline-offset-8">Comunicação</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 md:px-12">

      {awbRecords.length === 0 && preRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-950 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm max-w-4xl mx-auto animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-tight text-base">
            <span className="text-amber-500 text-xl">⚠️</span>
            <span>Nenhum apontamento no período.</span>
          </div>
          <button 
            onClick={fetchData}
            className="mt-8 px-8 py-3 bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 border border-primary-500/20"
          >
            Sincronizar Novamente
          </button>
        </div>
      ) : (
        <>
          {/* SEÇÃO AWB */}
      <section className="mb-20">
        <div className="flex items-center gap-4 mb-8 px-4">
           <div className="h-[1px] flex-1 bg-white dark:bg-slate-900" />
           <h2 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.5em] italic">BI: Fluxo em Trânsito (AWB)</h2>
           <div className="h-[1px] flex-1 bg-white dark:bg-slate-900" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ChartCard theme={theme} title="Evolução Semanal" subtitle="Fluxo de Embarques" icon={<TrendingUp size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={awbBI.weekly}>
                    <XAxis dataKey="week" stroke={theme === 'light' ? '#94a3b8' : '#475569'} fontSize={9} hide />
                    <Tooltip {...tooltipStyles} />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#3b82f633" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard theme={theme} title="Top Fornecedores" subtitle="Volume por Parceiro" icon={<Truck size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={awbBI.suppliers} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke={theme === 'light' ? '#334155' : '#94a3b8'} fontSize={8} width={70} />
                    <Tooltip {...tooltipStyles} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard theme={theme} title="Mix de Materiais" subtitle="Natureza da Carga" icon={<Box size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={awbBI.materials} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {awbBI.materials.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard theme={theme} title="Status Críticos" subtitle="Alertas de Atraso" icon={<AlertTriangle size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={awbBI.weekly}>
                    <Tooltip {...tooltipStyles} />
                    <Bar dataKey="delay" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>
        </div>
      </section>

      {/* SEÇÃO PRÉ */}
      <section>
        <div className="flex items-center gap-4 mb-8 px-4">
           <div className={`h-[1px] flex-1 ${theme === 'light' ? 'bg-blue-100' : 'bg-white dark:bg-slate-900'}`} />
           <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">BI: Operação Pré-Embarque (NF'S)</h2>
           <div className={`h-[1px] flex-1 ${theme === 'light' ? 'bg-blue-100' : 'bg-white dark:bg-slate-900'}`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ChartCard theme={theme} title="Agendamentos" subtitle="Frequência Semanal" icon={<Clock size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={preBI.weekly}>
                    <XAxis dataKey="week" hide />
                    <Tooltip {...tooltipStyles} />
                    <Area type="monotone" dataKey="total" stroke="#10b981" fill="#10b98133" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard theme={theme} title="Fornecedores PRÉ" subtitle="Volume Agendado" icon={<Truck size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={preBI.suppliers} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke={theme === 'light' ? '#334155' : '#94a3b8'} fontSize={8} width={70} />
                    <Tooltip {...tooltipStyles} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard theme={theme} title="Tipos de Material" subtitle="Consolidado NF's" icon={<Box size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={preBI.materials} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {preBI.materials.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard theme={theme} title="Share de Marcas" subtitle="Distribuição Operacional" icon={<Package size={16}/>}>
             <div className="h-48 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={preBI.brands} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                      {preBI.brands.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>
        </div>
      </section>
      </>
      )}
      </div>
    </div>
  );
};

export default Reports;


import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MessageSquare, 
  Share2, 
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Download,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Sparkles,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { User, Platform } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { metricsService, analyticsService } from '../services/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white">
        <Icon size={20} />
      </div>
      {change && (
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black uppercase italic px-2 py-1 rounded-lg",
          trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </div>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-zinc-900 dark:text-white italic tracking-tighter">{value}</h3>
    </div>
  </motion.div>
);

const AnalyticsDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>(Platform.Instagram);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metricsRes, analysisRes] = await Promise.all([
          metricsService.getMetricsHistory(user.id, activePlatform),
          analyticsService.getLatestAnalysis(user.id, activePlatform)
        ]);

        if (metricsRes.data) {
          setMetricsHistory(metricsRes.data.reverse());
        }
        if (analysisRes.data) {
          setLatestAnalysis(analysisRes.data);
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, activePlatform]);

  const stats = useMemo(() => {
    const latest = metricsHistory[metricsHistory.length - 1] || {};
    const previous = metricsHistory[metricsHistory.length - 2] || {};

    const calculateChange = (curr: number, prev: number) => {
      if (!prev) return null;
      const change = ((curr - prev) / prev) * 100;
      return {
        text: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
        trend: change >= 0 ? 'up' : 'down'
      };
    };

    const followersChange = calculateChange(latest.followers, previous.followers);
    const engagementChange = calculateChange(latest.engagement_rate, previous.engagement_rate);
    const viewsChange = calculateChange(latest.views, previous.views);

    return [
      { 
        title: 'Visualizações Totais', 
        value: latest.views ? (latest.views >= 1000 ? `${(latest.views / 1000).toFixed(1)}k` : latest.views) : '0', 
        change: viewsChange?.text, 
        icon: Eye, 
        trend: viewsChange?.trend 
      },
      { 
        title: 'Engajamento Médio', 
        value: latest.engagement_rate ? `${latest.engagement_rate}%` : '0%', 
        change: engagementChange?.text, 
        icon: TrendingUp, 
        trend: engagementChange?.trend 
      },
      { 
        title: 'Seguidores Atuais', 
        value: latest.followers ? latest.followers.toLocaleString() : '0', 
        change: followersChange?.text, 
        icon: Users, 
        trend: followersChange?.trend 
      },
      { 
        title: 'Score Viral', 
        value: latestAnalysis?.viral_score || '0', 
        change: null, 
        icon: Sparkles, 
        trend: 'up' 
      },
    ];
  }, [metricsHistory, latestAnalysis]);

  const chartData = useMemo(() => {
    return metricsHistory.map(m => ({
      date: new Date(m.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      views: m.views || 0,
      engagement: (m.engagement_rate || 0) * 100, // Scale for visibility
      followers: m.followers || 0
    }));
  }, [metricsHistory]);

  const contentMix = useMemo(() => {
    if (!latestAnalysis?.best_format) return [
      { name: 'Reels', value: 100, color: '#facc15' }
    ];
    
    // Simple mock mix based on best format for now
    return [
      { name: latestAnalysis.best_format, value: 60, color: '#facc15' },
      { name: 'Outros', value: 40, color: '#a1a1aa' },
    ];
  }, [latestAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white italic tracking-tighter uppercase leading-none mb-2">
            Analytics <span className="text-yellow-400">Dashboard</span>
          </h1>
          <p className="text-zinc-500 font-bold text-sm italic">Performance e métricas de crescimento para {user.name}</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={activePlatform}
            onChange={(e) => setActivePlatform(e.target.value as Platform)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-yellow-400"
          >
            {Object.values(Platform).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 flex gap-1">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  timeRange === range 
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {metricsHistory.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-12 text-center space-y-4">
          <BarChartIcon size={48} className="mx-auto text-zinc-300" />
          <h3 className="text-xl font-black italic uppercase">Nenhum dado encontrado</h3>
          <p className="text-zinc-500 text-sm font-bold italic">Realize uma auditoria na página de Performance para começar a coletar métricas.</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Engagement Chart */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-400/10 text-yellow-400 rounded-xl">
                    <TrendingUp size={18} />
                  </div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white italic uppercase tracking-tight">Tendência de Visualizações</h3>
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #27272a', 
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#facc15" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorViews)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Content Mix Pie Chart */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl">
                  <PieChartIcon size={18} />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white italic uppercase tracking-tight">Mix de Conteúdo</h3>
              </div>

              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentMix}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {contentMix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #27272a', 
                        borderRadius: '12px',
                        fontSize: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Total</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-white italic">100%</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {contentMix.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-zinc-900 dark:text-white italic">{item.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Grid: Insights */}
          <div className="grid grid-cols-1 gap-8">
            {/* Audience Insights */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl">
                  <Users size={18} />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white italic uppercase tracking-tight">Insights Estratégicos</h3>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-yellow-400/5 border border-yellow-400/20 rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={20} className="text-yellow-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400 italic">Diagnóstico da Engine Road</p>
                  </div>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                    {latestAnalysis?.diagnostic?.content_strategy_advice || "Realize uma auditoria para obter insights estratégicos personalizados."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Melhor Formato</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-white italic">{latestAnalysis?.best_format || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Frequência Sugerida</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-white italic">{latestAnalysis?.frequency_suggestion || "N/A"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;

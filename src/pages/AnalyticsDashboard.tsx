import React, { useState, useMemo } from 'react';
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
  Sparkles
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
import { User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data
const ENGAGEMENT_DATA = [
  { date: '01/05', views: 1200, engagement: 450, shares: 120 },
  { date: '02/05', views: 1900, engagement: 600, shares: 180 },
  { date: '03/05', views: 1500, engagement: 520, shares: 140 },
  { date: '04/05', views: 2400, engagement: 850, shares: 210 },
  { date: '05/05', views: 3100, engagement: 1100, shares: 320 },
  { date: '06/05', views: 2800, engagement: 980, shares: 280 },
  { date: '07/05', views: 3500, engagement: 1300, shares: 410 },
];

const CONTENT_MIX = [
  { name: 'Reels', value: 45, color: '#facc15' },
  { name: 'Carrossel', value: 30, color: '#a1a1aa' },
  { name: 'Estático', value: 15, color: '#52525b' },
  { name: 'Stories', value: 10, color: '#27272a' },
];

const TOP_CONTENT = [
  { id: 1, title: '5 Dicas de Growth Hacking', type: 'Reels', views: '45.2k', engagement: '12.4%', date: '2 dias atrás' },
  { id: 2, title: 'Como usei IA para escalar', type: 'Carrossel', views: '32.1k', engagement: '8.7%', date: '5 dias atrás' },
  { id: 3, title: 'A verdade sobre o algoritmo', type: 'Reels', views: '28.5k', engagement: '15.2%', date: '1 semana atrás' },
  { id: 4, title: 'Checklist de Postagem', type: 'Estático', views: '12.4k', engagement: '5.1%', date: '2 semanas atrás' },
];

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
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-black uppercase italic px-2 py-1 rounded-lg",
        trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
      )}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-zinc-900 dark:text-white italic tracking-tighter">{value}</h3>
    </div>
  </motion.div>
);

const AnalyticsDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [timeRange, setTimeRange] = useState('7d');

  const stats = useMemo(() => [
    { title: 'Visualizações Totais', value: '145.2k', change: '+12.5%', icon: Eye, trend: 'up' },
    { title: 'Engajamento Médio', value: '8.4%', change: '+2.1%', icon: TrendingUp, trend: 'up' },
    { title: 'Novos Seguidores', value: '1.240', change: '-3.2%', icon: Users, trend: 'down' },
    { title: 'Compartilhamentos', value: '3.842', change: '+18.7%', icon: Share2, trend: 'up' },
  ], []);

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
          <button className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

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
              <h3 className="text-lg font-black text-zinc-900 dark:text-white italic uppercase tracking-tight">Tendência de Engajamento</h3>
            </div>
            <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ENGAGEMENT_DATA}>
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
                <Area 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#a1a1aa" 
                  strokeWidth={2}
                  fill="transparent"
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
                  data={CONTENT_MIX}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CONTENT_MIX.map((entry, index) => (
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
            {CONTENT_MIX.map((item, i) => (
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

      {/* Bottom Grid: Top Content & Audience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl">
                <BarChartIcon size={18} />
              </div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white italic uppercase tracking-tight">Top Conteúdos</h3>
            </div>
            <button className="text-[10px] font-black uppercase text-yellow-600 dark:text-yellow-400 hover:underline">Ver Todos</button>
          </div>

          <div className="space-y-4">
            {TOP_CONTENT.map((content) => (
              <div key={content.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-yellow-400 transition-colors">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white italic leading-tight mb-1">{content.title}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{content.type}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">•</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{content.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-zinc-900 dark:text-white italic">{content.views}</p>
                  <p className="text-[9px] font-black uppercase text-emerald-500">{content.engagement} eng.</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

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
            <h3 className="text-lg font-black text-zinc-900 dark:text-white italic uppercase tracking-tight">Insights de Audiência</h3>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-yellow-400/5 border border-yellow-400/20 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={20} className="text-yellow-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400 italic">Dica da Engine Road</p>
              </div>
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                Seu público está mais ativo entre <span className="text-zinc-900 dark:text-white font-black">18:00 e 21:00</span>. 
                Postagens de <span className="text-zinc-900 dark:text-white font-black">Reels educativos</span> tiveram 40% mais retenção nesta semana.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Gênero Predominante</p>
                <p className="text-lg font-black text-zinc-900 dark:text-white italic">Feminino (64%)</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Faixa Etária</p>
                <p className="text-lg font-black text-zinc-900 dark:text-white italic">25-34 anos</p>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Sentimento da Audiência</span>
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Positivo (92%)</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

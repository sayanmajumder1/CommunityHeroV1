import React from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar
} from 'recharts';
import { toast } from 'react-hot-toast';

export default function AdminAnalyticsCenter() {
  
  const dailyReportData = [
    { day: 'Mon', reports: 12, resolved: 8 },
    { day: 'Tue', reports: 19, resolved: 14 },
    { day: 'Wed', reports: 15, resolved: 12 },
    { day: 'Thu', reports: 22, resolved: 18 },
    { day: 'Fri', reports: 30, resolved: 25 },
    { day: 'Sat', reports: 18, resolved: 16 },
    { day: 'Sun', reports: 10, resolved: 9 }
  ];

  const categoryShareData = [
    { name: 'Potholes', count: 42 },
    { name: 'Water Leak', count: 28 },
    { name: 'Lights Damaged', count: 34 },
    { name: 'Waste Heap', count: 50 },
    { name: 'Sewers Blocked', count: 21 }
  ];

  const runRebuild = () => {
    toast.loading('Rebuilding system analytical models...');
    setTimeout(() => {
      toast.success('Analytics cube successfully updated!');
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left font-sans" id="admin-analytics-workspace">
      
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Business Intelligence & Analytics Cube</h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold">Examine city incident trajectories, average SLA response latencies, and contribution thresholds.</p>
        </div>

        <button
          onClick={runRebuild}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Cube Model</span>
        </button>
      </div>

      {/* Numerical grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { name: 'Mean Response SLA', value: '4.2 Hours', change: '-12.4% from last week', trend: 'down' },
          { name: 'Citizen Participation Rate', value: '78.4%', change: '+4.2% from last week', trend: 'up' },
          { name: 'AI Prediction Precision', value: '96.4%', change: '+1.1% from last week', trend: 'up' }
        ].map((metric, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{metric.name}</span>
            <p className="text-xl font-black text-slate-900 mt-1">{metric.value}</p>
            <span className={`text-[10px] font-bold block mt-1.5 ${metric.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {metric.change}
            </span>
          </div>
        ))}
      </div>

      {/* Chart visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily reports area chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase">Civic Incident Volume & Resolutions</h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyReportData}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                <Area type="monotone" dataKey="reports" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorReports)" name="Reports Filed" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase">Incidents by Category</h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={categoryShareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} name="Report Count" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

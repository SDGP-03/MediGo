import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Brush 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, Clock, MapPin, DollarSign, Activity, Ambulance, CheckCircle2 
} from 'lucide-react';

export function Analytics() {
  const navigate = useNavigate();

  // Existing Data
  const responseTimeData = [
    { month: 'Jan', avgTime: 8.2 },
    { month: 'Feb', avgTime: 7.8 },
    { month: 'Mar', avgTime: 7.1 },
    { month: 'Apr', avgTime: 6.9 },
    { month: 'May', avgTime: 6.5 },
    { month: 'Jun', avgTime: 6.2 },
  ];

  const incidentTypeData = [
    { name: 'Cardiac', value: 145, color: '#ef4444' },
    { name: 'Trauma', value: 218, color: '#f97316' },
    { name: 'Respiratory', value: 89, color: '#eab308' },
    { name: 'Stroke', value: 67, color: '#22c55e' },
    { name: 'Other', value: 156, color: '#3b82f6' },
  ];

  const demandAreasData = [
    { area: 'Central District', requests: 342 },
    { area: 'North Zone', requests: 289 },
    { area: 'East Sector', requests: 256 },
    { area: 'South Area', requests: 198 },
    { area: 'West Region', requests: 167 },
  ];

  const operationalStats = [
    {
      label: 'Total Requests',
      value: '2,847',
      change: '+12.5%',
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-500'
    },
    {
      label: 'Active Ambulances',
      value: '156',
      change: '+8.2%',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-500',
      isLive: true // Flag for the pulsing indicator
    },
    {
      label: 'Avg Response Time',
      value: '6.2 min',
      change: '-15.3%',
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-500'
    },
    {
      label: 'Total Transfers (Month)',
      value: '1234',
      change: '+4.1%',
      icon: Ambulance,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-500'
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header with Live Status Indicator */}
      <div className="bg-card rounded-lg shadow-md p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-foreground">Analytics & Insights</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
               <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Data-driven insights for operational improvements
          </p>
        </div>
        <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg border border-border">
          Last Sync: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Operational Stats with logic-colored changes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {operationalStats.map((stat, index) => {
          const isResponseTime = stat.label.includes('Time');
          const isPositiveChange = stat.change.startsWith('+');
          const isGoodNews = isResponseTime ? !isPositiveChange : isPositiveChange;

          return (
            <div key={index} className={`bg-card rounded-lg shadow-md p-6 border-l-4 ${stat.borderColor}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={stat.color} size={24} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  isGoodNews ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-bold mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                {stat.isLive && <span className="text-[10px] text-green-500 animate-pulse">ACTIVE NOW</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Response Time Trend with Target Goal and Brush */}
      <div className="bg-card rounded-lg shadow-md p-6 border border-border/50">
        <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
          Average Response Time Trend <TrendingUp size={18} className="text-blue-500" />
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={responseTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{fill: '#888'}} axisLine={false} />
            <YAxis tick={{fill: '#888'}} axisLine={false} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: {fontWeight: 'bold'} }} />
            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            <ReferenceLine y={6.5} label={{ position: 'right', value: 'Goal', fill: '#22c55e', fontSize: 12 }} stroke="#22c55e" strokeDasharray="5 5" />
            <Line 
              type="monotone" 
              dataKey="avgTime" 
              stroke="#ef4444" 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#ef4444', strokeWidth: 2 }} 
              activeDot={{ r: 8 }}
              name="Avg Response Time" 
            />
            <Brush dataKey="month" height={30} stroke="#cbd5e1" fill="#f8fafc" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={20} />
          <p className="text-green-800 dark:text-green-200 text-sm">
            ✓ <strong>Performance Win:</strong> Response time has improved by 15.3% through optimized dispatching.
          </p>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Types as a Donut Chart */}
        <div className="bg-card rounded-lg shadow-md p-6 border border-border/50">
          <h3 className="text-foreground font-bold mb-4">Incident Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incidentTypeData}
                cx="50%"
                cy="50%"
                innerRadius={70} // Changed to donut
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {incidentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {incidentTypeData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 bg-secondary/30 p-2 rounded">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-muted-foreground text-xs font-medium">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours Analysis */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-foreground font-bold mb-4">Transfer Request Peak Hours</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { time: '6-9 AM', label: 'Morning Rush', val: '23%', bg: 'bg-blue-50', text: 'text-blue-600' },
              { time: '9AM-12PM', label: 'Low Activity', val: '15%', bg: 'bg-green-50', text: 'text-green-600' },
              { time: '12-6 PM', label: 'Afternoon Peak', val: '38%', bg: 'bg-orange-50', text: 'text-orange-600' },
              { time: '6PM-12AM', label: 'Evening Rush', val: '24%', bg: 'bg-purple-50', text: 'text-purple-600' }
            ].map((slot, i) => (
              <div key={i} className={`flex items-center justify-between p-4 ${slot.bg} dark:bg-opacity-10 rounded-xl border border-border/20`}>
                <div>
                  <p className={`text-lg font-black ${slot.text}`}>{slot.time}</p>
                  <p className="text-xs text-muted-foreground">{slot.label}</p>
                </div>
                <p className="text-sm font-bold text-foreground">{slot.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High Demand Areas with Gradient Bars */}
      <div className="bg-card rounded-lg shadow-md p-6 border border-border/50">
        <h3 className="text-foreground mb-4 font-bold">High Demand Areas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={demandAreasData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="area" type="category" width={120} axisLine={false} tickLine={false} />
            <Tooltip cursor={{fill: 'transparent'}} />
            <Bar dataKey="requests" radius={[0, 5, 5, 0]}>
               {demandAreasData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#22c55e" fillOpacity={1 - index * 0.15} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-900/30">
          <MapPin className="text-blue-600 shrink-0" size={18} />
          <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
            <strong>Deployment Suggestion:</strong> Central District remains the highest demand area. Consider repositioning standby units from the West Region during peak afternoon hours.
          </p>
        </div>
      </div>

      {/* Hospital Load Distribution */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h3 className="text-foreground font-bold mb-4">Live Hospital Load Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "National Hospital", pct: 35, color: "bg-green-500", border: "border-green-500" },
            { name: "Teaching Hospital", pct: 68, color: "bg-yellow-500", border: "border-yellow-500" },
            { name: "General Hospital", pct: 87, color: "bg-red-500", border: "border-red-500" }
          ].map((hosp, i) => (
            <div key={i} className={`border-l-4 ${hosp.border} pl-4 py-1`}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-foreground font-bold text-sm">{hosp.name}</p>
                <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">{hosp.pct}%</span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-2">
                <div className={`${hosp.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${hosp.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/transfer')}
        className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-red-700 transition-all hover:scale-105 active:scale-95 z-50 flex items-center gap-3 group font-bold"
        title="New Transfer Request"
      >
        <Ambulance size={24} />
        <span>New Request</span>
      </button>
    </div>
  );
}
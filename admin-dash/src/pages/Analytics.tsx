import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Clock, MapPin, DollarSign, Activity, Ambulance } from 'lucide-react';

export function Analytics() {
  const navigate = useNavigate();
  // Response time data
  const responseTimeData = [
    { month: 'Jan', avgTime: 8.2 },
    { month: 'Feb', avgTime: 7.8 },
    { month: 'Mar', avgTime: 7.1 },
    { month: 'Apr', avgTime: 6.9 },
    { month: 'May', avgTime: 6.5 },
    { month: 'Jun', avgTime: 6.2 },
  ];

  // Incident types distribution
  const incidentTypeData = [
    { name: 'Cardiac', value: 145, color: '#ef4444' },
    { name: 'Trauma', value: 218, color: '#f97316' },
    { name: 'Respiratory', value: 89, color: '#eab308' },
    { name: 'Stroke', value: 67, color: '#22c55e' },
    { name: 'Other', value: 156, color: '#3b82f6' },
  ];



  // High demand areas
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

    },
    {
      label: 'Active Ambulances',
      value: '156',
      change: '+8.2%',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Avg Response Time',
      value: '6.2 min',
      change: '-15.3%',
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Total Transfers (Month)',
      value: '1234',
      change: '-15.3%',
      icon: Ambulance,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },

  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-foreground mb-2">Analytics & Insights</h2>
        <p className="text-muted-foreground">
          Data-driven insights for operational improvements
        </p>
      </div>

      {/* Operational Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {operationalStats.map((stat, index) => (
          <div key={index} className="bg-card rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-bold mb-1">{stat.label}</p>
            <p className={`${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Response Time Trend */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h3 className="text-foreground mb-4">Average Response Time Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={responseTimeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgTime"
              stroke="#ef4444"
              strokeWidth={3}
              name="Avg Response Time"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-green-800 dark:text-green-200">
            ✓ Response time has improved by 15.3% over the last 6 months through optimized dispatching
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Types Distribution */}
        <div className="bg-card rounded-lg shadow-md p-6">
          <h3 className="text-foreground font-bold mb-4">Incident Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incidentTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {incidentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {incidentTypeData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-muted-foreground text-sm">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Peak Hours Analysis */}
        {/* Peak Hours Analysis */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-foreground font-bold mb-4">Transfer Request Peak Hours</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">6-9 AM</p>
                <p className="text-sm text-muted-foreground">Morning Rush</p>
              </div>
              <p className="text-sm font-semibold text-foreground">23% of transfers</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">9AM-12PM</p>
                <p className="text-sm text-muted-foreground">Low Activity</p>
              </div>
              <p className="text-sm font-semibold text-foreground">15% of transfers</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">12-6 PM</p>
                <p className="text-sm text-muted-foreground">Afternoon Peak</p>
              </div>
              <p className="text-sm font-semibold text-foreground">38% of transfers</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">6PM-12AM</p>
                <p className="text-sm text-muted-foreground">Evening Rush</p>
              </div>
              <p className="text-sm font-semibold text-foreground">24% of transfers</p>
            </div>
          </div>
        </div>
      </div>

      {/* High Demand Areas */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h3 className="text-foreground mb-4">High Demand Areas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={demandAreasData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="area" type="category" width={120} />
            <Tooltip />
            <Legend />
            <Bar dataKey="requests" fill="#22c55e" name="Total Requests" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200">
            <MapPin className="inline mr-2" size={16} />
            Central District shows highest demand - consider deploying more ambulances to this area
          </p>
        </div>
      </div>
      {/* Hospital Load Distribution */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h3 className="text-foreground font-bold mb-4">Hospital Load Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">Which hospitals receive most transfers?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-foreground font-semibold">National Hospital</p>
            <div className="mt-2 flex items-center">
              <div className="flex-1 bg-secondary rounded-full h-2 mr-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">35% transfers</span>
            </div>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="text-foreground font-semibold">Teaching Hospital</p>
            <div className="mt-2 flex items-center">
              <div className="flex-1 bg-secondary rounded-full h-2 mr-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">68% transfers</span>
            </div>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-foreground font-semibold">General Hospital</p>
            <div className="mt-2 flex items-center">
              <div className="flex-1 bg-secondary rounded-full h-2 mr-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">87% transfers</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/transfer')}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 z-50 flex items-center gap-2 group"
        title="New Transfer Request"
      >
        <Ambulance size={24} />
        <span className="hidden group-hover:block transition-all duration-300">New Request</span>
      </button>
    </div>
  );
}

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, MapPin, Activity, Ambulance, Loader2, TrendingDown } from 'lucide-react';
import { useAnalyticsData } from '../hooks/useAnalyticsData';

export function Analytics() {
  const navigate = useNavigate();
  const data = useAnalyticsData();

  // Show a loading spinner while Firebase data is being fetched
  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
        <span className="text-lg">Loading analytics data...</span>
      </div>
    );
  }

  // ── Stats Cards ──────────────────────────────────────────────────────────────
  const operationalStats = [
    {
      label: 'Total Requests',
      value: data.totalRequests.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Active Ambulances',
      value: data.activeAmbulances.toString(),
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Avg Response Time',
      value: data.avgResponseTimeMinutes !== null
        ? `${data.avgResponseTimeMinutes} min`
        : 'No data yet',
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Transfers This Month',
      value: data.totalTransfersThisMonth.toLocaleString(),
      icon: Ambulance,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  // ── Demand Areas Bar Chart ───────────────────────────────────────────────────
  const demandAreasData = data.demandAreasData.length > 0
    ? data.demandAreasData
    : [{ area: 'No data yet', requests: 0 }];

  // ── Incident Types Pie Chart ─────────────────────────────────────────────────
  const incidentTypeData = data.incidentTypeData.length > 0
    ? data.incidentTypeData
    : [{ name: 'No data', value: 1, color: '#94a3b8' }];

  // ── Hospital Load ────────────────────────────────────────────────────────────
  const hospitalLoadData = data.hospitalLoadData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-foreground mb-2">Analytics &amp; Insights</h2>
        <p className="text-muted-foreground">
          Live data-driven insights from your Firebase database
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
              {/* Live badge */}
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                Live
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-bold mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Average Response Time Trend ─────────────────────────────────── */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-foreground font-bold">Average Response Time Trend</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Time from request creation to driver acceptance &mdash; grouped by month
            </p>
          </div>
          {data.avgResponseTimeMinutes !== null && (
            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full text-sm font-semibold">
              <TrendingDown size={15} />
              Overall avg: {data.avgResponseTimeMinutes} min
            </div>
          )}
        </div>

        {/* If no months have data yet, show a friendly empty state */}
        {data.responseTimeTrend.every(p => p.avgTime === null) ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
            <Clock size={36} className="opacity-30" />
            <p className="text-sm text-center max-w-xs">
              No accepted transfers yet. Once a driver accepts a request, response times will appear here.
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data.responseTimeTrend}
                margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft', offset: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number | null) =>
                    value !== null ? [`${value} min`, 'Avg Response Time'] : ['No data', 'Avg Response Time']
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgTime"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Avg Response Time"
                  dot={{ r: 5, fill: '#ef4444' }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-orange-800 dark:text-orange-200 text-sm">
                <Clock className="inline mr-2" size={15} />
                Response time is measured from when the request is created to when the driver accepts it.
                Months with no accepted transfers are shown as gaps in the line.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Types Distribution */}
        <div className="bg-card rounded-lg shadow-md p-6">
          <h3 className="text-foreground font-bold mb-1">Transfer Request Priority Breakdown</h3>
          <p className="text-muted-foreground text-sm mb-4">Grouped by priority level from real requests</p>
          <ResponsiveContainer width="100%" height={280}>
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
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-foreground font-bold mb-1">Transfer Request Peak Hours</h3>
          <p className="text-muted-foreground text-sm mb-4">Computed from request submission times</p>
          <div className="space-y-3">
            {data.peakHoursData.map((bucket, i) => (
              <div key={i} className={`flex items-center justify-between p-4 ${bucket.color} rounded-lg`}>
                <div>
                  <p className={`text-lg font-bold ${bucket.textColor}`}>{bucket.label}</p>
                  <p className="text-sm text-muted-foreground">{bucket.description}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{bucket.percent}% of transfers</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Transfer Destinations */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h3 className="text-foreground mb-1">Top Patient Transfer Destinations</h3>
        <p className="text-muted-foreground text-sm mb-4">Hospitals receiving the most incoming patient transfers</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={demandAreasData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="area" type="category" width={160} />
            <Tooltip />
            <Legend />
            <Bar dataKey="requests" fill="#22c55e" name="Transfers Received" />
          </BarChart>
        </ResponsiveContainer>
        {data.demandAreasData.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">
              <MapPin className="inline mr-2" size={16} />
              <strong>{data.demandAreasData[0].area}</strong> is the most frequent transfer destination ({data.demandAreasData[0].requests} transfers received)
            </p>
          </div>
        )}
      </div>

      {/* Hospital Load Distribution */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h3 className="text-foreground font-bold mb-1">Hospital Load Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">Which hospitals receive the most transfers (relative to highest)</p>
        {hospitalLoadData.length === 0 ? (
          <p className="text-muted-foreground text-sm">No destination data yet. Once transfers are submitted, this will populate automatically.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hospitalLoadData.map((hospital, i) => (
              <div key={i} className={`border-l-4 ${hospital.borderColor} pl-4`}>
                <p className="text-foreground font-semibold">{hospital.name}</p>
                <div className="mt-2 flex items-center">
                  <div className="flex-1 bg-secondary rounded-full h-2 mr-2">
                    <div
                      className={`${hospital.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${hospital.percent}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{hospital.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Transfer Button */}
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

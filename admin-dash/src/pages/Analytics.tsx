import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, MapPin, DollarSign, Activity } from 'lucide-react';

export function Analytics() {
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active Ambulances',
      value: '156',
      change: '+8.2%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Avg Response Time',
      value: '6.2 min',
      change: '-15.3%',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Revenue (Private)',
      value: '₹8.4L',
      change: '+22.1%',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-gray-900 mb-2">Analytics & Insights</h2>
        <p className="text-gray-600">
          Data-driven insights for operational improvements
        </p>
      </div>

      {/* Operational Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {operationalStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className={`${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Response Time Trend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Average Response Time Trend</h3>
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
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">
            ✓ Response time has improved by 15.3% over the last 6 months through optimized dispatching
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Types Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Incident Types Distribution</h3>
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
                <span className="text-gray-700 text-sm">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Peak Hours Analysis */}
        {/* Peak Hours Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Transfer Request Peak Hours</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-lg font-bold text-blue-600">6-9 AM</p>
                <p className="text-sm text-gray-600">Morning Rush</p>
              </div>
              <p className="text-sm font-semibold text-gray-700">23% of transfers</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-lg font-bold text-green-600">9AM-12PM</p>
                <p className="text-sm text-gray-600">Low Activity</p>
              </div>
              <p className="text-sm font-semibold text-gray-700">15% of transfers</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-lg font-bold text-orange-600">12-6 PM</p>
                <p className="text-sm text-gray-600">Afternoon Peak</p>
              </div>
              <p className="text-sm font-semibold text-gray-700">38% of transfers</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-lg font-bold text-purple-600">6PM-12AM</p>
                <p className="text-sm text-gray-600">Evening Rush</p>
              </div>
              <p className="text-sm font-semibold text-gray-700">24% of transfers</p>
            </div>
          </div>
        </div>
      </div>

      {/* High Demand Areas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">High Demand Areas</h3>
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
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            <MapPin className="inline mr-2" size={16} />
            Central District shows highest demand - consider deploying more ambulances to this area
          </p>
        </div>
      </div>

      {/* Operational Outcomes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Operational Outcomes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-gray-900 mb-3">For Ambulance Providers</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <TrendingUp className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="text-gray-900">Higher Efficiency</p>
                  <p className="text-gray-600 text-sm">
                    Smart filters reduce idle time, increasing trips per day by 23%
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="text-blue-600 mt-1" size={20} />
                <div>
                  <p className="text-gray-900">More Visibility</p>
                  <p className="text-gray-600 text-sm">
                    Users easily find services, boosting usage by 34%
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <DollarSign className="text-purple-600 mt-1" size={20} />
                <div>
                  <p className="text-gray-900">Revenue Growth</p>
                  <p className="text-gray-600 text-sm">
                    Private providers see 22% increase in bookings
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-gray-900 mb-3">For Public Health</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Activity className="text-red-600 mt-1" size={20} />
                <div>
                  <p className="text-gray-900">Better Coverage</p>
                  <p className="text-gray-600 text-sm">
                    Public and private ambulances work together seamlessly
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="text-orange-600 mt-1" size={20} />
                <div>
                  <p className="text-gray-900">Transparency</p>
                  <p className="text-gray-600 text-sm">
                    Clear tracking of response times and performance metrics
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="text-gray-900">Improved Access</p>
                  <p className="text-gray-600 text-sm">
                    Both urban and rural areas benefit from reliable services
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Insights Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Key Data Insights</h3>
        <div className="space-y-2">
          <p className="text-gray-700">
            • <strong>Optimized Dispatching:</strong> System automatically redirects urgent cases to the closest available service, reducing response time by 15.3%
          </p>
          <p className="text-gray-700">
            • <strong>Real-time Resource Management:</strong> Hospitals and providers see fleet availability in real time
          </p>
          <p className="text-gray-700">
            • <strong>Reduced Delays:</strong> Filtering by proximity, sector, and availability eliminates wasted time
          </p>
          <p className="text-gray-700">
            • <strong>Efficient Categorization:</strong> Helps prioritize emergencies vs. non-critical transport
          </p>
          <p className="text-gray-700">
            • <strong>Data-Driven Decisions:</strong> Collected data enables continuous operational improvements
          </p>
        </div>
      </div>
    </div>
  );
}

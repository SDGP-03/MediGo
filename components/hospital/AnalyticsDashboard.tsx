import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function AnalyticsDashboard() {
  const transferTimeData = [
    { month: 'Jun', avgTime: 45 },
    { month: 'Jul', avgTime: 42 },
    { month: 'Aug', avgTime: 38 },
    { month: 'Sep', avgTime: 35 },
    { month: 'Oct', avgTime: 33 },
    { month: 'Nov', avgTime: 32 },
  ];

  const weeklyTransfersData = [
    { day: 'Mon', transfers: 12 },
    { day: 'Tue', transfers: 15 },
    { day: 'Wed', transfers: 10 },
    { day: 'Thu', transfers: 18 },
    { day: 'Fri', transfers: 16 },
    { day: 'Sat', transfers: 8 },
    { day: 'Sun', transfers: 6 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="text-green-600" size={24} />
            <span className="text-green-600 text-sm">-29% ↓</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Avg Transfer Time</p>
          <p className="text-gray-900">32 mins</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="text-blue-600" size={24} />
            <span className="text-blue-600 text-sm">+15% ↑</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Successful Transfers</p>
          <p className="text-gray-900">98.5%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="text-purple-600" size={24} />
            <span className="text-purple-600 text-sm">-42% ↓</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Avg Wait Time</p>
          <p className="text-gray-900">8 mins</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="text-orange-600" size={24} />
            <span className="text-orange-600 text-sm">-65% ↓</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Documentation Delays</p>
          <p className="text-gray-900">2.1%</p>
        </div>
      </div>

      {/* Transfer Time Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Average Transfer Time Trend (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={transferTimeData}>
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
              name="Avg Transfer Time (mins)"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">
            ✓ Transfer time reduced by 29% since implementing automated protocols and pre-arrival notifications
          </p>
        </div>
      </div>

      {/* Weekly Transfers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Weekly Transfer Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyTransfersData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="transfers" fill="#3b82f6" name="Number of Transfers" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Problem Solutions Impact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-6">System Solutions & Impact</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-gray-900 mb-2">Real-Time Ambulance Tracking</h4>
            <p className="text-gray-600 text-sm mb-2">
              Live dashboard shows availability and operational status for each hospital
            </p>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-green-800 text-sm">
                <strong>Impact:</strong> 85% reduction in ambulance unavailability issues
              </p>
            </div>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-gray-900 mb-2">Inter-Hospital Request System</h4>
            <p className="text-gray-600 text-sm mb-2">
              Integrated protocol management eliminates external service delays
            </p>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-blue-800 text-sm">
                <strong>Impact:</strong> 67% faster request processing, zero protocol violations
              </p>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="text-gray-900 mb-2">Pre-Arrival Notification System</h4>
            <p className="text-gray-600 text-sm mb-2">
              Automatic patient details and ETA sent to receiving hospital
            </p>
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-purple-800 text-sm">
                <strong>Impact:</strong> 78% reduction in handover delays, better unit preparation
              </p>
            </div>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="text-gray-900 mb-2">Centralized Digital Patient Records</h4>
            <p className="text-gray-600 text-sm mb-2">
              Complete patient data securely shared between hospitals
            </p>
            <div className="bg-orange-50 p-3 rounded">
              <p className="text-orange-800 text-sm">
                <strong>Impact:</strong> 92% improvement in care coordination, 65% fewer errors
              </p>
            </div>
          </div>

          <div className="border-l-4 border-pink-500 pl-4">
            <h4 className="text-gray-900 mb-2">Route & Patient Management</h4>
            <p className="text-gray-600 text-sm mb-2">
              Tracks transfers and manages multiple pickups efficiently
            </p>
            <div className="bg-pink-50 p-3 rounded">
              <p className="text-pink-800 text-sm">
                <strong>Impact:</strong> 100% on-time completion for original transfers
              </p>
            </div>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="text-gray-900 mb-2">Gender-Based Attendant Matching</h4>
            <p className="text-gray-600 text-sm mb-2">
              Automatic attendant assignment according to patient gender
            </p>
            <div className="bg-indigo-50 p-3 rounded">
              <p className="text-indigo-800 text-sm">
                <strong>Impact:</strong> 100% protocol compliance, improved patient comfort
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall System Performance */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200 p-6">
        <h3 className="text-gray-900 mb-4">Overall System Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 text-sm mb-1">System Uptime</p>
            <p className="text-green-600">99.8%</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">User Satisfaction</p>
            <p className="text-blue-600">4.8/5.0</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Active Users</p>
            <p className="text-purple-600">247 staff members</p>
          </div>
        </div>
      </div>
    </div>
  );
}

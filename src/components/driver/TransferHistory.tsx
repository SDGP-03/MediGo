import { Calendar, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function TransferHistory() {
  const transfers = [
    {
      id: 'TR-2398',
      date: '2025-11-21',
      time: '11:45 AM',
      patient: 'Michael Brown',
      from: 'Rural Health Center',
      to: 'City General Hospital',
      distance: 15.2,
      duration: '28 mins',
      status: 'completed',
      priority: 'urgent',
    },
    {
      id: 'TR-2395',
      date: '2025-11-21',
      time: '09:20 AM',
      patient: 'Lisa Anderson',
      from: 'City General Hospital',
      to: 'Specialist Care Hospital',
      distance: 12.8,
      duration: '25 mins',
      status: 'completed',
      priority: 'standard',
    },
    {
      id: 'TR-2392',
      date: '2025-11-21',
      time: '07:15 AM',
      patient: 'Robert Wilson',
      from: 'Divisional Hospital North',
      to: 'Central Medical Center',
      distance: 18.5,
      duration: '35 mins',
      status: 'completed',
      priority: 'critical',
    },
    {
      id: 'TR-2378',
      date: '2025-11-20',
      time: '04:30 PM',
      patient: 'Emma Thompson',
      from: 'City General Hospital',
      to: 'Regional Base Hospital',
      distance: 22.3,
      duration: '42 mins',
      status: 'completed',
      priority: 'urgent',
    },
    {
      id: 'TR-2375',
      date: '2025-11-20',
      time: '02:10 PM',
      patient: 'James Martinez',
      from: 'Teaching Hospital East',
      to: 'City General Hospital',
      distance: 9.7,
      duration: '18 mins',
      status: 'completed',
      priority: 'standard',
    },
    {
      id: 'TR-2370',
      date: '2025-11-20',
      time: '10:45 AM',
      patient: 'Patricia Davis',
      from: 'Divisional Hospital South',
      to: 'Central Medical Center',
      distance: 16.2,
      duration: '32 mins',
      status: 'completed',
      priority: 'urgent',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const todayTransfers = transfers.filter(t => t.date === '2025-11-21');
  const yesterdayTransfers = transfers.filter(t => t.date === '2025-11-20');

  return (
    <div className="p-4 space-y-4">
      {/* Summary Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <h3 className="text-gray-900 mb-4">Transfer Statistics</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded-xl text-center">
            <p className="text-2xl text-blue-600 mb-1">6</p>
            <p className="text-gray-600 text-xs">Last 2 Days</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl text-center">
            <p className="text-2xl text-green-600 mb-1">94.7</p>
            <p className="text-gray-600 text-xs">Total km</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-center">
            <p className="text-2xl text-purple-600 mb-1">180</p>
            <p className="text-gray-600 text-xs">Minutes</p>
          </div>
        </div>
      </div>

      {/* Today's Transfers */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-gray-600" size={20} />
          <h3 className="text-gray-900">Today - November 21, 2025</h3>
        </div>
        <div className="space-y-3">
          {todayTransfers.map((transfer) => (
            <div key={transfer.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-gray-900">{transfer.patient}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(transfer.priority)}`}>
                      {transfer.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{transfer.id} • {transfer.time}</p>
                </div>
                <CheckCircle className="text-green-600" size={20} />
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">{transfer.from}</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">{transfer.to}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{transfer.distance} km</span>
                  <span>•</span>
                  <span>{transfer.duration}</span>
                </div>
                <button className="text-blue-600 text-sm">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yesterday's Transfers */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-gray-600" size={20} />
          <h3 className="text-gray-900">Yesterday - November 20, 2025</h3>
        </div>
        <div className="space-y-3">
          {yesterdayTransfers.map((transfer) => (
            <div key={transfer.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-gray-900">{transfer.patient}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(transfer.priority)}`}>
                      {transfer.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{transfer.id} • {transfer.time}</p>
                </div>
                <CheckCircle className="text-green-600" size={20} />
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">{transfer.from}</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">{transfer.to}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{transfer.distance} km</span>
                  <span>•</span>
                  <span>{transfer.duration}</span>
                </div>
                <button className="text-blue-600 text-sm">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Badge */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl p-6 shadow-lg text-center">
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-white mb-2">Excellent Performance!</h3>
        <p className="text-green-100 text-sm mb-4">
          6 successful transfers • 100% on-time delivery
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div>
            <p className="text-green-100 mb-1">Avg Rating</p>
            <p className="text-white">4.9/5.0</p>
          </div>
          <div className="w-px h-10 bg-white bg-opacity-20"></div>
          <div>
            <p className="text-green-100 mb-1">Response Time</p>
            <p className="text-white">&lt; 5 mins</p>
          </div>
        </div>
      </div>
    </div>
  );
}
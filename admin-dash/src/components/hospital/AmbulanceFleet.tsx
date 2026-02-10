import { useState } from 'react';
import { Ambulance, MapPin, User, Clock, Search, Filter, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

export function AmbulanceFleet() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'in_service' | 'maintenance'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fuelData = [
    { month: "Jan", value: 26 },
    { month: "Feb", value: 25 },
    { month: "Mar", value: 27 },
    { month: "Apr", value: 26 },
    { month: "May", value: 28 },
    { month: "Jun", value: 27 },
    { month: "Jul", value: 28 },
  ];

  const distanceData = [
    { day: "Mon", value: 380 },
    { day: "Tue", value: 420 },
    { day: "Wed", value: 450 },
    { day: "Thu", value: 480 },
    { day: "Fri", value: 520 },
    { day: "Sat", value: 560 },
    { day: "Sun", value: 408 },
  ];

  const ambulances = [
    {
      id: 'AMB-001',
      status: 'available',
      driver: 'John Smith',
      driverGender: 'Male',
      attendant: 'Tom Wilson',
      attendantGender: 'Male',
      location: 'City General Hospital',
      lastService: '2025-11-15',
      equipment: ['Oxygen', 'Defibrillator', 'IV Fluids'],
      hasDoctor: false,
      hasVentilator: false,
    },
    {
      id: 'AMB-002',
      status: 'in_service',
      driver: 'Sarah Lee',
      driverGender: 'Female',
      attendant: 'Maria Garcia',
      attendantGender: 'Female',
      location: 'En route to Central Medical',
      currentTransfer: 'TR-2401',
      eta: '12 mins',
      equipment: ['Oxygen', 'Ventilator', 'Cardiac Monitor'],
      hasDoctor: true,
      hasVentilator: true,
    },
    {
      id: 'AMB-003',
      status: 'available',
      driver: 'Mike Chen',
      driverGender: 'Male',
      attendant: 'Lisa Brown',
      attendantGender: 'Female',
      location: 'Divisional Hospital North',
      lastService: '2025-11-18',
      equipment: ['Oxygen', 'Defibrillator', 'IV Fluids', 'Stretcher'],
      hasDoctor: false,
      hasVentilator: false,
    },
    {
      id: 'AMB-004',
      status: 'maintenance',
      driver: 'David Kumar',
      driverGender: 'Male',
      attendant: 'Not Assigned',
      attendantGender: 'N/A',
      location: 'Service Center',
      lastService: '2025-11-20',
      equipment: [],
      hasDoctor: false,
      hasVentilator: false,
    },
    {
      id: 'AMB-005',
      status: 'available',
      driver: 'Emily Davis',
      driverGender: 'Female',
      attendant: 'Jessica Wong',
      attendantGender: 'Female',
      location: 'City General Hospital',
      lastService: '2025-11-17',
      equipment: ['Oxygen', 'Cardiac Monitor', 'IV Fluids'],
      hasDoctor: false,
      hasVentilator: false,
    },
    {
      id: 'AMB-006',
      status: 'in_service',
      driver: 'Robert Taylor',
      driverGender: 'Male',
      attendant: 'Mark Anderson',
      attendantGender: 'Male',
      location: 'En route to Regional Base',
      currentTransfer: 'TR-2402',
      eta: '18 mins',
      equipment: ['Oxygen', 'Defibrillator', 'IV Fluids'],
      hasDoctor: false,
      hasVentilator: false,
    },
    {
      id: 'AMB-007',
      status: 'available',
      driver: 'Jennifer White',
      driverGender: 'Female',
      attendant: 'Anna Martinez',
      attendantGender: 'Female',
      location: 'Central Medical Center',
      lastService: '2025-11-16',
      equipment: ['Oxygen', 'Ventilator', 'Cardiac Monitor', 'Defibrillator'],
      hasDoctor: true,
      hasVentilator: true,
    },
    {
      id: 'AMB-008',
      status: 'available',
      driver: 'Chris Johnson',
      driverGender: 'Male',
      attendant: 'Paul Brown',
      attendantGender: 'Male',
      location: 'City General Hospital',
      lastService: '2025-11-19',
      equipment: ['Oxygen', 'IV Fluids', 'Stretcher'],
      hasDoctor: false,
      hasVentilator: false,
    },
  ];

  const filteredAmbulances = ambulances.filter(amb => {
    const matchesStatus = filterStatus === 'all' || amb.status === filterStatus;
    const matchesSearch = amb.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amb.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amb.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in_service':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const stats = {
    total: ambulances.length,
    available: ambulances.filter(a => a.status === 'available').length,
    inService: ambulances.filter(a => a.status === 'in_service').length,
    maintenance: ambulances.filter(a => a.status === 'maintenance').length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Ambulance className="text-gray-600" size={24} />
            <span className="text-gray-900">{stats.total}</span>
          </div>
          <p className="text-gray-600 text-sm">Total Fleet</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Ambulance className="text-green-600" size={24} />
            <span className="text-green-600">{stats.available}</span>
          </div>
          <p className="text-gray-600 text-sm">Available</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Ambulance className="text-blue-600" size={24} />
            <span className="text-blue-600">{stats.inService}</span>
          </div>
          <p className="text-gray-600 text-sm">In Service</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Ambulance className="text-orange-600" size={24} />
            <span className="text-orange-600">{stats.maintenance}</span>
          </div>
          <p className="text-gray-600 text-sm">Maintenance</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fuel Efficiency */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-gray-900 mb-1">
                Fuel Efficiency
              </h4>
              <p className="text-gray-500 text-sm">
                Liters per 100km
              </p>
            </div>
            <div className="flex items-center gap-1 text-teal-600 text-sm">
              <TrendingUp size={14} />
              <span>+12%</span>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-3xl text-gray-900">
              28L
            </span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={fuelData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distance Travelled */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-gray-900 mb-1">
                Distance Travelled
              </h4>
              <p className="text-gray-500 text-sm">
                Kilometers per day
              </p>
            </div>
            <div className="flex items-center gap-1 text-teal-600 text-sm">
              <TrendingUp size={14} />
              <span>+8%</span>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-3xl text-gray-900">
              408km
            </span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={distanceData}>
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by ID, driver, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-3 rounded-lg border transition-colors ${filterStatus === 'all'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-3 rounded-lg border transition-colors ${filterStatus === 'available'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilterStatus('in_service')}
              className={`px-4 py-3 rounded-lg border transition-colors ${filterStatus === 'in_service'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              In Service
            </button>
            <button
              onClick={() => setFilterStatus('maintenance')}
              className={`px-4 py-3 rounded-lg border transition-colors ${filterStatus === 'maintenance'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              Maintenance
            </button>
          </div>
        </div>
      </div>

      {/* Ambulance List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAmbulances.map((ambulance) => (
          <div key={ambulance.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-3 rounded-lg">
                  <Ambulance className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-900">{ambulance.id}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs border ${getStatusColor(ambulance.status)}`}>
                    {ambulance.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-700 text-sm">
                  Driver: {ambulance.driver} ({ambulance.driverGender})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-700 text-sm">
                  Attendant: {ambulance.attendant} ({ambulance.attendantGender})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-700 text-sm">{ambulance.location}</span>
              </div>
              {ambulance.status === 'in_service' && ambulance.eta && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-700 text-sm">ETA: {ambulance.eta}</span>
                </div>
              )}
            </div>

            {ambulance.equipment.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-600 text-xs mb-2">Equipment:</p>
                <div className="flex flex-wrap gap-2">
                  {ambulance.equipment.map(item => (
                    <span key={item} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              {ambulance.hasDoctor && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                  Doctor Available
                </span>
              )}
              {ambulance.hasVentilator && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Ventilator
                </span>
              )}
            </div>

            {ambulance.status === 'available' && (
              <button className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                Assign to Transfer
              </button>
            )}
            {ambulance.status === 'in_service' && ambulance.currentTransfer && (
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Track Transfer {ambulance.currentTransfer}
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredAmbulances.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Ambulance className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-gray-900 mb-2">No ambulances found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}

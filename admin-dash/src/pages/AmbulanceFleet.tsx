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
        return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'in_service':
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
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
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <Ambulance className="text-gray-600" size={24} />
            <span className="text-foreground">{stats.total}</span>
          </div>
          <p className="text-muted-foreground text-sm">Total Fleet</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-sm border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-center justify-between mb-2">
            <Ambulance className="text-green-600" size={24} />
            <span className="text-green-600">{stats.available}</span>
          </div>
          <p className="text-muted-foreground text-sm">Available</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center justify-between mb-2">
            <Ambulance className="text-blue-600" size={24} />
            <span className="text-blue-600">{stats.inService}</span>
          </div>
          <p className="text-muted-foreground text-sm">In Service</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800 p-6">
          <div className="flex items-center justify-between mb-2">
            <Ambulance className="text-orange-600" size={24} />
            <span className="text-orange-600">{stats.maintenance}</span>
          </div>
          <p className="text-muted-foreground text-sm">Maintenance</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fuel Efficiency */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-foreground mb-1">
                Fuel Efficiency
              </h4>
              <p className="text-muted-foreground text-sm">
                Liters per 100km
              </p>
            </div>
            <div className="flex items-center gap-1 text-teal-600 text-sm">
              <TrendingUp size={14} />
              <span>+12%</span>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-3xl text-foreground">
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
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-foreground mb-1">
                Distance Travelled
              </h4>
              <p className="text-muted-foreground text-sm">
                Kilometers per day
              </p>
            </div>
            <div className="flex items-center gap-1 text-teal-600 text-sm">
              <TrendingUp size={14} />
              <span>+8%</span>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-3xl text-foreground">
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
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by ID, driver, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-3 rounded-lg border transition-colors ${filterStatus === 'all'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-card text-foreground border-border hover:bg-accent'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-3 rounded-lg border transition-colors ${filterStatus === 'available'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-card text-foreground border-border hover:bg-accent'
                }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilterStatus('in_service')}
              className={`px-4 py-3 rounded-lg border transition-colors ${filterStatus === 'in_service'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-card text-foreground border-border hover:bg-accent'
                }`}
            >
              In Service
            </button>
            <button
              onClick={() => setFilterStatus('maintenance')}
              className={`px-4 py-3 rounded-lg border transition-colors ${filterStatus === 'maintenance'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-card text-foreground border-border hover:bg-accent'
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
          <div key={ambulance.id} className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <Ambulance className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-foreground">{ambulance.id}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs border ${getStatusColor(ambulance.status)}`}>
                    {ambulance.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-muted-foreground text-sm">
                  Driver: {ambulance.driver} ({ambulance.driverGender})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-muted-foreground text-sm">
                  Attendant: {ambulance.attendant} ({ambulance.attendantGender})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-muted-foreground text-sm">{ambulance.location}</span>
              </div>
              {ambulance.status === 'in_service' && ambulance.eta && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-muted-foreground text-sm">ETA: {ambulance.eta}</span>
                </div>
              )}
            </div>

            {ambulance.equipment.length > 0 && (
              <div className="mb-4">
                <p className="text-muted-foreground text-xs mb-2">Equipment:</p>
                <div className="flex flex-wrap gap-2">
                  {ambulance.equipment.map(item => (
                    <span key={item} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-border">
              {ambulance.hasDoctor && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs">
                  Doctor Available
                </span>
              )}
              {ambulance.hasVentilator && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
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
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <Ambulance className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-foreground mb-2">No ambulances found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}

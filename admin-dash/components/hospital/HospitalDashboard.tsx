import { useState } from "react";
import {
  Ambulance,
  Clock,
  Users,
  AlertCircle,
  TrendingUp,
  MapPin,
  Layers,
  List,
  Plus,
  Minus,
  Navigation,
  Maximize2,
  AlertTriangle,
  Wrench,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { AmbulanceMap } from "./AmbulanceMap";

export function HospitalDashboard() {
  const [mapView, setMapView] = useState<"map" | "list">("map");

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

  const stats = [
    {
      label: "Available Ambulances",
      value: "3/11",
      change: "In service",
      icon: Ambulance,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      label: "On the Way",
      value: "2",
      change: "En route",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Busy",
      value: "2",
      change: "At hospital",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Standby",
      value: "2",
      change: "Ready",
      icon: Users,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Offline",
      value: "2",
      change: "Maintenance",
      icon: AlertCircle,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  const ambulances = [
    {
      id: "AMB-001",
      status: "available",
      driver: "John Smith",
      location: "City General Hospital",
      lat: 6.9271,
      lng: 79.8612,
      position: { left: "25%", top: "33%" },
    },
    {
      id: "AMB-003",
      status: "available",
      driver: "Mike Chen",
      location: "Divisional Hospital North",
      lat: 6.9350,
      lng: 79.8700,
      position: { left: "33%", bottom: "33%" },
    },
    {
      id: "AMB-005",
      status: "available",
      driver: "Emily Davis",
      location: "City General Hospital",
      lat: 6.9200,
      lng: 79.8500,
      position: { left: "66%", top: "25%" },
    },
    {
      id: "AMB-002",
      status: "on_way",
      driver: "Sarah Lee",
      location: "En route to Central Medical",
      eta: "12 mins",
      lat: 6.9150,
      lng: 79.8550,
      position: { right: "33%", top: "25%" },
    },
    {
      id: "AMB-006",
      status: "on_way",
      driver: "Robert Taylor",
      location: "En route to Regional Base",
      eta: "18 mins",
      lat: 6.9400,
      lng: 79.8750,
      position: { right: "25%", bottom: "25%" },
    },
    {
      id: "AMB-007",
      status: "busy",
      driver: "Jennifer White",
      location: "At Central Medical Center",
      lat: 6.9100,
      lng: 79.8600,
      position: { left: "50%", top: "25%" },
    },
    {
      id: "AMB-008",
      status: "busy",
      driver: "Chris Johnson",
      location: "At Specialist Hospital",
      lat: 6.9300,
      lng: 79.8650,
      position: { right: "33%", bottom: "33%" },
    },
    {
      id: "AMB-009",
      status: "standby",
      driver: "David Brown",
      location: "Base Station A",
      lat: 6.9250,
      lng: 79.8620,
      position: { left: "40%", top: "50%" },
    },
    {
      id: "AMB-010",
      status: "standby",
      driver: "Lisa Anderson",
      location: "Base Station B",
      lat: 6.9280,
      lng: 79.8630,
      position: { right: "40%", bottom: "40%" },
    },
    {
      id: "AMB-004",
      status: "offline",
      driver: "David Kumar",
      location: "Service Center",
      lat: 6.9000,
      lng: 79.9000,
      position: { right: "20%", top: "40%" },
    },
    {
      id: "AMB-011",
      status: "offline",
      driver: "James Wilson",
      location: "Maintenance Bay",
      lat: 6.9500,
      lng: 79.8800,
      position: { left: "60%", bottom: "20%" },
    },
  ];

  const activeTransfers = [
    {
      id: "TR-2401",
      patient: "Sarah Johnson",
      age: 45,
      gender: "Female",
      from: "City General Hospital",
      to: "Central Medical Center",
      ambulance: "AMB-003",
      driver: "Mike Chen",
      attendant: "Lisa Brown (F)",
      status: "in_transit",
      eta: "12 mins",
      distance: 8.5,
      priority: "urgent",
    },
    {
      id: "TR-2402",
      patient: "David Miller",
      age: 62,
      gender: "Male",
      from: "Divisional Hospital North",
      to: "City General Hospital",
      ambulance: "AMB-007",
      driver: "John Smith",
      attendant: "Tom Wilson (M)",
      status: "patient_loaded",
      eta: "18 mins",
      distance: 12.3,
      priority: "critical",
    },
    {
      id: "TR-2403",
      patient: "Emma Davis",
      age: 28,
      gender: "Female",
      from: "City General Hospital",
      to: "Specialist Care Hospital",
      ambulance: "AMB-011",
      driver: "Sarah Lee",
      attendant: "Maria Garcia (F)",
      status: "dispatched",
      eta: "25 mins",
      distance: 15.7,
      priority: "standard",
    },
  ];

  const pendingRequests = [
    {
      id: "REQ-1024",
      patient: "Robert Taylor",
      age: 55,
      gender: "Male",
      from: "Divisional Hospital East",
      to: "City General Hospital",
      priority: "urgent",
      requestedBy: "Dr. Anderson",
      time: "5 mins ago",
    },
    {
      id: "REQ-1025",
      patient: "Jennifer White",
      age: 38,
      gender: "Female",
      from: "Rural Health Center",
      to: "Central Medical Center",
      priority: "standard",
      requestedBy: "Dr. Martinez",
      time: "12 mins ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-teal-500";
      case "on_way":
        return "bg-blue-500";
      case "busy":
        return "bg-orange-500";
      case "standby":
        return "bg-yellow-500";
      case "offline":
        return "bg-pink-600";
      case "in_transit":
        return "bg-blue-100 text-blue-700";
      case "patient_loaded":
        return "bg-green-100 text-green-700";
      case "dispatched":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-600";
      case "urgent":
        return "bg-orange-500";
      default:
        return "bg-green-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">
              {stat.label}
            </p>
            <p className={`${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-gray-500 text-xs">
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <h3 className="text-red-900">
                Pending Transfer Requests
              </h3>
              <p className="text-red-700 text-sm">
                {pendingRequests.length} requests waiting for
                ambulance assignment
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Map and Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Ambulance Map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-gray-900">
                Live Ambulance Locations
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMapView("map")}
                  className={`p-2 rounded-lg transition-colors ${mapView === "map" ? "bg-red-100 text-red-600" : "hover:bg-gray-100 text-gray-600"}`}
                >
                  <Layers size={18} />
                </button>
                <button
                  onClick={() => setMapView("list")}
                  className={`p-2 rounded-lg transition-colors ${mapView === "list" ? "bg-red-100 text-red-600" : "hover:bg-gray-100 text-gray-600"}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* Map View */}
            {mapView === "map" && (
              <AmbulanceMap
                ambulances={ambulances.map(amb => ({
                  id: amb.id,
                  status: amb.status,
                  driver: amb.driver,
                  location: amb.location,
                  eta: amb.eta,
                  lat: amb.lat,
                  lng: amb.lng,
                }))}
                height="384px"
              />
            )}

            {/* List View */}
            {mapView === "list" && (
              <div className="h-96 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {ambulances.map((amb) => (
                    <div
                      key={amb.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 ${getStatusColor(amb.status)} rounded-full`}
                          ></div>
                          <div>
                            <p className="text-gray-900 text-sm">
                              {amb.id}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {amb.driver}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-700 text-sm">
                            {amb.location}
                          </p>
                          {amb.eta && (
                            <p className="text-blue-600 text-xs">
                              ETA: {amb.eta}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Fleet Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Fleet Summary</h3>
              <Activity className="text-red-600" size={20} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">
                  Total Ambulances
                </span>
                <span className="text-gray-900">11</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">
                  Active Now
                </span>
                <span className="text-teal-600">7</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">
                  In Service
                </span>
                <span className="text-blue-600">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">
                  Maintenance
                </span>
                <span className="text-orange-600">2</span>
              </div>
            </div>
          </div>

          {/* Ambulance Condition */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900">
                Ambulance Condition
              </h3>
              <span className="text-sm text-teal-600 flex items-center gap-1">
                <TrendingUp size={14} />
                5.2%
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 text-sm">
                    Good
                  </span>
                </div>
                <span className="text-gray-900">7</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <AlertTriangle
                      className="text-white"
                      size={14}
                    />
                  </div>
                  <span className="text-gray-900 text-sm">
                    Maintenance Needed
                  </span>
                </div>
                <span className="text-gray-900">3</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Wrench className="text-white" size={14} />
                  </div>
                  <span className="text-gray-900 text-sm">
                    Repairing
                  </span>
                </div>
                <span className="text-gray-900">1</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 text-sm">
                    Breakdown
                  </span>
                </div>
                <span className="text-gray-900">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Transfers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Active Transfers</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {activeTransfers.map((transfer) => (
            <div
              key={transfer.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">
                      {transfer.patient}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(transfer.priority)}`}
                    >
                      {transfer.priority.toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${getStatusColor(transfer.status)}`}
                    >
                      {transfer.status
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {transfer.age} yrs • {transfer.gender} •
                    Transfer ID: {transfer.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">
                    FROM
                  </p>
                  <p className="text-gray-900 text-sm">
                    {transfer.from}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">
                    TO
                  </p>
                  <p className="text-gray-900 text-sm">
                    {transfer.to}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">
                    ETA
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock
                      size={16}
                      className="text-gray-400"
                    />
                    <p className="text-gray-900 text-sm">
                      {transfer.eta}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Ambulance
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-gray-700">
                      {transfer.ambulance}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-gray-700">
                      {transfer.driver}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-gray-700">
                      {transfer.attendant}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-gray-700">
                      {transfer.distance} km
                    </span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Track Live
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-900">
            Pending Transfer Requests
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">
                      {request.patient}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(request.priority)}`}
                    >
                      {request.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {request.age} yrs • {request.gender} •{" "}
                    {request.id}
                  </p>
                </div>
                <span className="text-gray-500 text-sm">
                  {request.time}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">
                    FROM
                  </p>
                  <p className="text-gray-900 text-sm">
                    {request.from}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">
                    TO
                  </p>
                  <p className="text-gray-900 text-sm">
                    {request.to}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-gray-600 text-sm">
                  Requested by:{" "}
                  <span className="text-gray-900">
                    {request.requestedBy}
                  </span>
                </p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                  Assign Ambulance
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-green-900 mb-2">
            Protocol Management
          </h4>
          <p className="text-green-700 text-sm">
            ✓ All transfers comply with inter-hospital protocols
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-blue-900 mb-2">
            Pre-Arrival Notifications
          </h4>
          <p className="text-blue-700 text-sm">
            ✓ Receiving hospitals notified 15 mins before
            arrival
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-purple-900 mb-2">
            Gender Compliance
          </h4>
          <p className="text-purple-700 text-sm">
            ✓ Attendants matched according to patient gender
          </p>
        </div>
      </div>
    </div>
  );
}
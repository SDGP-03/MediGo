import { useState } from "react";
import { Ambulance, Clock, Users, AlertCircle, TrendingUp, MapPin, Layers, List, Plus, Minus, Navigation, Maximize2, AlertTriangle, Wrench, Activity, CheckCircle, User } from "lucide-react";
import { AmbulanceMap } from "../components/dashboard/AmbulanceMap";

export function HospitalDashboard() {
  const [mapView, setMapView] = useState<"map" | "list">("map");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Incoming emergency patients
  const incomingRequests = [
    {
      id: 1,
      patientName: 'John Doe',
      age: 45,
      gender: 'Male',
      incidentType: 'Cardiac Emergency',
      priority: 'critical',
      eta: '8 mins',
      distance: 3.2,
      ambulanceNumber: 'AMB-102',
      contactNumber: '+91 9876543210',
      symptoms: 'Severe chest pain, shortness of breath',
      consciousness: 'conscious',
      breathing: 'difficulty',
      timestamp: '2 mins ago',
    },
    {
      id: 2,
      patientName: 'Sarah Smith',
      age: 32,
      gender: 'Female',
      incidentType: 'Trauma/Accident',
      priority: 'urgent',
      eta: '12 mins',
      distance: 5.1,
      ambulanceNumber: 'AMB-205',
      contactNumber: '+91 9123456789',
      symptoms: 'Head injury, bleeding from forehead',
      consciousness: 'conscious',
      breathing: 'normal',
      timestamp: '5 mins ago',
    },
    {
      id: 3,
      patientName: 'Raj Kumar',
      age: 28,
      gender: 'Male',
      incidentType: 'Seizure',
      priority: 'urgent',
      eta: '15 mins',
      distance: 6.8,
      ambulanceNumber: 'AMB-301',
      contactNumber: '+91 9898989898',
      symptoms: 'Seizure episode, now stable',
      consciousness: 'drowsy',
      breathing: 'normal',
      timestamp: '8 mins ago',
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

  // Compute fleet status counts from ambulances data
  const statusCounts = {
    available: ambulances.filter(a => a.status === 'available').length,
    on_way: ambulances.filter(a => a.status === 'on_way').length,
    busy: ambulances.filter(a => a.status === 'busy').length,
    standby: ambulances.filter(a => a.status === 'standby').length,
    offline: ambulances.filter(a => a.status === 'offline').length,
    total: ambulances.length,
  };

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
        return "bg-emerald-500";
      case "on_way":
        return "bg-blue-500";
      case "busy":
        return "bg-orange-500";
      case "standby":
        return "bg-slate-500";
      case "offline":
        return "bg-red-600";
      case "in_transit":
        return "bg-blue-100 text-blue-700";
      case "patient_loaded":
        return "bg-green-100 text-green-700";
      case "dispatched":
        return "bg-blue-100 text-blue-700";
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

      {/* Map + Fleet Overview */}
      <div className="overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center pl-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <h2 className="bg-white rounded-lg px-3 py-1 text-gray-900">
              Live Ambulance Locations
            </h2>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
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

        <div className="flex flex-col lg:flex-row">
          {/* Map / List Area */}
          <div className="flex-1 min-w-0">
            {mapView === "map" && (
              <AmbulanceMap
                ambulances={ambulances.map(amb => ({
                  id: amb.id,
                  status: amb.status as "available" | "on_way" | "busy" | "standby" | "offline",
                  driver: amb.driver,
                  location: amb.location,
                  eta: amb.eta,
                  lat: amb.lat,
                  lng: amb.lng,
                }))}
                height="525px"
              />
            )}

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

          {/* Fleet Overview Sidebar — Map Key */}
          <div className="w-full lg:w-56 border-t lg:border-t-0 lg:border-l border-gray-200 p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 text-sm font-semibold">Fleet Overview</h3>
              <Activity className="text-red-600" size={16} />
            </div>

            {/* Total */}
            <div className="mb-4 pb-3 border-b border-gray-200">
              <p className="text-gray-500 text-xs">Total Ambulances</p>
              <p className="text-gray-900 text-2xl font-bold">{statusCounts.total}</p>
            </div>

            {/* Status breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center">
                    <Ambulance className="text-emerald-600" size={14} />
                  </div>
                  <span className="text-gray-600 text-sm">Available</span>
                </div>
                <span className="text-emerald-600 font-semibold text-sm">{statusCounts.available}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                    <Clock className="text-orange-600" size={14} />
                  </div>
                  <span className="text-gray-600 text-sm">Busy</span>
                </div>
                <span className="text-orange-600 font-semibold text-sm">{statusCounts.busy}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                    <AlertCircle className="text-red-600" size={14} />
                  </div>
                  <span className="text-gray-600 text-sm">Offline</span>
                </div>
                <span className="text-red-600 font-semibold text-sm">{statusCounts.offline}</span>
              </div>
            </div>
          </div>
        </div>
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



      {/* Ambulance Condition */}
      <div className="grid grid-cols-1 gap-6">

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

        {/* Incoming Emergency Patients */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Incoming Emergency Patients</h3>
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <div
                key={request.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-red-400 transition-all cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-gray-900">{request.patientName}</h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs text-white ${getPriorityColor(
                          request.priority
                        )}`}
                      >
                        {request.priority.toUpperCase()}
                      </span>
                      <span className="text-gray-500 text-sm">{request.timestamp}</span>
                    </div>
                    <p className="text-gray-600">
                      {request.age} yrs • {request.gender} • {request.incidentType}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Ambulance size={16} className="text-gray-400" />
                    <span className="text-gray-700 text-sm">{request.ambulanceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-700 text-sm">ETA {request.eta}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-gray-700 text-sm">{request.distance} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-700 text-sm capitalize">{request.consciousness}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="text-gray-600 text-sm mb-1">Symptoms:</p>
                  <p className="text-gray-900 text-sm">{request.symptoms}</p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    Prepare Room
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Preparation Checklist */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Resource Preparation Checklist</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-gray-900">Emergency Room 1 - Ready</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-gray-900">Cardiac Team - On Standby</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="text-yellow-600" size={20} />
              <span className="text-gray-900">Trauma Team - Being Notified</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-gray-900">Blood Bank - Notified</span>
            </div>
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
    </div>
  );
}
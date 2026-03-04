import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ambulance, Clock, Users, AlertCircle, TrendingUp, MapPin, Layers, List, Plus, Minus, Navigation, Maximize2, AlertTriangle, Wrench, Activity, CheckCircle, User, ArrowRightLeft } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { AmbulanceMap } from "../components/dashboard/AmbulanceMap";
import { useDriverLocations } from "../useDriverLocations";
import { database } from "../firebase";
import { ref, onValue, off } from "firebase/database";


export function HospitalDashboard() {
  const navigate = useNavigate();
  const [mapView, setMapView] = useState<"map" | "list">("map");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // --- STATE: RESOURCE AVAILABILITY ---
  const [resources, setResources] = useState([
    { id: 'icu', name: 'ICU Bed Availability', available: false },
    { id: 'nicu', name: 'NICU Bed Availability', available: false },
    { id: 'picu', name: 'PICU Bed Availability', available: false },
    { id: 'med_surg', name: 'Med/Surg Bed Availability', available: false },
    { id: 'telemetry', name: 'Telemetry Bed Availability', available: false },
    { id: 'er', name: 'Emergency Room Availability', available: false },
  ]);

  const toggleResource = (id: string) => {
    setResources(resources.map(r => r.id === id ? { ...r, available: !r.available } : r));
  };

  // Live driver data from Firebase
  const { onlineDrivers, offlineDrivers, isLoading: driversLoading } = useDriverLocations();

  const [dbPendingRequests, setDbPendingRequests] = useState<any[]>([]);
  const [dbActiveTransfers, setDbActiveTransfers] = useState<any[]>([]);

  useEffect(() => {
    const requestsRef = ref(database, 'transfer_requests');
    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (!data) {
        setDbPendingRequests([]);
        setDbActiveTransfers([]);
        return;
      }

      const formatTimeAgo = (timestamp: number) => {
        if (!timestamp) return 'Just now';
        const mins = Math.floor((Date.now() - timestamp) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} mins ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
      };

      const pending: any[] = [];
      const active: any[] = [];

      Object.entries(data).forEach(([key, value]: [string, any]) => {
        const item = {
          id: key.substring(Math.max(0, key.length - 8)).toUpperCase(),
          realId: key,
          patient: value.patient?.name || 'Unknown',
          age: value.patient?.age || 'N/A',
          gender: value.patient?.gender || 'N/A',
          from: value.pickup?.hospitalName || 'Unknown',
          to: value.destination?.hospitalName || 'Unknown',
          priority: value.priority || 'standard',
          requestedBy: 'System',
          time: formatTimeAgo(value.createdAt),

          ambulance: value.ambulanceId || 'Pending',
          driver: value.driverId || 'Unknown',
          attendant: value.attendant || 'N/A',
          status: value.status || 'pending',
          eta: value.eta || 'Evaluating...',
          distance: value.distance || '0',
        };

        if (value.status === 'pending') {
          pending.push(item);
        } else if (value.status && value.status !== 'completed' && value.status !== 'cancelled') {
          active.push(item);
        }
      });

      pending.reverse();
      active.reverse();

      setDbPendingRequests(pending);
      setDbActiveTransfers(active);
    };

    onValue(requestsRef, handleData);
    return () => off(requestsRef);
  }, []);

  // --- DATA: INCOMING EMERGENCIES ---
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

  const liveDriverCount = onlineDrivers.length + offlineDrivers.length;
  const statusCounts = {
    available: onlineDrivers.length,
    busy: ambulances.filter(a => a.status === 'busy').length,
    offline: offlineDrivers.length,
    total: liveDriverCount > 0 ? liveDriverCount : ambulances.length,
  };

  const activeTransfers = dbActiveTransfers.length > 0 ? dbActiveTransfers : [];

  const pendingRequests = dbPendingRequests.length > 0 ? dbPendingRequests : [];

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

      {/* --- SECTION: MAP & FLEET OVERVIEW --- */}
      {/* Contains the interactive map and the sidebar with fleet statistics */}
      <div id="map-section" className="overflow-hidden bg-card rounded-lg shadow-sm border border-border">
        <div className="p-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center pl-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
            <h2 className="bg-card rounded-lg px-3 py-1 text-foreground">
              Live Ambulance Locations
            </h2>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setMapView("map")}
              className={`p-2 rounded-lg transition-colors ${mapView === "map" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "hover:bg-accent text-muted-foreground"}`}
            >
              <Layers size={18} />
            </button>
            <button
              onClick={() => setMapView("list")}
              className={`p-2 rounded-lg transition-colors ${mapView === "list" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "hover:bg-accent text-muted-foreground"}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Map / List Area */}
          <div className="flex-1 min-w-0">
            {mapView === "map" && (
              <AmbulanceMap ambulances={ambulances.map(amb => ({
                id: amb.id,
                status: amb.status as "available" | "on_way" | "busy" | "standby" | "offline",
                driver: amb.driver,
                location: amb.location,
                eta: amb.eta,
                lat: amb.lat,
                lng: amb.lng,
              }))}
                height="650px"
              />
            )}

            {mapView === "list" && (
              <div className="h-162m overflow-y-auto">
                <div className="divide-y divide-border">
                  {ambulances.map((amb) => (
                    <div
                      key={amb.id}
                      className="p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 ${getStatusColor(amb.status)} rounded-full`}
                          ></div>
                          <div>
                            <p className="text-foreground text-sm">
                              {amb.id}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {amb.driver}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">
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
          <div className="w-full lg:w-56 border-t lg:border-t-0 lg:border-l border-border/50 p-4 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-900/40 dark:to-gray-900/20 backdrop-blur-xl shadow-2xl relative overflow-hidden group/sidebar">
            {/* Simple glow effect */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover/sidebar:bg-blue-500/20 transition-all duration-700" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover/sidebar:bg-purple-500/20 transition-all duration-700" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-foreground text-sm font-semibold tracking-wide uppercase opacity-70">Fleet Status</h3>
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                <Activity className="text-red-600 relative z-10" size={16} />
              </div>
            </div>

            {/* Total */}
            <div className="mb-6 pb-4 border-b border-white/10 dark:border-white/5 relative z-10 group/total">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Total Fleet</p>
              <p className="text-foreground text-3xl font-bold tracking-tight group-hover/total:scale-105 transition-transform duration-300 origin-left">{statusCounts.total}</p>
            </div>

            {/* Status breakdown */}
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-300 cursor-default group/item">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300 shadow-sm border border-emerald-500/20">
                    <Ambulance className="text-emerald-600 dark:text-emerald-400" size={16} />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Available</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{statusCounts.available}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-300 cursor-default group/item">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300 shadow-sm border border-orange-500/20">
                    <Clock className="text-orange-600 dark:text-orange-400" size={16} />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Busy</span>
                </div>
                <span className="text-orange-600 dark:text-orange-400 font-bold text-sm bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{statusCounts.busy}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-300 cursor-default group/item">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300 shadow-sm border border-red-500/20">
                    <AlertCircle className="text-red-600 dark:text-red-400" size={16} />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Offline</span>
                </div>
                <span className="text-red-600 dark:text-red-400 font-bold text-sm bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">{statusCounts.offline}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <h3 className="text-red-600">
                Pending Transfer Requests
              </h3>
              <p className="text-red-400 text-sm">
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
        {/* <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-foreground">
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
                <span className="text-foreground text-sm">
                  Good
                </span>
              </div>
              <span className="text-foreground">7</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <AlertTriangle
                    className="text-white"
                    size={14}
                  />
                </div>
                <span className="text-foreground text-sm">
                  Maintenance Needed
                </span>
              </div>
              <span className="text-foreground">3</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Wrench className="text-white" size={14} />
                </div>
                <span className="text-foreground text-sm">
                  Repairing
                </span>
              </div>
              <span className="text-foreground">1</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-foreground text-sm">
                  Breakdown
                </span>
              </div>
              <span className="text-foreground">0</span>
            </div>
          </div>
        </div> */}





        {/* --- SECTION: ACTIVE TRANSFERS --- */}
        {/* List of currently active ambulance transfers */}
        <div id="active-transfers" className="overflow-hidden bg-card rounded-lg shadow-sm border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Active Transfers</h2>
          </div>
          <div className="divide-y divide-border">
            {activeTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="p-6 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-foreground">
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
                    <p className="text-muted-foreground text-sm mb-3">
                      {transfer.age} yrs • {transfer.gender} •
                      Transfer ID: {transfer.id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      FROM
                    </p>
                    <p className="text-foreground text-sm">
                      {transfer.from}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      TO
                    </p>
                    <p className="text-foreground text-sm">
                      {transfer.to}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      ETA
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock
                        size={16}
                        className="text-gray-400"
                      />
                      <p className="text-foreground text-sm">
                        {transfer.eta}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Ambulance
                        size={16}
                        className="text-gray-400"
                      />
                      <span className="text-muted-foreground">
                        {transfer.ambulance}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users
                        size={16}
                        className="text-gray-400"
                      />
                      <span className="text-muted-foreground">
                        {transfer.driver}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users
                        size={16}
                        className="text-gray-400"
                      />
                      <span className="text-muted-foreground">
                        {transfer.attendant}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={16}
                        className="text-gray-400"
                      />
                      <span className="text-muted-foreground">
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

        {/* --- SECTION: PENDING REQUESTS --- */}
        {/* Transfer requests waiting for assignment */}
        <div id="pending-requests" className="overflow-hidden bg-card rounded-lg shadow-sm border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Pending Transfer Requests
            </h2>
          </div>
          <div className=" divide-y divide-border">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className=" p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-foreground">
                        {request.patient}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(request.priority)}`}
                      >
                        {request.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {request.age} yrs • {request.gender} •{" "}
                      {request.id}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {request.time}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      FROM
                    </p>
                    <p className="text-foreground text-sm">
                      {request.from}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      TO
                    </p>
                    <p className="text-foreground text-sm">
                      {request.to}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm">
                    Requested by:{" "}
                    <span className="text-foreground">
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

        {/* --- SECTION: INCOMING EMERGENCY PATIENTS --- */}
        {/* Real-time feed of incoming emergency patients */}
        <div id="incoming-emergency" className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Incoming Emergency Patients</h3>
          </div>
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <div
                key={request.id}
                className="border-2 border-border rounded-lg p-4 hover:border-red-400 transition-all cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-foreground">{request.patientName}</h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs text-white ${getPriorityColor(
                          request.priority
                        )}`}
                      >
                        {request.priority.toUpperCase()}
                      </span>
                      <span className="text-muted-foreground text-sm">{request.timestamp}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {request.age} yrs • {request.gender} • {request.incidentType}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Ambulance size={16} className="text-gray-400" />
                    <span className="text-muted-foreground text-sm">{request.ambulanceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-muted-foreground text-sm">ETA {request.eta}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-muted-foreground text-sm">{request.distance} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-muted-foreground text-sm capitalize">{request.consciousness}</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded p-3">
                  <p className="text-muted-foreground text-sm mb-1">Symptoms:</p>
                  <p className="text-foreground text-sm">{request.symptoms}</p>
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

        {/* --- SECTION: RESOURCE AVAILABILITY --- */}
        {/* Checklist for hospital resource availability */}
        <div id="resource-availability" className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Resource Availability</h3>
          </div>
          <div className="space-y-3">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${resource.available
                  ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800'
                  : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30 hover:border-red-200 dark:hover:border-red-800'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2.5 rounded-xl shadow-sm transition-colors ${resource.available
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                  >
                    {resource.available ? <CheckCircle size={20} strokeWidth={2.5} /> : <AlertCircle size={20} strokeWidth={2.5} />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-foreground text-sm tracking-tight">{resource.name}</h4>
                    <div className="flex">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${resource.available
                          ? 'bg-white text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900'
                          : 'bg-white text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900'
                          }`}
                      >
                        {resource.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`h-8 w-[1px] ${resource.available ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-red-200 dark:bg-red-800'}`}></div>
                  <Switch
                    checked={resource.available}
                    onCheckedChange={() => toggleResource(resource.id)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 scale-110 shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Quick Navigation Dock */}
      <QuickNav pendingCount={pendingRequests.length} incomingCount={incomingRequests.length} />

      {/* Floating Action Button for Transfer Request */}
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

// --- SUBSIDIARY COMPONENT: QUICK NAVIGATION DOCK ---
// Renders the floating sidebar navigation for quick access to sections
function QuickNav({ pendingCount = 0, incomingCount = 0 }: { pendingCount?: number; incomingCount?: number }) {
  const [activeSection, setActiveSection] = useState<string>('');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = ['map-section', 'active-transfers', 'pending-requests', 'incoming-emergency', 'resource-availability'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const navItems = [
    { id: 'map-section', label: 'Live Map', icon: MapPin, color: 'from-green-500 to-green-600', shadow: 'shadow-green-500/50', count: 0 },
    { id: 'active-transfers', label: 'Active Transfers', icon: ArrowRightLeft, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/50', count: 0 },
    { id: 'pending-requests', label: 'Pending Requests', icon: Clock, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/50', count: pendingCount },
    { id: 'incoming-emergency', label: 'Incoming Emergency', icon: AlertCircle, color: 'from-red-500 to-red-600', shadow: 'shadow-red-500/50', count: incomingCount },
    { id: 'resource-availability', label: 'Resource Availability', icon: Activity, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/50', count: 0 },
  ];

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-3">
      <div className="bg-white/50 dark:bg-black/40 backdrop-blur-xl p-2 rounded-full shadow-2xl border border-white/20 flex flex-col gap-3 items-center">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="group relative p-2.5 rounded-full transition-all duration-300 ease-out hover:scale-110"
            >
              {/* Active Background Glow */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive ? `bg-gradient-to-br ${item.color} ${item.shadow} shadow-lg scale-100 opacity-100` : 'opacity-0 scale-75'
                  }`}
              />

              {/* Hover Background */}
              <div className={`absolute inset-0 rounded-full bg-white/50 transition-all duration-300 ${!isActive ? 'group-hover:opacity-100' : ''} opacity-0`} />

              <item.icon
                size={18}
                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Notification Badge */}
              {item.count > 0 && (
                <div className="absolute -top-1 -right-1 z-20 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm ">
                  {item.count}
                </div>
              )}

              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1 bg-gray-900/90 dark:bg-white/90 backdrop-blur-sm text-white dark:text-gray-900 text-[10px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-1 group-hover:translate-x-0 whitespace-nowrap shadow-xl">
                {item.label}
                {/* Arrow */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-3 border-[4px] border-transparent border-r-gray-900/90 dark:border-r-white/90" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
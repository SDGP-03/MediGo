import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle,
  User,
  ArrowRightLeft,
  Phone,
  Mail,
  Shield,
  Car
} from "lucide-react";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { AmbulanceMap } from "../components/dashboard/AmbulanceMap";
import { useDriverLocations } from "../useDriverLocations";
import { apiFetch } from "../api/apiClient";
import { database, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, off, get } from "firebase/database";


export function HospitalDashboard() {
  const navigate = useNavigate();
  const [mapView, setMapView] = useState<"map" | "list">("map");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [trackedDriverTrigger, setTrackedDriverTrigger] = useState<{ id: string, timestamp: number } | null>(null);

  // --- STATE: DRIVER INFO POPUP ---
  const [driverPopupOpen, setDriverPopupOpen] = useState(false);
  const [driverPopupData, setDriverPopupData] = useState<any>(null);
  const [driverPopupLoading, setDriverPopupLoading] = useState(false);

  const viewDriverDetails = async (driverId: string) => {
    if (!driverId || driverId === 'Unknown') {
      alert('No driver assigned to this request.');
      return;
    }
    setDriverPopupOpen(true);
    setDriverPopupLoading(true);
    setDriverPopupData(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const driverRef = ref(database, `hospitals/${user.uid}/drivers/${driverId}`);
      const snapshot = await get(driverRef);

      if (snapshot.exists()) {
        setDriverPopupData({ id: driverId, ...snapshot.val() });
      } else {
        setDriverPopupData({ id: driverId, notFound: true });
      }
    } catch (err: any) {
      console.error('Error fetching driver details from Firebase:', err);
      setDriverPopupData({ id: driverId, error: true });
    } finally {
      setDriverPopupLoading(false);
    }
  };

  const handleTrackLive = (transfer: any) => {
    if (!transfer.driverId) {
      alert("No driver assigned to this transfer yet.");
      return;
    }
    setMapView("map");
    setTrackedDriverTrigger({ id: transfer.driverId, timestamp: Date.now() });

    setTimeout(() => {
      document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

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

  const handleCancelRequest = async (requestId: string) => {
    if (!requestId) return;

    if (window.confirm("Are you sure you want to cancel this transfer request?")) {
      try {
        await apiFetch(`/transfers/${requestId}/cancel`, {
          method: 'PATCH'
        });
        // Optimistic UI update: Remove from local state immediately
        setDbPendingRequests(prev => prev.filter(req => req.id !== requestId));
        setDbActiveTransfers(prev => prev.filter(req => req.id !== requestId));
      } catch (error) {
        console.error("Error cancelling request:", error);
        alert("Failed to cancel request. Please try again.");
      }
    }
  };

  // --- STATE: HOSPITAL PROFILE ---
  const [currentHospitalName, setCurrentHospitalName] = useState<string>("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const adminRef = ref(database, `admin/${user.uid}`);
          const snapshot = await get(adminRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            setCurrentHospitalName(data.hospitalName || "");
          }
        } catch (err) {
          console.error("Error fetching admin profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Live driver data from Firebase
  const { onlineDrivers, busyDrivers, offlineDrivers, isLoading: driversLoading } = useDriverLocations();

  const [dbPendingRequests, setDbPendingRequests] = useState<any[]>([]);
  const [dbActiveTransfers, setDbActiveTransfers] = useState<any[]>([]);

  useEffect(() => {
    const transfersRef = ref(database, 'transfer_requests');

    const unsub = onValue(transfersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const allTransfers = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));

      // Filter pending requests:
      // 1. 'pending' (waiting for admin to assign driver)
      // 2. 'dispatched' (waiting for driver to accept)
      const pending = allTransfers.filter(t =>
        t.status !== 'cancelled' &&
        t.status !== 'completed' &&
        (t.status === 'pending' || t.status === 'dispatched') &&
        (!currentHospitalName || t.destination?.hospitalName === currentHospitalName)
      );

      // Active transfers: Driver has accepted and is on the move
      const active = allTransfers.filter(t =>
        t.status !== 'cancelled' &&
        t.status !== 'completed' &&
        (t.status === 'on_way' ||
          t.status === 'at_pickup' ||
          t.status === 'patient_loaded' ||
          t.status === 'in_transit' ||
          t.status === 'arrived_at_destination')
      );

      console.log(`[Transfers Debug] Total: ${allTransfers.length}, Pending: ${pending.length}, Active: ${active.length}`);
      if (allTransfers.length > 0) {
        const sample = allTransfers[allTransfers.length - 1]; // look at newest
        console.log(`[Transfers Debug] Sample newest transfer status:`, sample.status, 'Hospital Name matches?', (!currentHospitalName || sample.destination?.hospitalName === currentHospitalName || sample.pickup?.hospitalName === currentHospitalName), currentHospitalName, sample.destination?.hospitalName, sample.pickup?.hospitalName);
      }

      setDbPendingRequests(pending);
      setDbActiveTransfers(active);
    }, (err) => {
      console.error('[Dashboard] Firebase transfers error:', err);
    });

    return () => off(transfersRef, 'value', unsub);
  }, [currentHospitalName]);

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

  const liveDriverCount = onlineDrivers.length + busyDrivers.length + offlineDrivers.length;
  const statusCounts = {
    available: onlineDrivers.length,
    busy: busyDrivers.length,
    offline: offlineDrivers.length,
    total: onlineDrivers.length + busyDrivers.length + offlineDrivers.length,
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
              className={`p-2 rounded-lg transition-all active: scale-95 ${mapView === "map" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "hover:bg-accent text-muted-foreground"} `}
            >
              <Layers size={18} />
            </button>
            <button
              onClick={() => setMapView("list")}
              className={`p-2 rounded-lg transition-all active: scale-95 ${mapView === "list" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "hover:bg-accent text-muted-foreground"} `}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Map/List Area */}
          <div className="flex-1 min-w-0">
            {mapView === "map" && (
              <AmbulanceMap
                ambulances={[]}
                activeTransfers={dbActiveTransfers}
                onlineDrivers={onlineDrivers}
                busyDrivers={busyDrivers}
                offlineDrivers={offlineDrivers}
                height="650px"
                trackedDriverTrigger={trackedDriverTrigger}
              />
            )}

            {mapView === "list" && (
              <div className="h-[650px] overflow-y-auto">
                <div className="divide-y divide-border">
                  {[...onlineDrivers, ...busyDrivers, ...offlineDrivers].map((driver) => (
                    <div
                      key={driver.id}
                      className="p-4 hover:bg-accent transition-colors"
                      onClick={() => {
                        setMapView("map");
                        setTrackedDriverTrigger({ id: driver.id, timestamp: Date.now() });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 ${getStatusColor(driver.status)} rounded-full`}
                          ></div>
                          <div>
                            <p className="text-foreground text-sm font-mono truncate max-w-[150px]">
                              {driver.id}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {driver.driverName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">
                            {driver.status.toUpperCase()}
                          </p>
                          <p className="text-blue-600 text-[10px]">
                            {new Date(driver.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {[...onlineDrivers, ...busyDrivers, ...offlineDrivers].length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic">
                      No live driver data available.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fleet Overview Sidebar — Map Key */}
          <div className="w-full lg:w-56 border-t lg:border-t-0 lg:border-l border-border/50 p-4 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-900/40 dark:to-gray-900/20 shadow-xl overflow-hidden group/sidebar">
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
                driver acceptance
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
            {activeTransfers.length === 0 ? (
              <div className="p-8 text-center bg-muted/20">
                <p className="text-muted-foreground italic">No active transfers at this moment.</p>
              </div>
            ) : (
              activeTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-6 hover:bg-accent/30 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground">
                          {typeof transfer.patient === 'object' ? transfer.patient.name : transfer.patient}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider ${getPriorityColor(transfer.priority)} `}
                        >
                          {transfer.priority}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transfer.status)} `}
                        >
                          {transfer.status?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        ID: <span className="text-foreground/70 font-mono">{transfer.id}</span> • {transfer.patient?.age || transfer.age}y • {transfer.patient?.gender || transfer.gender}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTrackLive(transfer)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-semibold text-sm cursor-pointer whitespace-nowrap self-start md:self-center"
                    >
                      <Navigation size={18} fill="currentColor" />
                      Track Live
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-accent/30 rounded-xl border border-border/50">
                    <div className="relative pl-6 border-l-2 border-emerald-500">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">Pickup</p>
                      <p className="text-foreground font-semibold text-sm">{transfer.pickup?.hospitalName || transfer.from}</p>
                    </div>
                    <div className="relative pl-6 border-l-2 border-red-500">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">Destination</p>
                      <p className="text-foreground font-semibold text-sm">{transfer.destination?.hospitalName || transfer.to}</p>
                    </div>
                    <div className="relative pl-6 border-l-2 border-blue-500">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">ETA Status</p>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <p className="text-blue-600 dark:text-blue-400 font-bold">{transfer.eta || 'Calculating...'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Ambulance size={16} className="text-muted-foreground" />
                      <span className="font-medium">{transfer.ambulance || 'Unit Assigned'}</span>
                    </div>
                    <div
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-md transition-colors"
                      onClick={() => viewDriverDetails(transfer.driverId)}
                    >
                      <Users size={16} />
                      <span className="font-bold underline underline-offset-4">{transfer.driverName || transfer.driver}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Shield size={16} className="text-muted-foreground" />
                      <span className="font-medium text-xs">Attendant: {transfer.attendant || 'Assigned'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/80 ml-auto">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-xs font-bold">{transfer.distance || '--'} km</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- SECTION: PENDING REQUESTS --- */}
        {/* Transfer requests waiting for assignment or driver acceptance */}
        <div id="pending-requests" className="overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Pending Requests</h2>
            </div>
            {pendingRequests.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg animate-pulse">
                ACTION REQUIRED
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="mx-auto text-emerald-500 mb-2 opacity-20" size={48} />
                <p className="text-muted-foreground italic">No pending requests to accept.</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-6 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-foreground font-bold">
                          {typeof request.patient === 'object' ? request.patient.name : request.patient}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${getPriorityColor(request.priority)} `}>
                          {request.priority}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-tight">
                        Awaiting {request.status === 'dispatched' ? 'Driver Acceptance' : 'Admin Assignment'}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs font-mono bg-accent px-2 py-1 rounded">
                      {request.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-950/50">
                      <p className="text-orange-900/40 dark:text-orange-400/40 text-[9px] uppercase font-bold mb-1">Pickup Point</p>
                      <p className="text-foreground text-sm font-semibold truncate leading-tight">{request.pickup?.hospitalName || request.from}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/50">
                      <p className="text-red-900/40 dark:text-red-400/40 text-[9px] uppercase font-bold mb-1">Requested Destination</p>
                      <p className="text-foreground text-sm font-semibold truncate leading-tight">{request.destination?.hospitalName || request.to}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          <User size={14} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Requested By</p>
                          <p className="text-foreground text-xs font-semibold">{request.requestedBy || 'Staff'}</p>
                        </div>
                      </div>
                      {request.driverId && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Car size={14} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-[10px] text-blue-500 uppercase font-bold leading-none">Assigned Driver</p>
                            <p className="text-foreground text-xs font-semibold">{request.driverName || 'Unit Assigned'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-3'>
                      <button
                        onClick={() => viewDriverDetails(request.driverId || request.driver)}
                        className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent active:scale-95 transition-all text-xs font-bold"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-foreground rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-all active:scale-95 text-xs font-bold whitespace-nowrap"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                className="border-2 border-border rounded-lg p-4 hover:border-red-400 transition-all"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-foreground">{request.patientName}</h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs text-white ${getPriorityColor(
                          request.priority
                        )
                          }`}
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

                <div className="mt-3 flex justify-end gap-3 pl-8">
                  <button
                    onClick={(e) => { e.stopPropagation(); alert(`Accepting emergency from ${request.patientName} `); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all active:scale-95 text-sm cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); alert(`Declining emergency from ${request.patientName} `); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all active:scale-95 text-sm cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); alert(`Viewing details for ${request.patientName}`); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 text-sm cursor-pointer"
                  >
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => toggleResource(resource.id)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer transform hover: scale-[1.02] hover: shadow-md ${resource.available
                  ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-emerald-100/50'
                  : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-700 hover:shadow-red-100/50'
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
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full transition-colors duration-300 ${resource.available
                          ? 'bg-white text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900'
                          : 'bg-white text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900 '
                          }`}
                      >
                        {resource.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`h-8 w-[1px] transition-colors duration-300 ${resource.available ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-red-200 dark:bg-red-800'} `}></div>
                  <Switch
                    checked={resource.available}
                    onCheckedChange={() => toggleResource(resource.id)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 scale-110 shadow-sm pointer-events-none"
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

      {/* --- DRIVER INFO POPUP --- */}
      <Dialog open={driverPopupOpen} onOpenChange={setDriverPopupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Driver Details
            </DialogTitle>
            <DialogDescription>
              {driverPopupData?.id ? `Driver ID: ${driverPopupData.id} ` : 'Loading driver information...'}
            </DialogDescription>
          </DialogHeader>

          {driverPopupLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {driverPopupData?.notFound && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="text-orange-500" size={24} />
              </div>
              <p className="text-muted-foreground text-sm">No location data found for this driver.</p>
              <p className="text-muted-foreground text-xs mt-1">ID: {driverPopupData.id}</p>
            </div>
          )}

          {driverPopupData?.error && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <p className="text-muted-foreground text-sm">Failed to fetch driver details.</p>
            </div>
          )}

          {driverPopupData && !driverPopupData.notFound && !driverPopupData.error && !driverPopupLoading && (
            <div className="space-y-4">
              {/* Driver Name & Status */}
              <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-foreground font-semibold text-lg">
                    {driverPopupData.driverName || 'Unknown Driver'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${driverPopupData.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'} `} />
                    <span className={`text-xs font-medium ${driverPopupData.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'} `}>
                      {driverPopupData.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Latitude
                  </p>
                  <p className="text-foreground text-sm font-mono">
                    {driverPopupData.lat?.toFixed(6) || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Longitude
                  </p>
                  <p className="text-foreground text-sm font-mono">
                    {driverPopupData.lng?.toFixed(6) || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                    <Shield size={12} /> Accuracy
                  </p>
                  <p className="text-foreground text-sm">
                    {driverPopupData.accuracy ? `${driverPopupData.accuracy.toFixed(1)} m` : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                    <Clock size={12} /> Last Active
                  </p>
                  <p className="text-foreground text-sm">
                    {driverPopupData.timestamp
                      ? new Date(driverPopupData.timestamp).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Driver ID */}
              <div className="p-3 bg-accent/30 rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Driver ID</p>
                <p className="text-foreground text-xs font-mono break-all">{driverPopupData.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
    const handleScroll = () => {
      const sections = ['map-section', 'active-transfers', 'pending-requests', 'resource-availability'];

      let current = '';
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Element is considered in view if its top is above the middle of viewport
          // and its bottom is below 100px from the top.
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= 100) {
            current = id;
          }
        }
      }

      // If user scrolled to the absolute bottom of the page
      if (window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 10) {
        current = sections[sections.length - 1];
      }

      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check after a short delay to ensure rendering is complete
    const timeoutId = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const navItems = [
    { id: 'map-section', label: 'Live Map', icon: MapPin, color: 'from-green-500 to-green-600', shadow: 'shadow-green-500/50', count: 0 },
    { id: 'active-transfers', label: 'Active Transfers', icon: ArrowRightLeft, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/50', count: 0 },
    { id: 'pending-requests', label: 'Pending Requests', icon: Clock, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/50', count: pendingCount },
    { id: 'resource-availability', label: 'Resource Availability', icon: Activity, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/50', count: 0 },
  ];

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-3">
      <div className="bg-white/50 dark:bg-black/40 backdrop-blur-xl px-2 py-3 rounded-full shadow-2xl border border-white/20 flex flex-col gap-3 items-center">
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

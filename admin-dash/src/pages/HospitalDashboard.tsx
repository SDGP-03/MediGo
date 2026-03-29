import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ambulance, Clock, AlertCircle, MapPin, Layers, List, Navigation, AlertTriangle, Activity, CheckCircle, User, ArrowRightLeft, Shield, Car, Bed, Stethoscope, Zap, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { AmbulanceMap } from "../components/dashboard/AmbulanceMap";
import { useDriverLocations } from "../useDriverLocations";
import { apiFetch } from "../api/apiClient";
import { database, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, off, get, set } from "firebase/database";
import { TransferCard } from "../components/dashboard/TransferCard";
import { decryptData } from "../utils/encryption";

export function HospitalDashboard() { // The main functional component for the dashboard
  const navigate = useNavigate(); // Hook to change pages
  const [mapView, setMapView] = useState<"map" | "list">("map"); // State to toggle between Map view and List view
  const [selectedRequest, setSelectedRequest] = useState<any>(null); // Stores the request currently being viewed in detail
  const [trackedDriverTrigger, setTrackedDriverTrigger] = useState<{ id: string, timestamp: number } | null>(null); // Trigger used to center the map on a specific driver

  // --- STATE: DRIVER INFO POPUP ---
  const [driverPopupOpen, setDriverPopupOpen] = useState(false); // Controls whether the driver detail popup is visible
  const [driverPopupData, setDriverPopupData] = useState<any>(null); // Stores data for the driver being viewed in the popup
  const [driverPopupLoading, setDriverPopupLoading] = useState(false); // Indicates if driver data is currently being fetched

  // --- STATE: ISSUE NOTIFICATION POPUP ---
  const [issuePopupOpen, setIssuePopupOpen] = useState(false); // Controls the "New Issue" popup
  const [latestIssue, setLatestIssue] = useState<any>(null); // Stores information about the most recent issue reported
  const [lastSeenIssueTime, setLastSeenIssueTime] = useState<number>(Date.now()); // Helps track which issues have already been shown

  // --- STATE: TRANSFER NOTIFICATION ---
  const [lastSeenTransferNotifTime, setLastSeenTransferNotifTime] = useState<number>(Date.now()); // Helps track which transfer alerts have already been shown

  // Function to fetch and show details for a specific driver
  const viewDriverDetails = async (driverId: string) => {
    if (!driverId || driverId === 'Unknown') { // Check if a valid ID was provided
      toast.error('No driver assigned to this request.'); // Show error if no ID
      return;
    }
    setDriverPopupOpen(true);
    setDriverPopupLoading(true);
    setDriverPopupData(null);
    try {
      const user = auth.currentUser; // Get the currently logged-in administrator
      if (!user) throw new Error('Not authenticated');

      // 1. Resolve hospitalId (admin may use hospitalPlaceId or fall back to uid)
      const adminSnap = await get(ref(database, `admin/${user.uid}`));
      const adminData = adminSnap.exists() ? adminSnap.val() : {};
      const hospitalId: string = adminData.hospitalPlaceId || user.uid;

      // 2. Fetch static/membership data from the hospital's driver list
      const driverRef = ref(database, `hospitals/${hospitalId}/drivers/${driverId}`);
      const driverSnap = await get(driverRef);
      const driverData = driverSnap.exists() ? driverSnap.val() : {};
      // 3. Fetch live tracking data from driver_locations
      const locationRef = ref(database, `driver_locations/${driverId}`);
      const locationSnap = await get(locationRef); // Fetch the GPS data
      const locationData = locationSnap.exists() ? locationSnap.val() : {};
      if (driverSnap.exists() || locationSnap.exists()) { // If we found any data for this driver
        // Merge data, prioritizing live location fields if they exist
        const now = Date.now();
        const ts = locationData.timestamp || 0;
        let displayStatus = locationData.status || (locationData.isOnline === true ? 'online' : 'offline'); // Determine status

        // Heartbeat logic: If last update is > 5 mins old, force offline
        if (displayStatus !== 'offline' && (now - ts >= 5 * 60 * 1000)) {
          displayStatus = 'offline';
        }

        setDriverPopupData({ // Update the state with the merged driver info
          id: driverId,
          ...driverData,
          ...locationData,
          status: displayStatus,
          isOnline: displayStatus === 'online',
          isBusy: displayStatus === 'busy'
        });
      } else {
        setDriverPopupData({ id: driverId, notFound: true });
      }
    } catch (err: any) {
      console.error('Error fetching driver details from Firebase:', err);
      setDriverPopupData({ id: driverId, error: true }); // Show an error state in the UI
    } finally {
      setDriverPopupLoading(false);
    }
  };

  // Function to move the map focus to a specific transfer's driver
  const handleTrackLive = (transfer: any) => {
    if (!transfer.driverId) {
      toast.error("No driver assigned to this transfer yet."); // Show error if no driver
      return;
    }
    setMapView("map");
    setTrackedDriverTrigger({ id: transfer.driverId, timestamp: Date.now() }); // Send a signal to the Map component to center on this driver

    setTimeout(() => {
      document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Smoothly scroll the page up to the map
    }, 100);
  };

  // --- STATE: RESOURCE AVAILABILITY ---
  // Initial list of resources the hospital can manage (ICU beds, etc.)
  const [resources, setResources] = useState([
    { id: 'icu', name: 'ICU Bed Availability', available: false },
    { id: 'nicu', name: 'NICU Bed Availability', available: false },
    { id: 'picu', name: 'PICU Bed Availability', available: false },
    { id: 'med_surg', name: 'Med/Surg Bed Availability', available: false },
    { id: 'telemetry', name: 'Telemetry Bed Availability', available: false },
    { id: 'er', name: 'Emergency Room Availability', available: false },
  ]);

  // Icons corresponding to each resource type
  const resourceIcons: Record<string, any> = {
    icu: HeartPulse,
    nicu: Activity,
    picu: Activity,
    med_surg: Bed,
    telemetry: Zap,
    er: Shield
  };

  // Function to toggle a resource (e.g. mark ICU as "Available") and sync with Firebase
  const toggleResource = async (id: string) => {
    // Create a new list where the clicked resource is flipped (true -> false or false -> true)
    const updatedResources = resources.map(r => r.id === id ? { ...r, available: !r.available } : r);
    setResources(updatedResources); // Update the UI immediately (Optimistic Update)

    // Use the resolved hospitalPlaceId (same path the backend & TransferRequest read from)
    const hospitalKey = resolvedHospitalId || auth.currentUser?.uid;
    if (hospitalKey) {
      const resourcesRef = ref(database, `hospitals/${hospitalKey}/resources`);
      await set(resourcesRef, updatedResources);
      toast.success('Resource availability updated.');
    }
  };

  // Function to cancel a transfer request
  const handleCancelRequest = async (requestId: string) => {
    if (!requestId) return; // Stop if no ID provided

    if (window.confirm("Are you sure you want to cancel this transfer request?")) { // Ask the user for confirmation
      try {
        await apiFetch(`/transfers/${requestId}/cancel`, { // Send a request to our NestJS API to cancel
          method: 'PATCH' // PATCH is used for partial updates
        });
        // Optimistic UI update: Remove the cancelled request from our local lists immediately
        setDbPendingRequests(prev => prev.filter(req => req.id !== requestId));
        setDbActiveTransfers(prev => prev.filter(req => req.id !== requestId));
      } catch (error) {
        console.error("Error cancelling request:", error); // Log failure
        toast.error("Failed to cancel request. Please try again."); // Notify the user of failure
      }
    }
  };

  // --- STATE: HOSPITAL PROFILE ---
  const [currentHospitalName, setCurrentHospitalName] = useState<string>(""); // Stores the name of the hospital currently logged in
  const [resolvedHospitalId, setResolvedHospitalId] = useState<string>(""); // The placeId (or uid fallback) used as the Firebase key for this hospital

  // Effect: Run when the component loads to fetch the hospital's profile and initial resource status
  useEffect(() => {
    let resourcesUnsub: () => void = () => { }; // Variable to store our cleanup function for the resources listener

    const unsubscribe = auth.onAuthStateChanged(async (user) => { // Listen for changes in login status
      if (user) { // If a user is logged in
        try {
          const adminRef = ref(database, `admin/${user.uid}`);
          const snapshot = await get(adminRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            setCurrentHospitalName(data.hospitalName || "");

            // Resolve the correct hospital key: placeId takes priority, uid is the fallback
            const hospitalKey: string = data.hospitalPlaceId || user.uid;
            setResolvedHospitalId(hospitalKey);

            // Subscribe to live resource updates under the CORRECT hospital key (placeId-based)
            const resourcesRef = ref(database, `hospitals/${hospitalKey}/resources`);
            const unsubRes = onValue(resourcesRef, (resSnapshot) => {
              if (resSnapshot.exists()) {
                setResources(resSnapshot.val()); // Update the UI whenever Firebase data changes
              }
            });
            resourcesUnsub = () => off(resourcesRef, 'value', unsubRes);
          }
        } catch (err) {
          console.error("Error fetching admin profile:", err);
        }
      }
    });

    return () => { // Cleanup function: runs when the component is unmounted
      unsubscribe(); // Stop listening to Auth changes
      resourcesUnsub(); // Stop listening to Resource changes
    };
  }, []);

  // --- EFFECT: LISTEN FOR NEW ISSUES (Breakdowns, etc.) ---
  useEffect(() => {
    let issueUnsub: () => void = () => { }; // Cleanup function holder

    const unsubscribe = auth.onAuthStateChanged(async (user) => { // Re-check auth whenever it changes
      if (user) {
        try {
          // 1. Resolve hospitalId (admin may use hospitalPlaceId or fall back to uid)
          const adminSnap = await get(ref(database, `admin/${user.uid}`));
          const adminData = adminSnap.exists() ? adminSnap.val() : {};
          const hospitalId: string = adminData.hospitalPlaceId || user.uid; // Get our specific hospital's group ID

          const issuesRef = ref(database, `hospital_issues/${hospitalId}`); // Reference to issues reported for THIS hospital

          // 2. Use onValue to get the latest issues in real-time
          const unsubIssues = onValue(issuesRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val(); // Get all issues
              const issuesArray = Object.values(data) as any[]; // Convert the object into a list

              // Sort by timestamp descending (newest first)
              issuesArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              const newest = issuesArray[0]; // Take the very latest issue

              // Logic to only show popup for NEW issues (reported after the dashboard was opened)
              if (newest && newest.timestamp > lastSeenIssueTime) {
                setLatestIssue(newest); // Store the issue to display in the modal
                setIssuePopupOpen(true); // Open the popup modal
                setLastSeenIssueTime(newest.timestamp); // Update our 'last seen' time so we don't show it twice
              }
            }
          });
          issueUnsub = () => off(issuesRef, 'value', unsubIssues); // Cleanup definition
        } catch (err) {
          console.error("Error setting up issue listener:", err);
        }
      }
    });

    return () => { // Final cleanup
      unsubscribe();
      issueUnsub();
    };
  }, [lastSeenIssueTime]); // Re-run if our 'last seen' tracker changes

  // --- EFFECT: LISTEN FOR INCOMING TRANSFER NOTIFICATIONS (Toasts) ---
  useEffect(() => {
    let notifUnsub: () => void = () => { }; // Cleanup function holder

    const unsubscribe = auth.onAuthStateChanged(async (user) => { // Check auth
      if (user) {
        try {
          // Get the hospital's unique ID
          const adminSnap = await get(ref(database, `admin/${user.uid}`));
          const adminData = adminSnap.exists() ? adminSnap.val() : {};
          const hospitalPlaceId: string = adminData.hospitalPlaceId || user.uid;

          const notifRef = ref(database, `hospital_notifications/${hospitalPlaceId}`); // Reference to incoming alerts

          const unsubNotif = onValue(notifRef, (snapshot) => { // Start listening for live notifications
            if (snapshot.exists()) {
              const data = snapshot.val();
              const notifsArray = Object.values(data) as any[]; // Convert to list

              // Sort newest first
              notifsArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              const newest = notifsArray[0];

              // Logic to only show a "Toast" for NEW incoming transfer requests
              if (newest && newest.type === 'incoming_transfer' && newest.timestamp > lastSeenTransferNotifTime) {
                setLastSeenTransferNotifTime(newest.timestamp); // Update the 'last seen' mark

                const priorityLabel = (newest.priority || 'standard').charAt(0).toUpperCase() + (newest.priority || 'standard').slice(1);

                // Show the "Toast" notification in the UI
                toast(`🚨 Incoming Transfer from ${newest.fromHospital}`, {
                  description: `Priority: ${priorityLabel} • Patient ID: ${newest.patientId}`,
                  duration: 10000, // Show for 10 seconds
                  action: { // Add a button to automatically scroll to the new request
                    label: 'View',
                    onClick: () => {
                      document.getElementById('incoming-emergency')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    },
                  },
                });
              }
            }
          });
          notifUnsub = () => off(notifRef, 'value', unsubNotif); // Stop listening cleanup
        } catch (err) {
          console.error('Error setting up transfer notification listener:', err);
        }
      }
    });

    return () => { // Final level cleanup
      unsubscribe();
      notifUnsub();
    };
  }, [lastSeenTransferNotifTime]);

  const [dbPendingRequests, setDbPendingRequests] = useState<any[]>([]); // List of requests that need attention
  const [dbActiveTransfers, setDbActiveTransfers] = useState<any[]>([]); // List of ambulances currently on the road
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]); // List of emergencies coming to this hospital

  // Collect external driver IDs from active/incoming transfers (to track them on the map)
  const externalDriverIds = Array.from(new Set([
    ...dbActiveTransfers.map(t => t.driverId).filter(Boolean),
    ...incomingRequests.map(t => t.driverId).filter(Boolean)
  ]));

  // Custom hook that gets live data for all our drivers plus any coming from other hospitals
  const { onlineDrivers, busyDrivers, offlineDrivers, isLoading: driversLoading } = useDriverLocations(externalDriverIds);

  // EFFECT: The "Master Listener" for all transfer requests
  useEffect(() => {
    let unsub = () => { }; // Cleanup function holder
    const authUnsub = onAuthStateChanged(auth, (user) => { // Check if user is logged in
      if (!user) { // If not logged in, clear all lists
        setDbPendingRequests([]);
        setDbActiveTransfers([]);
        setIncomingRequests([]);
        return;
      }

      const transfersRef = ref(database, 'transfer_requests'); // Reference to the big folder of all transfers in Firebase

      unsub = onValue(transfersRef, (snapshot) => { // Listen for ANY change in the transfers folder
        const data = snapshot.val() || {}; // Get the raw data
        const allTransfers = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })); // Convert to an easy-to-read list

        // 1. Filter PENDING requests: 
        // These are requests that belong to this hospital and are waiting for a driver or admin action.
        // 'accepted' stays here so the admin can see the driver accepted, but hasn't started navigation yet.
        const pending = allTransfers.filter(t =>
          t.status !== 'cancelled' &&
          t.status !== 'completed' &&
          (t.status === 'pending' || t.status === 'dispatched' || t.status === 'accepted') &&
          (!currentHospitalName || t.pickup?.hospitalName === currentHospitalName)
        );

        // 2. Filter ACTIVE transfers: 
        // Only transfers where the driver has started navigation (in_progress or beyond).
        const active = allTransfers.filter(t =>
          t.status !== 'cancelled' &&
          t.status !== 'completed' &&
          (t.status === 'in_progress' ||
            t.status === 'on_way' ||
            t.status === 'at_pickup' ||
            t.status === 'patient_loaded' ||
            t.status === 'in_transit' ||
            t.status === 'arrived_at_destination') &&
          (!currentHospitalName || t.destination?.hospitalName === currentHospitalName || t.pickup?.hospitalName === currentHospitalName)
        );

        // 3. Filter INCOMING transfers: 
        // These are patients being sent FROM another hospital TO this hospital.
        const incoming = allTransfers.filter(t =>
          t.status !== 'cancelled' &&
          t.status !== 'completed' &&
          t.destination?.hospitalName === currentHospitalName
        ).map(t => ({ // Format the data for our "Incoming Emergency" cards
          patientFormId: t.patient?.id || t.id, // Display user-provided PT-ID if available, else database ID
          patientName: typeof t.patient === 'object' ? t.patient.name : (t.patient || 'Unknown Patient'),
          age: t.patient?.age || t.age || 'N/A',
          gender: t.patient?.gender || t.gender || 'N/A',
          incidentType: t.reason || 'Emergency Transfer',
          priority: t.priority || 'standard',
          pickup: t.pickup,
          destination: t.destination,
          eta: t.eta || 'Evaluating...',
          distance: t.distance || 'N/A',
          ambulanceNumber: t.ambulance || t.ambulanceId || 'Assigned',
          contactNumber: 'N/A',
          symptoms: typeof t.patient === 'object' ? t.patient.currentCondition : 'Not specified',
          consciousness: 'conscious',
          breathing: 'normal',
          driverId: t.driverId,
          driverName: t.driverName,
          timestamp: t.createdAt ? new Date(t.createdAt).toLocaleTimeString() : 'Just now'
        })).reverse(); // Reverse so newest shows at the top

        // For debugging: print the counts to the developer console
        console.log(`[Transfers Debug] Total: ${allTransfers.length}, Pending: ${pending.length}, Active: ${active.length}, Incoming: ${incoming.length}`);

        // Update our state with the filtered lists
        setDbPendingRequests(pending);
        setDbActiveTransfers(active);
        setIncomingRequests(incoming);
      }, (err) => {
        console.error('[Dashboard] Firebase transfers error:', err); // Log errors
      });

    });

    return () => { // Cleanup when closing the page
      authUnsub(); // Stop listening to auth
      unsub(); // Stop listening to transfers
      off(ref(database, 'transfer_requests'), 'value'); // Force turn off the listener
    };
  }, [currentHospitalName]); // Re-run if our hospital name changes

  // --- DATA: INCOMING EMERGENCIES ---
  // Replaced with dynamic stream from setIncomingRequests above.



  // Hardcoded ambulances array was removed. 
  // We use live driver data instead.

  // Helper to count how many ambulances are in each state (for the sidebar)
  const liveDriverCount = onlineDrivers.length + busyDrivers.length + offlineDrivers.length;
  const statusCounts = {
    available: onlineDrivers.length,
    busy: busyDrivers.length,
    offline: offlineDrivers.length,
    total: onlineDrivers.length + busyDrivers.length + offlineDrivers.length,
  };

  const activeTransfers = dbActiveTransfers.length > 0 ? dbActiveTransfers : []; // List of active transfers
  const pendingRequests = dbPendingRequests.length > 0 ? dbPendingRequests : []; // List of pending requests

  // Helper function to get the CSS color based on the current status of an ambulance
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500"; // Green for free
      case "accepted":
        return "bg-blue-400 text-white"; // Light blue for taken
      case "in_progress":
        return "bg-blue-600 text-white"; // Deep blue for working
      case "on_way":
        return "bg-blue-500";
      case "busy":
        return "bg-orange-500"; // Orange for busy
      case "standby":
        return "bg-slate-500";
      case "offline":
        return "bg-red-600"; // Red for offline
      case "in_transit":
        return "bg-blue-100 text-blue-700";
      case "patient_loaded":
        return "bg-green-100 text-green-700";
      case "dispatched":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700"; // Gray for anything else
    }
  };

  // Helper function to get the color for transfer priority (Critical vs Standard)
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-600"; // Red for critical
      case "urgent":
        return "bg-orange-500"; // Orange for urgent
      default:
        return "bg-green-600"; // Green for standard
    }
  };

  return (
    <div className="space-y-6"> {/* Main container with vertical spacing */}

      {/* --- SECTION: MAP & FLEET OVERVIEW --- */}
      {/* This top section contains the interactive map and the sidebar with statistics */}
      <div id="map-section" className="overflow-hidden bg-card rounded-lg shadow-sm border border-border">

        {/* Header of the Map section */}
        <div className="p-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center pl-3">
            {/* Animated "Live" pulse dot */}
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
            <h2 className="bg-card rounded-lg px-3 py-1 text-foreground">
              Live Ambulance Locations
            </h2>
          </div>

          {/* Buttons to switch between Map and List view */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setMapView("map")} // Click to show the Map
              className={`p-2 rounded-lg transition-all active: scale-95 ${mapView === "map" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "hover:bg-accent text-muted-foreground"} `}
            >
              <Layers size={18} /> {/* Map Layers icon */}
            </button>
            <button
              onClick={() => setMapView("list")} // Click to show the List
              className={`p-2 rounded-lg transition-all active: scale-95 ${mapView === "list" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "hover:bg-accent text-muted-foreground"} `}
            >
              <List size={18} /> {/* List icon */}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* THE MAIN CONTENT AREA: Map or List */}
          <div className="flex-1 min-w-0">
            {/* If we are in "map" mode, show the AmbulanceMap component */}
            {mapView === "map" && (
              <AmbulanceMap
                ambulances={[]}
                activeTransfers={dbActiveTransfers} // Give the map the active transfers so it can draw routes
                onlineDrivers={onlineDrivers} // Give the map the available drivers to show markers
                busyDrivers={busyDrivers} // Give the map busy drivers
                offlineDrivers={offlineDrivers} // Give the map offline drivers
                height="650px"
                trackedDriverTrigger={trackedDriverTrigger} // Used to center on a driver when "Track" is clicked
              />
            )}

            {/* If we are in "list" mode, show a scrollable list of all drivers */}
            {mapView === "list" && (
              <div className="h-[650px] overflow-y-auto">
                <div className="divide-y divide-border">
                  {/* Combine all driver types into one list and loop through them */}
                  {[...onlineDrivers, ...busyDrivers, ...offlineDrivers].map((driver) => (
                    <div
                      key={driver.id}
                      className="p-4 hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => { // Clicking a driver in the list focuses them on the map
                        setMapView("map");
                        setTrackedDriverTrigger({ id: driver.id, timestamp: Date.now() });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {/* Avatar or Placeholder icon */}
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border border-border">
                              <User size={18} className="text-muted-foreground" />
                            </div>
                            {/* Small status indicator dot over the avatar */}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStatusColor(driver.status)} border-2 border-background rounded-full`}></div>
                          </div>
                          <div>
                            {/* Driver Name */}
                            <p className="text-foreground text-sm font-semibold truncate max-w-[180px]">
                              {driver.driverName || 'Unknown Driver'}
                            </p>
                            {/* Driver unique ID */}
                            <p className="text-muted-foreground text-xs font-mono">
                              {driver.id}
                            </p>
                          </div>
                        </div>
                        {/* Status label and Time check */}
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
                  {/* Show a message if no drivers were found */}
                  {[...onlineDrivers, ...busyDrivers, ...offlineDrivers].length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic">
                      No live driver data available.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR: FLEET STATUS BREAKDOWN */}
          {/* This is the legend on the right of the map showing summary stats */}
          <div className="w-full lg:w-56 border-t lg:border-t-0 lg:border-l border-border/50 p-4 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-900/40 dark:to-gray-900/20 shadow-xl overflow-hidden group/sidebar">

            {/* Visual glow effects for the background */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover/sidebar:bg-blue-500/20 transition-all duration-700" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover/sidebar:bg-purple-500/20 transition-all duration-700" />

            {/* Sidebar Title and Pulse icon */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-foreground text-sm font-semibold tracking-wide uppercase opacity-70">Fleet Status</h3>
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                <Activity className="text-red-600 relative z-10" size={16} />
              </div>
            </div>

            {/* Total Fleet Count */}
            <div className="mb-6 pb-4 border-b border-white/10 dark:border-white/5 relative z-10 group/total">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Total Fleet</p>
              <p className="text-foreground text-3xl font-bold tracking-tight group-hover/total:scale-105 transition-transform duration-300 origin-left">{statusCounts.total}</p>
            </div>

            {/* Status breakdown with colored labels */}
            <div className="space-y-4 relative z-10">
              {/* Available count */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-300 cursor-default group/item">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300 shadow-sm border border-emerald-500/20">
                    <Ambulance className="text-emerald-600 dark:text-emerald-400" size={16} />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Available</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{statusCounts.available}</span>
              </div>

              {/* Busy count */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-300 cursor-default group/item">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300 shadow-sm border border-orange-500/20">
                    <Clock className="text-orange-600 dark:text-orange-400" size={16} />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Busy</span>
                </div>
                <span className="text-orange-600 dark:text-orange-400 font-bold text-sm bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{statusCounts.busy}</span>
              </div>

              {/* Offline count */}
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

      {/* ALERT BOX: SHOWS IF THERE ARE PENDING REQUESTS THAT NEED ACTION */}
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
        {/* Render a list of transfers that are currently in progress */}
        <div id="active-transfers" className="overflow-hidden bg-card rounded-lg shadow-sm border border-border">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Active Transfers</h2>
          </div>
          <div className="divide-y divide-border">
            {/* If no active transfers, show an empty state message */}
            {activeTransfers.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed border-border m-4">
                <p className="text-muted-foreground italic">No active transfers at this moment.</p>
              </div>
            ) : (
              // Map through active transfers and render a TransferCard for each
              activeTransfers.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  type="active"
                  data={transfer}
                  onTrackLive={handleTrackLive} // Callback for "Track" button
                  onViewDriverDetails={viewDriverDetails} // Callback for "View Driver" button
                />
              ))
            )}
          </div>
        </div>

        {/* --- SECTION: PENDING REQUESTS --- */}
        {/* Render a list of requests waiting to be picked up or accepted by a driver */}
        <div id="pending-requests" className="overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Pending Requests</h2>
            </div>
            {/* If there are pending requests, show a red pulse label */}
            {pendingRequests.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg animate-pulse">
                ACTION REQUIRED
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {/* Empty state check */}
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed border-border m-4">
                <CheckCircle className="mx-auto text-emerald-500/20 mb-2" size={48} />
                <p className="text-muted-foreground italic">No pending requests to accept.</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <TransferCard
                  key={request.id}
                  type="pending"
                  data={request}
                  onViewDriverDetails={viewDriverDetails}
                  onCancelRequest={handleCancelRequest}
                />
              ))
            )}
          </div>
        </div>


        {/* --- SECTION: INCOMING EMERGENCY PATIENTS --- */}
        {/* Render a list of ambulance transfers coming FROM other hospitals to this one */}
        <div id="incoming-emergency" className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Incoming Emergency Patients</h3>
          </div>
          <div className="space-y-4">
            {/* Empty state check */}
            {incomingRequests.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed border-border m-4">
                <p className="text-muted-foreground italic">No incoming emergency patients at this moment.</p>
              </div>
            ) : (
              incomingRequests.map((request) => (
                <TransferCard
                  key={request.id}
                  type="incoming"
                  data={request}
                  onAccept={(req) => toast.success(`Accepting emergency from ${req.patientName}`)} // Action for accepting
                  onDecline={(req) => toast.error(`Declining emergency from ${req.patientName}`)} // Action for declining
                  onViewDetails={(req) => setSelectedRequest(req)} // Show patient info
                />
              ))
            )}
          </div>
        </div>

        {/* --- SECTION: RESOURCE AVAILABILITY --- */}
        {/* A grid of switches to mark things like ICU or ER availability */}
        <div id="resource-availability" className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Resource Availability</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loop through our resources array and render a toggle for each one */}
            {resources.map((resource) => {
              const IconComponent = resourceIcons[resource.id] || Stethoscope;
              return (
                <div
                  key={resource.id}
                  onClick={() => toggleResource(resource.id)} // Toggling updates Firebase
                  className={`flex items-center justify-between p-5 rounded-xl border transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-md ${resource.available
                    ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-emerald-100/50'
                    : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-700 hover:shadow-red-100/50'
                    }`}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`p-3 rounded-xl shadow-sm transition-colors ${resource.available
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                    >
                      <IconComponent size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="font-bold text-foreground text-sm tracking-tight">{resource.name}</h4>
                      <div className="flex">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full transition-colors duration-300 ${resource.available
                            ? 'bg-white text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-white text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900 '
                            }`}
                        >
                          {resource.available ? 'Available' : 'Full / Critical'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 ml-4">
                    <div className={`h-10 w-[1.5px] transition-colors duration-300 ${resource.available ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-red-200 dark:bg-red-800'} `}></div>
                    <Switch
                      checked={resource.available}
                      onCheckedChange={() => toggleResource(resource.id)}
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 scale-125 shadow-sm pointer-events-none"
                    />
                  </div>
                </div>
              );
            })}
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
      {/* This dialog shows detailed information about a driver when clicked */}
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
              {/* Show the Driver ID in the description */}
              {driverPopupData?.id ? `Driver ID: ${driverPopupData.id} ` : 'Loading driver information...'}
            </DialogDescription>
          </DialogHeader>

          {/* Show a spinner while the driver data is being fetched from Firebase */}
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
                    <div className={`w-2.5 h-2.5 rounded-full ${driverPopupData.status === 'online' ? 'bg-emerald-500 animate-pulse' :
                      driverPopupData.status === 'busy' ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`} />
                    <span className={`text-xs font-medium ${driverPopupData.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' :
                      driverPopupData.status === 'busy' ? 'text-orange-600 dark:text-orange-400' :
                        'text-muted-foreground'
                      }`}>
                      {driverPopupData.status === 'online' ? 'Online' :
                        driverPopupData.status === 'busy' ? 'Busy' :
                          'Offline'}
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

      {/* --- POPUP: ISSUE NOTIFICATION --- */}
      {/* This popup appears when a driver reports an urgent issue (like a mechanical failure) */}
      <Dialog open={issuePopupOpen} onOpenChange={setIssuePopupOpen}>
        <DialogContent className="sm:max-w-[425px] border-red-500/20 border-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              New Ambulance Issue Reported
            </DialogTitle>
            <DialogDescription>
              A driver has reported a new issue regarding their vehicle.
            </DialogDescription>
          </DialogHeader>

          {/* Display the details of the reported issue */}
          {latestIssue && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                  {latestIssue.driverName?.charAt(0) || 'D'}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{latestIssue.driverName}</p>
                  <p className="text-xs text-muted-foreground">ID: {latestIssue.driverId}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Issue Type</p>
                <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm font-bold inline-block">
                  {latestIssue.issueType}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Details</p>
                <p className="text-sm p-3 bg-accent/30 rounded-lg border border-border">
                  {latestIssue.details || 'No additional details provided.'}
                </p>
              </div>

              <div className="pt-2 text-[10px] text-muted-foreground text-right italic">
                Reported at: {latestIssue.timestamp ? new Date(latestIssue.timestamp).toLocaleString() : 'Just now'}
              </div>
            </div>
          )}

          {/* Acknowledge button to close the alert */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIssuePopupOpen(false)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all font-semibold text-sm"
            >
              Acknowledge
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- POPUP: INCOMING PATIENT DETAILS --- */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              Emergency Patient Details
            </DialogTitle>
            <DialogDescription>
              Inter-hospital transfer request details for incoming emergency.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Patient Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-accent/30 rounded-2xl border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                    <User className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {decryptData(selectedRequest.patientName)}
                    </h3>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                      <span className="font-mono text-xs bg-accent px-2 py-0.5 rounded">ID: {selectedRequest.patientFormId || (typeof selectedRequest.patient === 'object' ? selectedRequest.patient.id : selectedRequest.id)}</span>
                      <span>•</span>
                      <span>{decryptData(selectedRequest.age)}y</span>
                      <span>•</span>
                      <span className="capitalize">{decryptData(selectedRequest.gender)}</span>
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-center ${selectedRequest.priority === 'critical' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' :
                  selectedRequest.priority === 'urgent' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                    'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  }`}>
                  {selectedRequest.priority} Priority
                </div>
              </div>

              {/* Grid: Locations & Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-accent/20 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                    <MapPin size={14} /> Pickup Point
                  </div>
                  <p className="text-foreground font-semibold text-sm mb-1">{selectedRequest.pickup?.hospitalName || 'N/A'}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{selectedRequest.pickup?.address || 'Address not provided'}</p>
                </div>

                <div className="p-4 bg-accent/20 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest">
                    <Navigation size={14} /> Destination
                  </div>
                  <p className="text-foreground font-semibold text-sm mb-1">{selectedRequest.destination?.hospitalName || 'N/A'}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{selectedRequest.destination?.address || 'Address not provided'}</p>
                </div>
              </div>

              {/* Grid: Status & Timing */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 text-center">
                  <p className="text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase mb-1">ETA</p>
                  <p className="text-blue-700 dark:text-blue-300 font-bold text-sm">{selectedRequest.eta || 'Calculating...'}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20 text-center">
                  <p className="text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase mb-1">Distance</p>
                  <p className="text-purple-700 dark:text-purple-300 font-bold text-sm">{selectedRequest.distance} km</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20 text-center">
                  <p className="text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase mb-1">Request Time</p>
                  <p className="text-orange-700 dark:text-orange-300 font-bold text-sm">{selectedRequest.timestamp}</p>
                </div>
              </div>

              {/* Medical Condition Section */}
              <div className="space-y-3">
                <h4 className="text-foreground font-bold text-sm flex items-center gap-2">
                  <Activity size={16} className="text-red-600" />
                  Medical Information
                </h4>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 space-y-4">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Symptoms & Current Condition</p>
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                      {decryptData(selectedRequest.symptoms) || 'No symptoms specified.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Consciousness</p>
                      <p className="text-foreground text-sm font-semibold capitalize">{selectedRequest.consciousness}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Incident Type</p>
                      <p className="text-foreground text-sm font-semibold capitalize">{selectedRequest.incidentType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Information */}
              <div className="flex items-center justify-between p-4 bg-accent/10 rounded-xl border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Car className="text-muted-foreground" size={20} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Assigned Ambulance</p>
                    <p className="text-foreground text-sm font-bold">{selectedRequest.ambulanceNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Assigned Driver</p>
                    <p className="text-foreground text-sm font-bold">{selectedRequest.driverName || 'Unit Assigned'}</p>
                  </div>
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <User className="text-muted-foreground" size={20} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full py-3 bg-muted text-muted-foreground rounded-xl hover:bg-accent hover:text-foreground active:scale-95 transition-all font-bold text-sm border border-border"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SUBSIDIARY COMPONENT: QUICK NAVIGATION DOCK ---
// This sidebar allows for quick scrolling to different sections of the dashboard
function QuickNav({ pendingCount = 0, incomingCount = 0 }: { pendingCount?: number; incomingCount?: number }) {
  const [activeSection, setActiveSection] = useState<string>(''); // Tracks which section is currently on screen

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id); // Find the element by its ID
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Move the view to that element
    }
  };

  // Effect to track which section is currently visible to highlight the correct nav icon
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['map-section', 'active-transfers', 'pending-requests', 'incoming-emergency', 'resource-availability'];

      let current = '';
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect(); // Get position of the section
          // Check if the section is in the middle of the screen
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= 100) {
            current = id;
          }
        }
      }

      // Special check for the bottom of the page
      if (window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 10) {
        current = sections[sections.length - 1]; // Set last section as active
      }

      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true }); // Bind scroll event
    const timeoutId = setTimeout(handleScroll, 100); // Initial check

    return () => { // Cleanup
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // List of items in the quick navigation menu
  const navItems = [
    { id: 'map-section', label: 'Live Map', icon: MapPin, color: 'from-green-500 to-green-600', shadow: 'shadow-green-500/50', count: 0 },
    { id: 'active-transfers', label: 'Active Transfers', icon: ArrowRightLeft, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/50', count: 0 },
    { id: 'pending-requests', label: 'Pending Requests', icon: Clock, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/50', count: pendingCount }, // Show number of pending requests
    { id: 'incoming-emergency', label: 'Incoming Emergencies', icon: AlertCircle, color: 'from-red-500 to-red-600', shadow: 'shadow-red-500/50', count: incomingCount }, // Show number of incoming emergencies
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
              onClick={() => scrollToSection(item.id)} // Click to scroll
              className="group relative p-2.5 rounded-full transition-all duration-300 ease-out hover:scale-110"
            >
              {/* Active Highlight Background */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive ? `bg-gradient-to-br ${item.color} ${item.shadow} shadow-lg scale-100 opacity-100` : 'opacity-0 scale-75'
                  }`}
              />

              {/* Hover Glow */}
              <div className={`absolute inset-0 rounded-full bg-white/50 transition-all duration-300 ${!isActive ? 'group-hover:opacity-100' : ''} opacity-0`} />

              {/* Icon */}
              <item.icon
                size={18}
                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Alert Notification Bubble */}
              {item.count > 0 && (
                <div className="absolute -top-1 -right-1 z-20 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm ">
                  {item.count}
                </div>
              )}

              {/* Label that appears on hover (Tooltip) */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1 bg-gray-900/90 dark:bg-white/90 backdrop-blur-sm text-white dark:text-gray-900 text-[10px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-1 group-hover:translate-x-0 whitespace-nowrap shadow-xl">
                {item.label}
                {/* Visual arrow pointing back to the icon */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-3 border-[4px] border-transparent border-r-gray-900/90 dark:border-r-white/90" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

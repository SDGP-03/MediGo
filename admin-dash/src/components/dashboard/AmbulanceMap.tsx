import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import { Ambulance, MapPin, Navigation, Car } from 'lucide-react';
import { DriverLocation } from '../../useDriverLocations';

interface AmbulanceLocation {
  id: string;
  status: 'available' | 'on_way' | 'busy' | 'standby' | 'offline';
  driver: string;
  location: string;
  eta?: string;
  lat: number;
  lng: number;
}

// Interface for tracked device from external tracker app
interface TrackedDevice {
  id: string;
  name: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  isTracking: boolean;
}

interface AmbulanceMapProps {
  ambulances: AmbulanceLocation[];
  activeTransfers?: any[];
  onlineDrivers?: DriverLocation[];
  busyDrivers?: DriverLocation[];
  offlineDrivers?: DriverLocation[];
  height?: string;
  trackedDriverTrigger?: { id: string; timestamp: number } | null;
}

// Default center (Colombo, Sri Lanka)
const defaultCenter = {
  lat: 6.9271,
  lng: 79.8612,
};

const defaultZoom = 12;

// Marker colors based on status
const getMarkerColor = (status: string): string => {
  switch (status) {
    case 'available':
      return '#10b981'; // emerald-500
    case 'on_way':
      return '#3b82f6'; // blue-500
    case 'busy':
      return '#f97316'; // orange-500
    case 'standby':
      return '#64748b'; // slate-500
    case 'offline':
      return '#dc2626'; // red-600
    default:
      return '#6b7280'; // gray-500
  }
};

export function AmbulanceMap({
  ambulances,
  activeTransfers = [],
  onlineDrivers = [],
  busyDrivers = [],
  offlineDrivers = [],
  height = '384px',
  trackedDriverTrigger = null
}: AmbulanceMapProps) {
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceLocation | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [showUserLocationInfo, setShowUserLocationInfo] = useState(false);

  // State for external tracked device
  const [trackedDevice, setTrackedDevice] = useState<TrackedDevice | null>(null);

  // Driver locations come from props now
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [selectedOfflineDriver, setSelectedOfflineDriver] = useState<DriverLocation | null>(null);
  const [showTrackedDeviceInfo, setShowTrackedDeviceInfo] = useState(false);


  const libraries = useMemo(() => ['places'] as any, []);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  // --- ADDED FOR MAP ROUTING ---
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const fetchDirections = useCallback((originLat: number, originLng: number, destLat: number, destLng: number) => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) {
      console.warn('[AmbulanceMap] Cannot fetch directions: Google Maps not loaded');
      return;
    }

    console.log(`[AmbulanceMap] Fetching directions from (${originLat}, ${originLng}) to (${destLat}, ${destLng})`);

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          console.log('[AmbulanceMap] Directions fetched successfully');
          setDirections(result);
        } else {
          console.error(`[AmbulanceMap] Error fetching directions: ${status}`);
          setDirections(null);
        }
      }
    );
  }, [isLoaded]);

  // Ref to track last processed trigger to prevent redundant centering on location updates
  const lastTriggerRef = useRef<string | null>(null);

  // Listen for trackedDriverTrigger to center map and show route
  useEffect(() => {
    if (trackedDriverTrigger) {
      const triggerKey = `${trackedDriverTrigger.id}-${trackedDriverTrigger.timestamp}`;
      const isNewTrigger = lastTriggerRef.current !== triggerKey;

      let driver = onlineDrivers.find(d => d.id === trackedDriverTrigger.id);
      if (!driver) driver = busyDrivers.find(d => d.id === trackedDriverTrigger.id);

      if (driver) {
        setSelectedDriver(driver);
        setSelectedOfflineDriver(null);
        setSelectedAmbulance(null);
        setShowUserLocationInfo(false);
        setShowTrackedDeviceInfo(false);

        const activeTransfer = activeTransfers.find(t => t.driverId === driver.id);
        console.log(`[AmbulanceMap] Tracking driver: ${driver.driverName}, ID: ${driver.id}, Active Transfer:`, activeTransfer?.id);

        if (activeTransfer) {
          const toPickup = ['accepted', 'on_way', 'at_pickup', 'dispatched'].includes(activeTransfer.status);
          
          // For inter-hospital transfers (has a destination hospital), the receiving hospital
          // always wants to see the route to the final destination, not the sending hospital.
          const isInterHospitalTransfer = Boolean(activeTransfer.destination?.hospitalName);
          const target = (toPickup && !isInterHospitalTransfer) ? activeTransfer.pickup : activeTransfer.destination;

          console.log(`[AmbulanceMap] Routing to ${toPickup ? 'PICKUP' : 'DESTINATION'} (${activeTransfer.status}). Target:`, target);

          if (target && target.lat && target.lng) {
            fetchDirections(driver.lat, driver.lng, target.lat, target.lng);
          } else {
            console.warn('[AmbulanceMap] Target location missing lat/lng:', target);
            setDirections(null);
          }
        } else {
          setDirections(null);
        }

        // Only force center/zoom if the trigger itself is new (prevents jumping on every location update)
        if (map && isNewTrigger) {
          console.log('[AmbulanceMap] Centering map on tracked driver');
          map.setCenter({ lat: driver.lat, lng: driver.lng });
          map.setZoom(14);
          lastTriggerRef.current = triggerKey;
        }
      } else {
        const offlineDriver = offlineDrivers.find(d => d.id === trackedDriverTrigger.id);
        if (offlineDriver) {
          setSelectedOfflineDriver(offlineDriver);
          setSelectedDriver(null);
          setSelectedAmbulance(null);
          setShowUserLocationInfo(false);
          setShowTrackedDeviceInfo(false);
          if (map && isNewTrigger) {
            map.setCenter({ lat: offlineDriver.lat, lng: offlineDriver.lng });
            map.setZoom(14);
            lastTriggerRef.current = triggerKey;
          }
        }
      }
    }
  }, [trackedDriverTrigger, onlineDrivers, offlineDrivers, activeTransfers, map, fetchDirections]);

  // Listen for location updates from external tracker app via BroadcastChannel
  useEffect(() => {
    // Try to load initial data from localStorage
    try {
      const storedData = localStorage.getItem('medigo-tracked-device');
      if (storedData) {
        const data = JSON.parse(storedData) as TrackedDevice;
        // Only use if data is recent (within last 5 minutes) and tracking is active
        if (data.isTracking && Date.now() - data.timestamp < 5 * 60 * 1000) {
          setTrackedDevice(data);
        }
      }
    } catch (e) {
      console.warn('Could not load tracked device from localStorage:', e);
    }

    // Set up BroadcastChannel listener for real-time updates
    const channel = new BroadcastChannel('medigo-device-tracker');

    channel.onmessage = (event) => {
      const { type, data } = event.data;

      if (type === 'LOCATION_UPDATE') {
        setTrackedDevice(data as TrackedDevice);
      } else if (type === 'TRACKING_STOPPED') {
        setTrackedDevice(prev => prev ? { ...prev, isTracking: false } : null);
      }
    };

    return () => {
      channel.close();
    };
  }, []);


  // Create marker icon function that works after Google Maps loads
  const getMarkerIcon = useCallback((color: string) => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) return undefined;

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8,
    } as google.maps.Symbol;
  }, [isLoaded]);

  // Calculate map bounds to fit all markers including user location, tracked device, and drivers
  const bounds = useMemo(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps || (ambulances.length === 0 && !userLocation && !trackedDevice && onlineDrivers.length === 0 && busyDrivers.length === 0 && offlineDrivers.length === 0)) return null;

    const bounds = new google.maps.LatLngBounds();
    ambulances.forEach((amb) => {
      bounds.extend({ lat: amb.lat, lng: amb.lng });
    });
    if (userLocation) {
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
    }
    if (trackedDevice && trackedDevice.isTracking) {
      bounds.extend({ lat: trackedDevice.lat, lng: trackedDevice.lng });
    }
    // Include driver locations in bounds
    onlineDrivers.forEach((driver) => {
      bounds.extend({ lat: driver.lat, lng: driver.lng });
    });
    // Include busy driver locations in bounds
    busyDrivers.forEach((driver) => {
      bounds.extend({ lat: driver.lat, lng: driver.lng });
    });
    // Include offline drivers in bounds
    offlineDrivers.forEach((driver) => {
      bounds.extend({ lat: driver.lat, lng: driver.lng });
    });
    return bounds;
  }, [isLoaded, ambulances, userLocation, trackedDevice, onlineDrivers, busyDrivers, offlineDrivers]);

  // Fit bounds when map loads
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Only fit bounds if we aren't already tracking or selecting a specific driver
    if (bounds && typeof google !== 'undefined' && !trackedDriverTrigger && !selectedDriver && !selectedOfflineDriver) {
      map.fitBounds(bounds, 50);
    }
  }, [bounds, trackedDriverTrigger, selectedDriver, selectedOfflineDriver]);

  // Re-fit bounds when drivers arrive or change (to prevent disappearance from view)
  useEffect(() => {
    if (map && bounds && !trackedDriverTrigger && !selectedDriver && !selectedOfflineDriver) {
      // Small timeout to ensure markers have rendered
      const timer = setTimeout(() => {
        map.fitBounds(bounds, 50);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [map, bounds, trackedDriverTrigger, selectedDriver, selectedOfflineDriver]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle marker click
  const handleMarkerClick = (ambulance: AmbulanceLocation) => {
    setSelectedAmbulance(ambulance);
    setShowUserLocationInfo(false);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom() || defaultZoom;
      map.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || defaultZoom;
      map.setZoom(currentZoom - 1);
    }
  };

  const handleCenterMap = () => {
    if (map && bounds) {
      map.fitBounds(bounds, 50);
    } else if (map) {
      map.setCenter(defaultCenter);
      map.setZoom(defaultZoom);
    }
  };

  // Center map on user location
  const handleCenterOnUser = () => {
    if (map && userLocation) {
      map.setCenter(userLocation);
      map.setZoom(15);
    }
  };

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(location);

        // Center map on user location if tracking is enabled
        if (map && isTracking) {
          map.setCenter(location);
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout for better accuracy
        maximumAge: 0, // Force fresh location
      }
    );
  }, [map, isTracking]);

  // Start/stop location tracking
  const toggleTracking = useCallback(() => {
    if (isTracking) {
      // Stop tracking
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsTracking(false);
    } else {
      // Start tracking
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return;
      }

      setLocationError(null);
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setUserLocation(location);

          // Update map center if tracking
          if (map) {
            map.setCenter(location);
          }
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setLocationError(errorMessage);
          setIsTracking(false);
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // Increased timeout for better accuracy
          maximumAge: 0, // Force fresh location
        }
      );
      setWatchId(id);
      setIsTracking(true);
    }
  }, [isTracking, watchId, map]);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Create user location marker icon
  const getUserLocationIcon = useCallback(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) return undefined;

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#ef4444', // red-500
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 10,
    } as google.maps.Symbol;
  }, [isLoaded]);

  // Create tracked device marker icon (purple/violet for external tracker)
  const getTrackedDeviceIcon = useCallback(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) return undefined;

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#8b5cf6', // violet-500
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 12,
    } as google.maps.Symbol;
  }, [isLoaded]);

  // Create driver marker icon (green for active drivers)
  const getDriverIcon = useCallback(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) return undefined;

    return {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      fillColor: '#22c55e', // green-500
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 6,
      rotation: 0,
    } as google.maps.Symbol;
  }, [isLoaded]);

  // Create busy driver icon (orange for drivers on a trip)
  const getBusyDriverIcon = useCallback(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) return undefined;

    return {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      fillColor: '#f97316', // orange-500
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 6,
      rotation: 0,
    } as google.maps.Symbol;
  }, [isLoaded]);

  // Create offline driver marker icon (gray for offline drivers)
  const getOfflineDriverIcon = useCallback(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) return undefined;

    return {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      fillColor: '#9ca3af', // gray-400
      fillOpacity: 0.7,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 6,
      rotation: 0,
    } as google.maps.Symbol;
  }, [isLoaded]);

  // Format time ago for offline drivers
  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return 'Over 24 hr ago';
  };

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* --- ADDED FOR MAP ROUTING --- */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              suppressInfoWindows: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: "#3b82f6",
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}

        {ambulances.map((ambulance) => {
          const color = getMarkerColor(ambulance.status);
          const icon = getMarkerIcon(color);

          return (
            <MarkerF
              key={`amb-${ambulance.id}`}
              position={{ lat: ambulance.lat, lng: ambulance.lng }}
              icon={icon}
              onClick={() => handleMarkerClick(ambulance)}
            />
          );
        })}

        {/* User Location Marker */}
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={getUserLocationIcon()}
            title="Your Location"
            zIndex={1000}
            onClick={() => {
              setShowUserLocationInfo(true);
              setSelectedAmbulance(null);
            }}
          />
        )}

        {selectedAmbulance && (
          <InfoWindowF
            position={{ lat: selectedAmbulance.lat, lng: selectedAmbulance.lng }}
            onCloseClick={() => setSelectedAmbulance(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-gray-900 mb-1">{selectedAmbulance.id}</h3>
              <p className="text-gray-600 text-sm mb-1">{selectedAmbulance.driver}</p>
              <p className="text-gray-500 text-xs mb-1">{selectedAmbulance.location}</p>
              {selectedAmbulance.eta && (
                <p className="text-blue-600 text-xs">ETA: {selectedAmbulance.eta}</p>
              )}
            </div>
          </InfoWindowF>
        )}

        {/* User Location Info Window */}
        {userLocation && showUserLocationInfo && (
          <InfoWindowF
            position={userLocation}
            onCloseClick={() => setShowUserLocationInfo(false)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-red-600 mb-1 flex items-center gap-1">
                <MapPin size={14} />
                Your Location
              </h3>
              <p className="text-gray-600 text-xs mb-1">
                {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </p>
              {userLocation.accuracy && (
                <p className="text-gray-500 text-xs mb-1">
                  Accuracy: ±{Math.round(userLocation.accuracy)}m
                </p>
              )}
              {isTracking && (
                <p className="text-green-600 text-xs">📍 Live Tracking Active</p>
              )}
            </div>
          </InfoWindowF>
        )}

        {/* Tracked Device Marker (from external tracker app) */}
        {trackedDevice && trackedDevice.isTracking && (
          <MarkerF
            position={{ lat: trackedDevice.lat, lng: trackedDevice.lng }}
            icon={getTrackedDeviceIcon()}
            title={trackedDevice.name}
            zIndex={1001}
            onClick={() => {
              setShowTrackedDeviceInfo(true);
              setSelectedAmbulance(null);
              setShowUserLocationInfo(false);
            }}
          />
        )}

        {/* Tracked Device Info Window */}
        {trackedDevice && trackedDevice.isTracking && showTrackedDeviceInfo && (
          <InfoWindowF
            position={{ lat: trackedDevice.lat, lng: trackedDevice.lng }}
            onCloseClick={() => setShowTrackedDeviceInfo(false)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-violet-600 mb-1 flex items-center gap-1">
                <Navigation size={14} />
                {trackedDevice.name}
              </h3>
              <p className="text-gray-600 text-xs mb-1">
                ID: {trackedDevice.id}
              </p>
              <p className="text-gray-600 text-xs mb-1">
                {trackedDevice.lat.toFixed(6)}, {trackedDevice.lng.toFixed(6)}
              </p>
              <p className="text-gray-500 text-xs mb-1">
                Accuracy: ±{Math.round(trackedDevice.accuracy)}m
              </p>
              <p className="text-violet-600 text-xs">📡 Live Tracking</p>
            </div>
          </InfoWindowF>
        )}

        {/* Driver Location Markers (from Firebase) */}
        {onlineDrivers.map((driver) => (
          <MarkerF
            key={`driver-${driver.id}`}
            position={{ lat: driver.lat, lng: driver.lng }}
            icon={getDriverIcon()}
            title={driver.driverName}
            zIndex={999}
            onClick={() => {
              setSelectedDriver(driver);
              setSelectedAmbulance(null);
              setShowUserLocationInfo(false);
              setShowTrackedDeviceInfo(false);

              // --- UPDATED FOR MAP ROUTING ---
              const activeTransfer = activeTransfers.find(t => t.driverId === driver.id);
              if (activeTransfer) {
                const toPickup = ['accepted', 'on_way', 'at_pickup', 'dispatched'].includes(activeTransfer.status);
                const isInterHospitalTransfer = Boolean(activeTransfer.destination?.hospitalName);
                const target = (toPickup && !isInterHospitalTransfer) ? activeTransfer.pickup : activeTransfer.destination;

                if (target && target.lat && target.lng) {
                  fetchDirections(driver.lat, driver.lng, target.lat, target.lng);
                } else {
                  setDirections(null);
                }
              } else {
                setDirections(null);
              }
            }}
          />
        ))}

        {/* Busy Driver Location Markers */}
        {busyDrivers.map((driver) => (
          <MarkerF
            key={`driver-${driver.id}`}
            position={{ lat: driver.lat, lng: driver.lng }}
            icon={getBusyDriverIcon()}
            title={`${driver.driverName} (Busy)`}
            zIndex={999}
            onClick={() => {
              setSelectedDriver(driver);
              setSelectedAmbulance(null);
              setShowUserLocationInfo(false);
              setShowTrackedDeviceInfo(false);

              const activeTransfer = activeTransfers.find(t => t.driverId === driver.id);
              if (activeTransfer) {
                const toPickup = ['accepted', 'on_way', 'at_pickup', 'dispatched'].includes(activeTransfer.status);
                const isInterHospitalTransfer = Boolean(activeTransfer.destination?.hospitalName);
                const target = (toPickup && !isInterHospitalTransfer) ? activeTransfer.pickup : activeTransfer.destination;

                if (target && target.lat && target.lng) {
                  fetchDirections(driver.lat, driver.lng, target.lat, target.lng);
                } else {
                  setDirections(null);
                }
              } else {
                setDirections(null);
              }
            }}
          />
        ))}

        {/* Driver Info Window (for both Online and Busy) */}
        {selectedDriver && (
          <InfoWindowF
            position={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
            onCloseClick={() => { setSelectedDriver(null); setDirections(null); }}
            options={{ maxWidth: 180 }}
          >
            <div style={{ padding: '4px 2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: selectedDriver.status === 'busy' ? '#f97316' : '#22c55e',
                  flexShrink: 0
                }} />
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>
                  {selectedDriver.driverName}
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: selectedDriver.status === 'busy' ? '#f97316' : '#16a34a',
                fontWeight: 500
              }}>
                ● {selectedDriver.status === 'busy' ? 'Busy' : 'Online'}
              </span>
            </div>
          </InfoWindowF>
        )}

        {/* Offline Driver Location Markers (grayed out) */}
        {offlineDrivers.map((driver) => (
          <MarkerF
            key={`driver-${driver.id}`}
            position={{ lat: driver.lat, lng: driver.lng }}
            icon={getOfflineDriverIcon()}
            title={`${driver.driverName} (Offline)`}
            zIndex={998}
            onClick={() => {
              setSelectedOfflineDriver(driver);
              setSelectedDriver(null);
              setSelectedAmbulance(null);
              setShowUserLocationInfo(false);
              setShowTrackedDeviceInfo(false);
            }}
          />
        ))}

        {/* Offline Driver Info Window */}
        {selectedOfflineDriver && (
          <InfoWindowF
            position={{ lat: selectedOfflineDriver.lat, lng: selectedOfflineDriver.lng }}
            onCloseClick={() => setSelectedOfflineDriver(null)}
            options={{ maxWidth: 180 }}
          >
            <div style={{ padding: '4px 2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9ca3af', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>
                  {selectedOfflineDriver.driverName}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>● Offline · {formatTimeAgo(selectedOfflineDriver.timestamp)}</span>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Map Controls */}
      <div className="absolute right-4 top-4 bg-white rounded-lg shadow-md overflow-hidden z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-50 border-b border-gray-200 block w-full"
          title="Zoom in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-50 border-b border-gray-200 block w-full"
          title="Zoom out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleCenterMap}
          className="p-2 hover:bg-gray-50 border-b border-gray-200 block w-full"
          title="Center map on all markers"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
        {userLocation && (
          <button
            onClick={handleCenterOnUser}
            className="p-2 hover:bg-gray-50 border-b border-gray-200 block w-full"
            title="Center on my location"
          >
            <Navigation className="h-5 w-5 text-red-600" />
          </button>
        )}
        <button
          onClick={toggleTracking}
          className={`p-2 hover:bg-gray-50 block w-full ${isTracking ? 'bg-red-50' : ''
            }`}
          title={isTracking ? 'Stop tracking' : 'Start tracking my location'}
        >
          <MapPin className={`h-5 w-5 ${isTracking ? 'text-red-600' : 'text-gray-600'}`} />
        </button>
      </div>

      {/* Location Error Message */}
      {locationError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-md z-10 max-w-md">
          <p className="text-sm">{locationError}</p>
          <button
            onClick={() => setLocationError(null)}
            className="text-red-500 hover:text-red-700 text-xs mt-1 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-4 py-3 z-10">
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">En Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Busy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
            <span className="text-gray-700">Standby</span>
          </div>
          {trackedDevice && trackedDevice.isTracking && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-violet-500 rounded-full border-2 border-white"></div>
              <span className="text-gray-700">Tracked Device</span>
            </div>
          )}
          {onlineDrivers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-green-500"></div>
              <span className="text-gray-700">Active Drivers ({onlineDrivers.length})</span>
            </div>
          )}
          {offlineDrivers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-gray-400 opacity-70"></div>
              <span className="text-gray-700">Offline Drivers ({offlineDrivers.length})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

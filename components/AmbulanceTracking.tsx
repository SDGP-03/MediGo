import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Navigation, CheckCircle, User, AlertCircle } from 'lucide-react';

interface AmbulanceTrackingProps {
  booking: any;
}

export function AmbulanceTracking({ booking }: AmbulanceTrackingProps) {
  const [currentETA, setCurrentETA] = useState(booking?.ambulance?.eta || '5 mins');
  const [distance, setDistance] = useState(booking?.ambulance?.distance || 2.5);
  const [ambulancePosition, setAmbulancePosition] = useState(30);

  // Simulate ambulance movement
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulancePosition(prev => {
        if (prev >= 90) return 90;
        return prev + 5;
      });
      
      setDistance(prev => {
        const newDist = prev - 0.2;
        return newDist > 0 ? newDist : 0;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!booking) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-gray-900 mb-2">No Active Booking</h3>
        <p className="text-gray-600">Request an ambulance to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="bg-green-600 text-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle size={32} />
          <div>
            <h2>Ambulance Dispatched</h2>
            <p>Help is on the way</p>
          </div>
        </div>
      </div>

      {/* Map Simulation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Live Location</h3>
        <div className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-lg h-[400px] overflow-hidden">
          {/* Simulated Map */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto text-red-600 mb-2" size={48} />
              <p className="text-gray-700">Your Location</p>
            </div>
          </div>

          {/* Route Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-400 opacity-50 -translate-y-1/2"></div>

          {/* Ambulance Icon */}
          <div
            className="absolute top-1/2 transition-all duration-2000 ease-linear -translate-y-1/2"
            style={{ left: `${ambulancePosition}%` }}
          >
            <div className="bg-white p-3 rounded-full shadow-lg">
              <svg
                className="w-8 h-8 text-red-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 18.5a1.5 1.5 0 0 1-1 1.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1 1.5M19.5 9.5L21.46 12H17V9.5M6 18.5a1.5 1.5 0 0 1-1.5 1.5A1.5 1.5 0 0 1 3 18.5A1.5 1.5 0 0 1 4.5 17A1.5 1.5 0 0 1 6 18.5M20 8h-3V4H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1a3 3 0 0 0 3 3a3 3 0 0 0 3-3h6a3 3 0 0 0 3 3a3 3 0 0 0 3-3h1v-5Z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Ambulance Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Ambulance Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Navigation className="text-red-600 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm">Service Provider</p>
                <p className="text-gray-900">{booking.ambulance.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-red-600 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm">Distance</p>
                <p className="text-gray-900">{distance.toFixed(1)} km away</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="text-red-600 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm">Estimated Arrival</p>
                <p className="text-gray-900">{currentETA}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="text-red-600 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm">Vehicle Number</p>
                <p className="text-gray-900">{booking.ambulance.vehicleNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="text-red-600 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm">Doctor Status</p>
                <p className="text-gray-900">
                  {booking.ambulance.hasDoctor ? 'Doctor on board' : 'Paramedic only'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm">Emergency Type</p>
                <p className="text-gray-900 capitalize">{booking.emergencyLevel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Report */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Incident Report</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-gray-600 text-sm">Patient Name</p>
            <p className="text-gray-900">{booking.incident.patientName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Age</p>
              <p className="text-gray-900">{booking.incident.patientAge} years</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Gender</p>
              <p className="text-gray-900 capitalize">{booking.incident.patientGender}</p>
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Incident Type</p>
            <p className="text-gray-900 capitalize">{booking.incident.incidentType.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Description</p>
            <p className="text-gray-700">{booking.incident.description}</p>
          </div>
          {booking.incident.symptoms && (
            <div>
              <p className="text-gray-600 text-sm">Symptoms</p>
              <p className="text-gray-700">{booking.incident.symptoms}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-3 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors">
          <Phone size={20} />
          <span>Call Ambulance</span>
        </button>
        <button className="flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors">
          <User size={20} />
          <span>Contact Doctor</span>
        </button>
      </div>

      {/* First Aid Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-gray-900 mb-3">While You Wait - First Aid Instructions</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex gap-2">
            <span className="text-yellow-600">•</span>
            <span>Keep the patient calm and comfortable</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-600">•</span>
            <span>Do not move the patient unless absolutely necessary</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-600">•</span>
            <span>Monitor breathing and consciousness level</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-600">•</span>
            <span>If bleeding, apply gentle pressure with clean cloth</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-600">•</span>
            <span>Prepare all medical documents and medications list</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

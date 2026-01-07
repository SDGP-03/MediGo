import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, User, AlertCircle, CheckCircle, Navigation, FileText } from 'lucide-react';

interface ActiveTransferProps {
  transfer: any;
}

export function ActiveTransfer({ transfer }: ActiveTransferProps) {
  const [currentStatus, setCurrentStatus] = useState(transfer.status);
  const [routeProgress, setRouteProgress] = useState(45);

  useEffect(() => {
    const interval = setInterval(() => {
      setRouteProgress(prev => (prev >= 90 ? 90 : prev + 2));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = (newStatus: string) => {
    setCurrentStatus(newStatus);
    alert(`Status updated to: ${newStatus}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600';
      case 'urgent':
        return 'bg-orange-500';
      default:
        return 'bg-green-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-b-3xl p-6 shadow-lg mx-0 -mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
            <Navigation size={24} />
          </div>
          <div>
            <h3 className="text-white mb-1">Transfer {transfer.id}</h3>
            <p className="text-blue-100 text-sm capitalize">{currentStatus.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white bg-opacity-20 rounded-xl p-3">
            <Clock className="mb-2" size={20} />
            <p className="text-sm text-blue-100">ETA</p>
            <p>{transfer.eta}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3">
            <MapPin className="mb-2" size={20} />
            <p className="text-sm text-blue-100">Distance</p>
            <p>{transfer.distance} km</p>
          </div>
        </div>
      </div>

      {/* Route Progress */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <h4 className="text-gray-900 mb-3">Route Progress</h4>
          <div className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-xl h-48 overflow-hidden mb-4">
            {/* Origin */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <MapPin size={20} />
              </div>
            </div>

            {/* Route Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 -translate-y-1/2"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-1000"
              style={{ width: `${routeProgress}%` }}
            ></div>

            {/* Ambulance */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000"
              style={{ left: `${routeProgress}%` }}
            >
              <div className="bg-white p-2 rounded-full shadow-xl border-2 border-red-600 -ml-4">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 18.5a1.5 1.5 0 0 1-1 1.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1 1.5M19.5 9.5L21.46 12H17V9.5M6 18.5a1.5 1.5 0 0 1-1.5 1.5A1.5 1.5 0 0 1 3 18.5A1.5 1.5 0 0 1 4.5 17A1.5 1.5 0 0 1 6 18.5M20 8h-3V4H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1a3 3 0 0 0 3 3a3 3 0 0 0 3-3h6a3 3 0 0 0 3 3a3 3 0 0 0 3-3h1v-5Z"/>
                </svg>
              </div>
            </div>

            {/* Destination */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <MapPin size={20} />
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-green-900 text-sm mb-1">Pickup Location</p>
                <p className="text-gray-900">{transfer.from.name}</p>
                <p className="text-gray-600 text-xs">{transfer.from.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-red-900 text-sm mb-1">Destination</p>
                <p className="text-gray-900">{transfer.to.name}</p>
                <p className="text-gray-600 text-xs">{transfer.to.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-gray-900">Patient Information</h4>
            <span className={`px-3 py-1 rounded-full text-xs text-white ${getPriorityColor(transfer.priority)}`}>
              {transfer.priority.toUpperCase()}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User className="text-gray-400" size={20} />
              <div>
                <p className="text-gray-600 text-xs">Patient Name</p>
                <p className="text-gray-900">{transfer.patient.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-600 text-xs mb-1">Age</p>
                <p className="text-gray-900">{transfer.patient.age}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-600 text-xs mb-1">Gender</p>
                <p className="text-gray-900">{transfer.patient.gender}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-600 text-xs mb-1">Blood</p>
                <p className="text-gray-900">{transfer.patient.bloodGroup}</p>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-900 text-sm mb-1">Condition</p>
              <p className="text-gray-900 text-sm">{transfer.patient.condition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Updates */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <h4 className="text-gray-900 mb-4">Update Transfer Status</h4>
          <div className="space-y-3">
            <button
              onClick={() => handleStatusUpdate('dispatched')}
              disabled={currentStatus !== 'assigned'}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-95 ${
                currentStatus === 'dispatched'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Navigation className="text-blue-600" size={20} />
                <span className="text-gray-900">En Route to Pickup</span>
              </div>
              {currentStatus === 'dispatched' && <CheckCircle className="text-blue-600" size={20} />}
            </button>

            <button
              onClick={() => handleStatusUpdate('arrived_pickup')}
              disabled={currentStatus !== 'dispatched'}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-95 ${
                currentStatus === 'arrived_pickup'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="text-green-600" size={20} />
                <span className="text-gray-900">Arrived at Pickup</span>
              </div>
              {currentStatus === 'arrived_pickup' && <CheckCircle className="text-green-600" size={20} />}
            </button>

            <button
              onClick={() => handleStatusUpdate('patient_loaded')}
              disabled={currentStatus !== 'arrived_pickup'}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-95 ${
                currentStatus === 'patient_loaded'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="text-purple-600" size={20} />
                <span className="text-gray-900">Patient Loaded</span>
              </div>
              {currentStatus === 'patient_loaded' && <CheckCircle className="text-purple-600" size={20} />}
            </button>

            <button
              onClick={() => handleStatusUpdate('arrived_destination')}
              disabled={currentStatus !== 'patient_loaded'}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-95 ${
                currentStatus === 'arrived_destination'
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="text-orange-600" size={20} />
                <span className="text-gray-900">Arrived at Destination</span>
              </div>
              {currentStatus === 'arrived_destination' && <CheckCircle className="text-orange-600" size={20} />}
            </button>

            <button
              onClick={() => handleStatusUpdate('completed')}
              disabled={currentStatus !== 'arrived_destination'}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-95 ${
                currentStatus === 'completed'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-900">Transfer Completed</span>
              </div>
              {currentStatus === 'completed' && <CheckCircle className="text-green-600" size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
        <a
          href={`tel:${transfer.from.contact}`}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          <Phone size={20} />
          <span>Call Pickup</span>
        </a>
        <a
          href={`tel:${transfer.to.contact}`}
          className="flex items-center justify-center gap-2 bg-green-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          <Phone size={20} />
          <span>Call Destination</span>
        </a>
      </div>

      {/* Report Issue */}
      <div className="mx-4 mb-4">
        <button className="w-full flex items-center justify-center gap-2 bg-red-50 border-2 border-red-200 text-red-600 p-4 rounded-xl active:scale-95 transition-transform">
          <AlertCircle size={20} />
          <span>Report Issue</span>
        </button>
      </div>
    </div>
  );
}

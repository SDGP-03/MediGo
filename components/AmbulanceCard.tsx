import { MapPin, Clock, User, Star, CheckCircle, AlertCircle } from 'lucide-react';

interface AmbulanceCardProps {
  ambulance: {
    id: number;
    name: string;
    type: 'public' | 'private';
    distance: number;
    eta: string;
    availability: 'available' | 'limited';
    hasDoctor: boolean;
    price: number;
    rating: number;
    vehicleNumber: string;
  };
  onSelect: () => void;
  isCritical?: boolean;
}

export function AmbulanceCard({ ambulance, onSelect, isCritical }: AmbulanceCardProps) {
  const availabilityColor = ambulance.availability === 'available' ? 'bg-green-500' : 'bg-yellow-500';
  const availabilityText = ambulance.availability === 'available' ? 'Available' : 'Limited';

  return (
    <div
      className={`border-2 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${
        isCritical && ambulance.distance < 2
          ? 'border-red-600 bg-red-50'
          : 'border-gray-200 hover:border-red-400'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-gray-900">{ambulance.name}</h4>
            <span
              className={`px-2 py-1 rounded text-xs text-white ${
                ambulance.type === 'public' ? 'bg-blue-600' : 'bg-purple-600'
              }`}
            >
              {ambulance.type === 'public' ? 'Public' : 'Private'}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{ambulance.vehicleNumber}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${availabilityColor}`} title={availabilityText}></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-400" />
          <span className="text-gray-700 text-sm">{ambulance.distance} km</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <span className="text-gray-700 text-sm">ETA {ambulance.eta}</span>
        </div>
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="text-gray-700 text-sm">{ambulance.rating}</span>
        </div>
        <div className="flex items-center gap-2">
          {ambulance.hasDoctor ? (
            <>
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-green-600 text-sm">Doctor</span>
            </>
          ) : (
            <>
              <AlertCircle size={16} className="text-gray-400" />
              <span className="text-gray-500 text-sm">No Doctor</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div>
          {ambulance.price === 0 ? (
            <span className="text-green-600">Free (Public)</span>
          ) : (
            <span className="text-gray-900">₹{ambulance.price}</span>
          )}
        </div>
        <button
          className={`px-6 py-2 rounded-lg text-white transition-colors ${
            isCritical && ambulance.distance < 2
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isCritical && ambulance.distance < 2 ? 'Request Now' : 'Select'}
        </button>
      </div>
    </div>
  );
}

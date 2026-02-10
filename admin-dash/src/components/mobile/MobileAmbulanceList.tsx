import { useState } from 'react';
import { MapPin, Clock, Star, User, Phone, Navigation, Filter } from 'lucide-react';

interface MobileAmbulanceListProps {
  serviceType: string;
  emergencyLevel: string;
  location: string;
  onSelect: (ambulance: any) => void;
  onBack: () => void;
}

export function MobileAmbulanceList({ serviceType, emergencyLevel, location, onSelect, onBack }: MobileAmbulanceListProps) {
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const ambulances = [
    {
      id: 1,
      name: 'LifeCare Ambulance',
      type: 'private',
      distance: 0.8,
      eta: '3 mins',
      availability: 'available',
      hasDoctor: true,
      price: 2500,
      rating: 4.9,
      vehicleNumber: 'AMB-102',
    },
    {
      id: 2,
      name: 'City Emergency Services',
      type: 'public',
      distance: 1.2,
      eta: '4 mins',
      availability: 'available',
      hasDoctor: true,
      price: 0,
      rating: 4.8,
      vehicleNumber: 'AMB-001',
    },
    {
      id: 3,
      name: 'Metro Medical Transport',
      type: 'private',
      distance: 2.1,
      eta: '7 mins',
      availability: 'limited',
      hasDoctor: false,
      price: 1800,
      rating: 4.6,
      vehicleNumber: 'AMB-205',
    },
    {
      id: 4,
      name: 'RapidCare Emergency',
      type: 'private',
      distance: 1.5,
      eta: '5 mins',
      availability: 'available',
      hasDoctor: true,
      price: 3200,
      rating: 4.7,
      vehicleNumber: 'AMB-410',
    },
  ];

  const filteredAmbulances = ambulances
    .filter(amb => {
      if (filterType === 'public') return amb.type === 'public';
      if (filterType === 'private') return amb.type === 'private';
      return true;
    })
    .sort((a, b) => a.distance - b.distance);

  const isCritical = emergencyLevel === 'critical';

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-red-600 flex items-center gap-2"
        >
          ← Back
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm"
        >
          <Filter size={18} />
          <span>Filter</span>
        </button>
      </div>

      {/* Critical Banner */}
      {isCritical && (
        <div className="bg-red-600 text-white rounded-2xl p-4 shadow-lg animate-pulse">
          <p className="mb-1">🚨 CRITICAL EMERGENCY</p>
          <p className="text-sm text-red-100">Showing closest available services</p>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-md space-y-3">
          <h4 className="text-gray-900">Filter by Provider</h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`py-2 rounded-lg text-sm transition-all ${
                filterType === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('public')}
              className={`py-2 rounded-lg text-sm transition-all ${
                filterType === 'public'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setFilterType('private')}
              className={`py-2 rounded-lg text-sm transition-all ${
                filterType === 'private'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Private
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <p className="text-gray-700">
          <span className="text-red-600">{filteredAmbulances.length}</span> ambulances available near you
        </p>
      </div>

      {/* Ambulance Cards */}
      <div className="space-y-3">
        {filteredAmbulances.map(ambulance => (
          <div
            key={ambulance.id}
            className={`bg-white rounded-2xl p-4 shadow-md border-2 ${
              isCritical && ambulance.distance < 2
                ? 'border-red-600'
                : 'border-transparent'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-gray-900">{ambulance.name}</h4>
                  <div className={`w-2 h-2 rounded-full ${
                    ambulance.availability === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs text-white ${
                    ambulance.type === 'public' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}>
                    {ambulance.type === 'public' ? 'Public' : 'Private'}
                  </span>
                  <span className="text-gray-600 text-sm">{ambulance.vehicleNumber}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-700 text-sm">{ambulance.distance} km</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-700 text-sm">{ambulance.eta}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-gray-700 text-sm">{ambulance.rating}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className={ambulance.hasDoctor ? 'text-green-600' : 'text-gray-400'} />
                <span className={`text-sm ${ambulance.hasDoctor ? 'text-green-600' : 'text-gray-500'}`}>
                  {ambulance.hasDoctor ? 'Doctor' : 'Paramedic'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                {ambulance.price === 0 ? (
                  <p className="text-green-600">Free (Public Service)</p>
                ) : (
                  <p className="text-gray-900">₹{ambulance.price}</p>
                )}
              </div>
              <button
                onClick={() => onSelect(ambulance)}
                className={`px-6 py-3 rounded-xl text-white shadow-lg active:scale-95 transition-transform ${
                  isCritical && ambulance.distance < 2
                    ? 'bg-red-600'
                    : 'bg-blue-600'
                }`}
              >
                {isCritical && ambulance.distance < 2 ? 'Request Now' : 'Select'}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm active:scale-95 transition-transform">
                <Phone size={16} />
                <span>Call</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm active:scale-95 transition-transform">
                <Navigation size={16} />
                <span>Locate</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Call Button */}
      <a
        href="tel:108"
        className="flex items-center justify-center gap-2 w-full bg-red-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-transform"
      >
        <Phone size={20} />
        <span>Emergency Call 108</span>
      </a>
    </div>
  );
}

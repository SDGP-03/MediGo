import { useState } from 'react';
import { MapPin, Search, Phone, AlertCircle, Stethoscope, Droplet, Package } from 'lucide-react';
import { AmbulanceCard } from './AmbulanceCard';
import { IncidentReportForm } from './IncidentReportForm';

interface EmergencyRequestProps {
  onBookingCreated: (booking: any) => void;
}

type ServiceType = 'patient' | 'blood' | 'equipment';
type EmergencyLevel = 'critical' | 'urgent' | 'standard';

export function EmergencyRequest({ onBookingCreated }: EmergencyRequestProps) {
  const [serviceType, setServiceType] = useState<ServiceType>('patient');
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('standard');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [location, setLocation] = useState('');
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<any>(null);

  // Mock ambulance data
  const ambulances = [
    {
      id: 1,
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
      id: 2,
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
      name: 'Government Hospital Ambulance',
      type: 'public',
      distance: 3.5,
      eta: '10 mins',
      availability: 'available',
      hasDoctor: false,
      price: 0,
      rating: 4.5,
      vehicleNumber: 'AMB-301',
    },
    {
      id: 5,
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
      if (filterType === 'private') return amb.type === 'private' && amb.price <= maxPrice;
      return true;
    })
    .sort((a, b) => {
      if (emergencyLevel === 'critical') {
        return a.distance - b.distance;
      }
      return a.distance - b.distance;
    });

  const handleSelectAmbulance = (ambulance: any) => {
    setSelectedAmbulance(ambulance);
    setShowIncidentForm(true);
  };

  const handleIncidentSubmit = (incidentData: any) => {
    const booking = {
      id: Date.now(),
      ambulance: selectedAmbulance,
      incident: incidentData,
      serviceType,
      emergencyLevel,
      timestamp: new Date(),
      status: 'dispatched',
    };
    onBookingCreated(booking);
  };

  const isCritical = emergencyLevel === 'critical';

  return (
    <div className="space-y-6">
      {/* Emergency Banner */}
      {isCritical && (
        <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle size={32} />
            <div>
              <h2>CRITICAL EMERGENCY MODE</h2>
              <p>Redirecting to closest available service provider</p>
            </div>
          </div>
        </div>
      )}

      {/* Service Type Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Select Service Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setServiceType('patient')}
            className={`p-4 rounded-lg border-2 transition-all ${
              serviceType === 'patient'
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <Stethoscope className={serviceType === 'patient' ? 'text-red-600' : 'text-gray-400'} size={32} />
            <p className={serviceType === 'patient' ? 'text-red-600' : 'text-gray-700'}>Patient Transport</p>
          </button>
          <button
            onClick={() => setServiceType('blood')}
            className={`p-4 rounded-lg border-2 transition-all ${
              serviceType === 'blood'
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <Droplet className={serviceType === 'blood' ? 'text-red-600' : 'text-gray-400'} size={32} />
            <p className={serviceType === 'blood' ? 'text-red-600' : 'text-gray-700'}>Blood Transport</p>
          </button>
          <button
            onClick={() => setServiceType('equipment')}
            className={`p-4 rounded-lg border-2 transition-all ${
              serviceType === 'equipment'
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <Package className={serviceType === 'equipment' ? 'text-red-600' : 'text-gray-400'} size={32} />
            <p className={serviceType === 'equipment' ? 'text-red-600' : 'text-gray-700'}>Equipment Transport</p>
          </button>
        </div>
      </div>

      {/* Emergency Level */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Emergency Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setEmergencyLevel('critical')}
            className={`p-4 rounded-lg border-2 transition-all ${
              emergencyLevel === 'critical'
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <span>Critical</span>
            </div>
          </button>
          <button
            onClick={() => setEmergencyLevel('urgent')}
            className={`p-4 rounded-lg border-2 transition-all ${
              emergencyLevel === 'urgent'
                ? 'border-orange-600 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>Urgent</span>
            </div>
          </button>
          <button
            onClick={() => setEmergencyLevel('standard')}
            className={`p-4 rounded-lg border-2 transition-all ${
              emergencyLevel === 'standard'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-600"></div>
              <span>Standard</span>
            </div>
          </button>
        </div>
      </div>

      {/* Location Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Your Location</h3>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Enter your location or use GPS"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Filter Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Service Provider Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-2 rounded-lg border ${
                  filterType === 'all'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('public')}
                className={`flex-1 py-2 rounded-lg border ${
                  filterType === 'public'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setFilterType('private')}
                className={`flex-1 py-2 rounded-lg border ${
                  filterType === 'private'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Private
              </button>
            </div>
          </div>

          {filterType === 'private' && (
            <div>
              <label className="block text-gray-700 mb-2">Max Price: ₹{maxPrice}</label>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Available Ambulances */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">
          Available Ambulances ({filteredAmbulances.length})
        </h3>
        <div className="space-y-4">
          {filteredAmbulances.map(ambulance => (
            <AmbulanceCard
              key={ambulance.id}
              ambulance={ambulance}
              onSelect={() => handleSelectAmbulance(ambulance)}
              isCritical={isCritical}
            />
          ))}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-600 text-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3>Need Immediate Help?</h3>
            <p>Call emergency services directly</p>
          </div>
          <button className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <Phone size={20} />
            <span>Call 108</span>
          </button>
        </div>
      </div>

      {/* Incident Report Form Modal */}
      {showIncidentForm && (
        <IncidentReportForm
          ambulance={selectedAmbulance}
          serviceType={serviceType}
          onSubmit={handleIncidentSubmit}
          onClose={() => {
            setShowIncidentForm(false);
            setSelectedAmbulance(null);
          }}
        />
      )}
    </div>
  );
}

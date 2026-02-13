// Import icons from lucide-react library for UI elements
import { MapPin, Clock, User, Star, CheckCircle, AlertCircle } from 'lucide-react';

// Interface defining the props expected by the AmbulanceCard component
interface AmbulanceCardProps {
  // Ambulance object containing all ambulance details
  ambulance: {
    id: number; // Unique identifier for the ambulance
    name: string; // Name of the ambulance service
    type: 'public' | 'private'; // Type of ambulance service
    distance: number; // Distance from user's location in kilometers
    eta: string; // Estimated time of arrival
    availability: 'available' | 'limited'; // Current availability status
    hasDoctor: boolean; // Whether ambulance has a doctor on board
    price: number; // Price for the service (0 for public)
    rating: number; // Service rating
    vehicleNumber: string; // Vehicle registration number
  };
  onSelect: () => void; // Callback function when ambulance is selected
  isCritical?: boolean; // Optional flag indicating if this is a critical emergency
}

// Main AmbulanceCard component - displays individual ambulance information in a card format
export function AmbulanceCard({ ambulance, onSelect, isCritical }: AmbulanceCardProps) {
  // Determine the color for availability indicator (green for available, yellow for limited)
  const availabilityColor = ambulance.availability === 'available' ? 'bg-green-500' : 'bg-yellow-500';
  // Set text for availability status
  const availabilityText = ambulance.availability === 'available' ? 'Available' : 'Limited';

  return (
    // Main card container with conditional styling based on critical status and distance
    <div
      className={`border-2 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${isCritical && ambulance.distance < 2
          ? 'border-red-600 bg-red-50' // Highlight nearby ambulances in critical situations
          : 'border-gray-200 hover:border-red-400' // Default styling with hover effect
        }`}
      onClick={onSelect} // Make entire card clickable
    >
      {/* Header section: Ambulance name, type badge, and availability indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {/* Ambulance name and type badge row */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-gray-900">{ambulance.name}</h4>
            {/* Type badge - blue for public, purple for private */}
            <span
              className={`px-2 py-1 rounded text-xs text-white ${ambulance.type === 'public' ? 'bg-blue-600' : 'bg-purple-600'
                }`}
            >
              {ambulance.type === 'public' ? 'Public' : 'Private'}
            </span>
          </div>
          {/* Vehicle registration number */}
          <p className="text-gray-600 text-sm">{ambulance.vehicleNumber}</p>
        </div>
        {/* Availability status indicator (colored dot) */}
        <div className={`w-3 h-3 rounded-full ${availabilityColor}`} title={availabilityText}></div>
      </div>

      {/* Info grid section: Distance, ETA, Rating, and Doctor availability */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {/* Distance from user's location */}
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-400" />
          <span className="text-gray-700 text-sm">{ambulance.distance} km</span>
        </div>
        {/* Estimated time of arrival */}
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <span className="text-gray-700 text-sm">ETA {ambulance.eta}</span>
        </div>
        {/* Service rating */}
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="text-gray-700 text-sm">{ambulance.rating}</span>
        </div>
        {/* Doctor availability indicator */}
        <div className="flex items-center gap-2">
          {ambulance.hasDoctor ? (
            // Show green checkmark if doctor is available
            <>
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-green-600 text-sm">Doctor</span>
            </>
          ) : (
            // Show gray alert icon if no doctor available
            <>
              <AlertCircle size={16} className="text-gray-400" />
              <span className="text-gray-500 text-sm">No Doctor</span>
            </>
          )}
        </div>
      </div>

      {/* Footer section: Price and Select button */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        {/* Price display - shows "Free (Public)" for public ambulances, price for private */}
        <div>
          {ambulance.price === 0 ? (
            <span className="text-green-600">Free (Public)</span>
          ) : (
            <span className="text-gray-900">₹{ambulance.price}</span>
          )}
        </div>
        {/* Select/Request button - changes color and text based on critical status */}
        <button
          className={`px-6 py-2 rounded-lg text-white transition-colors ${isCritical && ambulance.distance < 2
              ? 'bg-red-600 hover:bg-red-700' // Red button for critical nearby ambulances
              : 'bg-blue-600 hover:bg-blue-700' // Blue button for regular selection
            }`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card's onClick from firing
            onSelect(); // Trigger selection callback
          }}
        >
          {/* Button text changes based on critical status and proximity */}
          {isCritical && ambulance.distance < 2 ? 'Request Now' : 'Select'}
        </button>
      </div>
    </div>
  );
}

import { Navigation, AlertCircle, Clock, CheckCircle, MapPin, Phone } from 'lucide-react';

interface DriverHomeProps {
  activeTransfer: any;
  onNavigate: (view: 'home' | 'active' | 'history' | 'profile') => void;
}

export function DriverHome({ activeTransfer, onNavigate }: DriverHomeProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Status Card */}
      <div className={`rounded-2xl p-6 shadow-xl ${
        activeTransfer
          ? 'bg-gradient-to-br from-green-500 to-green-700'
          : 'bg-gradient-to-br from-blue-500 to-blue-700'
      } text-white`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {activeTransfer ? <Navigation size={24} /> : <CheckCircle size={24} />}
          </div>
          <div>
            <h2 className="text-white mb-1">
              {activeTransfer ? 'Transfer in Progress' : 'Available'}
            </h2>
            <p className="text-sm opacity-90">
              {activeTransfer ? 'Patient loaded and en route' : 'Ready for assignment'}
            </p>
          </div>
        </div>
        {activeTransfer && (
          <button
            onClick={() => onNavigate('active')}
            className="w-full bg-white text-green-700 py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            View Active Transfer
          </button>
        )}
      </div>

      {/* Today's Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <h3 className="text-gray-900 mb-4">Today's Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded-xl text-center">
            <p className="text-2xl text-blue-600 mb-1">3</p>
            <p className="text-gray-600 text-xs">Completed</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl text-center">
            <p className="text-2xl text-green-600 mb-1">42</p>
            <p className="text-gray-600 text-xs">Total km</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-center">
            <p className="text-2xl text-purple-600 mb-1">6.2</p>
            <p className="text-gray-600 text-xs">Hours</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <h3 className="text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600" size={24} />
              <div className="text-left">
                <p className="text-gray-900">Report Issue</p>
                <p className="text-gray-600 text-sm">Vehicle or equipment problem</p>
              </div>
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-600" size={24} />
              <div className="text-left">
                <p className="text-gray-900">Break Time</p>
                <p className="text-gray-600 text-sm">Mark break or rest period</p>
              </div>
            </div>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-green-50 rounded-xl active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <MapPin className="text-green-600" size={24} />
              <div className="text-left">
                <p className="text-gray-900">Update Location</p>
                <p className="text-gray-600 text-sm">Manually update position</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Safety Checklist */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <h3 className="text-gray-900 mb-4">Daily Safety Checklist</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" className="w-5 h-5 text-red-600" defaultChecked />
            <span className="text-gray-900 text-sm">Vehicle inspection completed</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" className="w-5 h-5 text-red-600" defaultChecked />
            <span className="text-gray-900 text-sm">Medical equipment verified</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" className="w-5 h-5 text-red-600" defaultChecked />
            <span className="text-gray-900 text-sm">Oxygen supply checked</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" className="w-5 h-5 text-red-600" />
            <span className="text-gray-900 text-sm">End of shift report</span>
          </label>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-red-600 text-white rounded-2xl p-4 shadow-md">
        <h3 className="mb-3">Emergency Contacts</h3>
        <div className="space-y-2">
          <a
            href="tel:+94112345678"
            className="flex items-center justify-between bg-white bg-opacity-20 rounded-xl p-3 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-2">
              <Phone size={18} />
              <span>Dispatch Center</span>
            </div>
            <span className="text-sm">+94 11 234 5678</span>
          </a>
          <a
            href="tel:108"
            className="flex items-center justify-between bg-white bg-opacity-20 rounded-xl p-3 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-2">
              <Phone size={18} />
              <span>Emergency Services</span>
            </div>
            <span className="text-sm">108</span>
          </a>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4">
        <h4 className="text-gray-900 mb-3">Driver Tips</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>✓ Always confirm patient identity before loading</p>
          <p>✓ Update transfer status at each stage</p>
          <p>✓ Keep receiving hospital informed of ETA</p>
          <p>✓ Document any issues immediately</p>
        </div>
      </div>
    </div>
  );
}

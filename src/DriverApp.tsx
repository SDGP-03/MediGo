import { useState } from 'react';
import { Home, Navigation, FileText, User } from 'lucide-react';
import { DriverHome } from './components/driver/DriverHome';
import { ActiveTransfer } from './components/driver/ActiveTransfer';
import { TransferHistory } from './components/driver/TransferHistory';
import { DriverProfile } from './components/driver/DriverProfile';

type DriverView = 'home' | 'active' | 'history' | 'profile';

export default function DriverApp() {
  const [currentView, setCurrentView] = useState<DriverView>('home');
  const [activeTransfer, setActiveTransfer] = useState<any>({
    id: 'TR-2401',
    patient: {
      name: 'Sarah Johnson',
      age: 45,
      gender: 'Female',
      bloodGroup: 'A+',
      condition: 'Stable - Cardiac monitoring required',
    },
    from: {
      name: 'City General Hospital',
      address: '123 Main Street',
      contact: '+94 11 234 5678',
    },
    to: {
      name: 'Central Medical Center',
      address: '456 Park Avenue',
      contact: '+94 11 876 5432',
    },
    priority: 'urgent',
    status: 'patient_loaded',
    pickupTime: '14:30',
    eta: '12 mins',
    distance: 8.5,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Status Bar */}
      <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
        <span className="text-sm">9:41</span>
        <div className="flex gap-2">
          <div className="w-4 h-4">📶</div>
          <div className="w-4 h-4">🔋</div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <Navigation size={24} />
          </div>
          <div>
            <h1 className="text-white">Driver App</h1>
            <p className="text-red-100 text-sm">AMB-003 • John Smith</p>
          </div>
        </div>
        {activeTransfer && currentView !== 'active' && (
          <button
            onClick={() => setCurrentView('active')}
            className="w-full bg-white bg-opacity-20 rounded-lg p-3 mt-3 text-left"
          >
            <p className="text-sm text-red-100 mb-1">Active Transfer</p>
            <p className="text-white">{activeTransfer.id} - {activeTransfer.patient.name}</p>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {currentView === 'home' && (
          <DriverHome 
            activeTransfer={activeTransfer}
            onNavigate={setCurrentView}
          />
        )}
        {currentView === 'active' && (
          <ActiveTransfer transfer={activeTransfer} />
        )}
        {currentView === 'history' && <TransferHistory />}
        {currentView === 'profile' && <DriverProfile />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center justify-center gap-1 ${
              currentView === 'home' ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            <Home size={22} />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => setCurrentView('active')}
            className={`flex flex-col items-center justify-center gap-1 relative ${
              currentView === 'active' ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            <Navigation size={22} />
            <span className="text-xs">Active</span>
            {activeTransfer && (
              <div className="absolute top-2 right-6 w-2 h-2 bg-red-600 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex flex-col items-center justify-center gap-1 ${
              currentView === 'history' ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            <FileText size={22} />
            <span className="text-xs">History</span>
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center justify-center gap-1 ${
              currentView === 'profile' ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            <User size={22} />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

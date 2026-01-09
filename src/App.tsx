import { useState } from 'react';
import { Activity, Ambulance, Users, BarChart3, Smartphone, Monitor, LogOut } from 'lucide-react';
import { TransferRequest } from './components/hospital/TransferRequest';
import { AmbulanceFleet } from './components/hospital/AmbulanceFleet';
import { PatientRecords } from './components/hospital/PatientRecords';
import { HospitalDashboard } from './components/hospital/HospitalDashboard';
import { AnalyticsDashboard } from './components/hospital/AnalyticsDashboard';
import { LoginPage } from './components/auth/LoginPage';
import DriverApp from './DriverApp';

type View = 'dashboard' | 'transfer' | 'fleet' | 'records' | 'analytics';

interface HospitalAccount {
  hospitalId: string;
  email: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDriverView, setIsDriverView] = useState(false);
  const [hospitalAccount, setHospitalAccount] = useState<HospitalAccount | null>(null);

  const handleLogin = (hospitalId: string, email: string) => {
    setHospitalAccount({ hospitalId, email });
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      setHospitalAccount(null);
      setCurrentView('dashboard');
    }
  };

  // Show login page if not authenticated
  if (!hospitalAccount) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Hospital names mapping
  const hospitalNames: Record<string, string> = {
    'CGH-001': 'City General Hospital',
    'CMC-002': 'Central Medical Center',
    'SCH-003': 'Specialist Care Hospital',
  };

  if (isDriverView) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDriverView(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          <Monitor size={18} />
          <span>Hospital View</span>
        </button>
        <DriverApp />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <Activity className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-red-600">MediGo Hospital Transfer System</h1>
                <p className="text-gray-600 text-sm">Inter-Hospital Patient Transfer Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDriverView(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Smartphone size={18} />
                <span>Driver App</span>
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 text-sm">{hospitalNames[hospitalAccount.hospitalId] || 'Hospital'}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'dashboard'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity size={18} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('transfer')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'transfer'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Ambulance size={18} />
              <span>Transfer Request</span>
            </button>
            <button
              onClick={() => setCurrentView('fleet')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'fleet'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Ambulance size={18} />
              <span>Ambulance Fleet</span>
            </button>
            <button
              onClick={() => setCurrentView('records')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'records'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={18} />
              <span>Patient Records</span>
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                currentView === 'analytics'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && <HospitalDashboard />}
        {currentView === 'transfer' && <TransferRequest />}
        {currentView === 'fleet' && <AmbulanceFleet />}
        {currentView === 'records' && <PatientRecords />}
        {currentView === 'analytics' && <AnalyticsDashboard />}
      </main>
    </div>
  );
}
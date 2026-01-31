import { useState } from 'react';
import { Ambulance, Users, BarChart3, LogOut, Activity } from 'lucide-react';
import { TransferRequest } from './components/hospital/TransferRequest';
import { AmbulanceFleet } from './components/hospital/AmbulanceFleet';
import { PatientRecords } from './components/hospital/PatientRecords';
import { HospitalDashboard } from './components/hospital/HospitalDashboard';
import { AnalyticsDashboard } from './components/hospital/AnalyticsDashboard';
import { LoginPage } from './components/auth/LoginPage';

type View = 'dashboard' | 'transfer' | 'fleet' | 'records' | 'analytics';

interface HospitalAccount {
  hospitalId: string;
  email: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
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

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="MediGo Logo" className="h-10 w-auto" />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 rounded-full border border-gray-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 text-sm font-medium">{hospitalNames[hospitalAccount.hospitalId] || 'Hospital'}</span>
              </div>

              <div className="h-6 w-px bg-gray-200"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <nav className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentView === 'dashboard'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Activity size={16} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentView('transfer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentView === 'transfer'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Ambulance size={16} />
            <span>Transfer</span>
          </button>
          <button
            onClick={() => setCurrentView('fleet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentView === 'fleet'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Ambulance size={16} />
            <span>Fleet</span>
          </button>
          <button
            onClick={() => setCurrentView('records')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentView === 'records'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Users size={16} />
            <span>Records</span>
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentView === 'analytics'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentView === 'dashboard' && <HospitalDashboard />}
          {currentView === 'transfer' && <TransferRequest />}
          {currentView === 'fleet' && <AmbulanceFleet />}
          {currentView === 'records' && <PatientRecords />}
          {currentView === 'analytics' && <AnalyticsDashboard />}
        </div>
      </main>
    </div>
  );
}
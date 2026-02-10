import { useState, useEffect } from 'react';
import { Ambulance, Users, BarChart3, LogOut, Activity, Loader2 } from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { TransferRequest } from './components/hospital/TransferRequest';
import { AmbulanceFleet } from './components/hospital/AmbulanceFleet';
import { PatientRecords } from './components/hospital/PatientRecords';
import { HospitalDashboard } from './components/hospital/HospitalDashboard';
import { Analytics } from './components/Analytics';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';

type View = 'dashboard' | 'transfer' | 'fleet' | 'records' | 'analytics';
type AuthView = 'login' | 'register';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    // User state will be updated by onAuthStateChanged listener
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        await signOut(auth);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login or register page if not authenticated
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onBackToLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onRegister={() => setAuthView('register')}
      />
    );
  }

  // Get display name from email
  const displayName = user.email?.split('@')[0] || 'User';

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
                <span className="text-gray-600 text-sm font-medium capitalize">{displayName}</span>
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
          {currentView === 'analytics' && <Analytics />}
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { TransferRequest } from './pages/TransferRequest';
import { AmbulanceFleet } from './pages/AmbulanceFleet';
import { PatientRecords } from './pages/PatientRecords';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { Analytics } from './pages/Analytics';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Header } from './components/layout/Header';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { SupportPage } from './components/auth/SupportPage';


// type View = 'dashboard' | 'transfer' | 'fleet' | 'records' | 'analytics';
type AuthView = 'login' | 'register' | 'forgot-password' | 'support';

export default function App() {

  //default page is dashboard, 1. removing due to importing the router-dom
  // const [currentView, setCurrentView] = useState<View>('dashboard');


  const [authView, setAuthView] = useState<AuthView>('login');
  //specifies the initially user can be null (either user object or null value)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    //when app closes, tell the system to stop watching
    return () => unsubscribe();
  },
    []//run once app starts
  );

  const handleLogin = () => {
    // User state will be updated by onAuthStateChanged listener
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        await signOut(auth);
        // 2. since removing the useState and redirect is handled automatically by auth check 
        // setCurrentView('dashboard');
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
    if (authView === 'forgot-password') {
      return <ForgotPassword onBackToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'support') {
      return <SupportPage onBackToLogin={() => setAuthView('login')} />;
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        onRegister={() => setAuthView('register')}
        onForgotPassword={() => setAuthView('forgot-password')}
        onSupport={() => setAuthView('support')}
      />
    );
  }


  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header
        user={user}
        // 3. removing 
        // currentView={currentView}
        // onViewChange={setCurrentView}
        onLogout={handleLogout}
      />





      {/* Main Content */}
      <main className="max-w-[90%] mx-auto px-6 py-8 pb-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* using routing */}
          <Routes>
            <Route path='/' element={<HospitalDashboard />} />
            <Route path='/transfer' element={<TransferRequest />} />
            <Route path='/fleet' element={<AmbulanceFleet />} />
            <Route path='/records' element={<PatientRecords />} />
            <Route path='/analytics' element={<Analytics />} />

            {/* catch all redirect to dashboard */}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>







          {/* old navigation */}
          {/* {currentView === 'dashboard' && <HospitalDashboard />}
          {currentView === 'transfer' && <TransferRequest />}
          {currentView === 'fleet' && <AmbulanceFleet />}
          {currentView === 'records' && <PatientRecords onNavigate={setCurrentView} />}
          {currentView === 'analytics' && <Analytics />} */}
        </div>
      </main>
    </div>
  );
}
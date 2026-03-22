import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from './firebase';
import { TransferRequest } from './pages/TransferRequest';
import { AmbulanceFleet } from './pages/AmbulanceFleet';
import { PatientRecords } from './pages/PatientRecords';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Header } from './components/layout/Header';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { SupportPage } from './components/auth/SupportPage';
import { DriverProfiles } from './pages/DriverProfiles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import { Toaster } from './components/ui/sonner';


// type View = 'dashboard' | 'transfer' | 'fleet' | 'records' | 'analytics';
type AuthView = 'login' | 'register' | 'forgot-password' | 'support';

export default function App() {

  //default page is dashboard, 1. removing due to importing the router-dom
  // const [currentView, setCurrentView] = useState<View>('dashboard');


  const [authView, setAuthView] = useState<AuthView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          let currentRole = (tokenResult.claims.role as string) || null;

          const adminSnap = await get(ref(database, `admin/${currentUser.uid}`));
          if (adminSnap.exists()) {
            setAdminName(adminSnap.val().name);
            if (!currentRole) {
              currentRole = adminSnap.val().role || null;
            }
          }
          setUserRole(currentRole);
        } catch (error) {
          console.error('Error fetching admin data:', error);
        }
      } else {
        setAdminName(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });
    //when app closes, tell the system to stop watching
    return () => unsubscribe();
  }, []//run once app starts
  );

  const handleLogin = () => {
    // User state will be updated by onAuthStateChanged listener
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setShowLogoutDialog(false);
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
    <div className="min-h-screen bg-background text-foreground">
      <Header
        user={user}
        adminName={adminName}
        userRole={userRole}
        onLogout={handleLogout}
      />





      {/* Main Content */}
      <main className="max-w-[90%] mx-auto px-6 py-8 pb-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* using routing */}
          <Routes>
            {userRole === 'fleetofficer' ? (
              <>
                <Route path='/' element={<Navigate to='/fleet' replace />} />
                <Route path='/fleet' element={<AmbulanceFleet userRole={userRole} />} />
                <Route path='/drivers' element={<DriverProfiles />} />
                <Route path='/settings' element={<Settings adminName={adminName} setAdminName={setAdminName} />} />
              </>
            ) : (
              <>
                <Route path='/' element={<HospitalDashboard />} />
                <Route path='/transfer' element={<TransferRequest />} />
                <Route path='/fleet' element={<AmbulanceFleet userRole={userRole} />} />
                <Route path="/drivers" element={<DriverProfiles />} />
                <Route path='/records' element={<PatientRecords />} />
                <Route path='/analytics' element={<Analytics />} />
                <Route path='/settings' element={<Settings adminName={adminName} setAdminName={setAdminName} />} />
                
                {userRole === 'superadmin' && (
                  <Route path='/register' element={<RegisterPage onBackToLogin={() => window.location.href = '/'} />} />
                )}
              </>
            )}

            {/* catch all redirect to dashboard (or fleet for officer) */}
            <Route path='*' element={<Navigate to={userRole === 'fleetofficer' ? '/fleet' : '/'} replace />} />
          </Routes>







          {/* old navigation */}
          {/* {currentView === 'dashboard' && <HospitalDashboard />}
          {currentView === 'transfer' && <TransferRequest />}
          {currentView === 'fleet' && <AmbulanceFleet />}
          {currentView === 'records' && <PatientRecords onNavigate={setCurrentView} />}
          {currentView === 'analytics' && <Analytics />} */}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              onClick={confirmLogout}
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="top-right" expand={true} richColors />
    </div>
  );
}
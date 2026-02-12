import { useState } from 'react';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

interface LoginPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: unknown) {
      let errorMessage = 'An error occurred during sign in.';

      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string };
        switch (firebaseError.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          default:
            errorMessage = 'Failed to sign in. Please try again.';
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="MediGo Logo" className="h-16 w-auto" />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-gray-900 mb-4">Hospital Management Portal</h2>
                <p className="text-gray-600">
                  Streamline your hospital's ambulance operations with our comprehensive emergency medical transport management system.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Real-Time Tracking</h4>
                    <p className="text-gray-600 text-sm">Monitor all ambulances and transfers in real-time with live GPS tracking and status updates.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Smart Dispatching</h4>
                    <p className="text-gray-600 text-sm">Automated ambulance assignment based on proximity, availability, and patient requirements.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Digital Records</h4>
                    <p className="text-gray-600 text-sm">Centralized patient records shared securely between hospitals for better coordination.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <img src="/logo.png" alt="MediGo Logo" className="h-12 w-auto" />
            </div>

            <div className="mb-8">
              <h2 className="text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your hospital dashboard</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-900 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="admin@hospital.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-red-600 rounded" />
                  <span className="text-gray-700 text-sm">Remember me</span>
                </label>
                <button type="button"  className="text-red-600 text-sm hover:underline">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm mb-4">
                Don't have an account?{' '}
                <button
                  onClick={onRegister}
                  className="text-red-600 hover:underline font-medium"
                >
                  Register as Admin
                </button>
              </p>
              <p className="text-gray-500 text-xs">
                Need help? <button className="text-red-600 hover:underline">Contact Support</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

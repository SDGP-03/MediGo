import { useState } from 'react';
import { Mail, MapPin, Lock, AlertCircle, Eye, EyeOff, User, Building2, CheckCircle, UserPlus, Shield } from 'lucide-react';
import { auth } from '../../firebase';
import Autocomplete from 'react-google-autocomplete';
import { useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

const libraries = ['places'] as any;

interface RegisterPageProps {
    onBackToLogin: () => void;
}

export function RegisterPage({ onBackToLogin }: RegisterPageProps) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<'hospitaladmin' | 'fleetofficer'>('hospitaladmin');

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });


    //enhanced state for Hospital
    const [hospitalName, setHospitalName] = useState('');
    const [hospitalDetails, setHospitalDetails] = useState<{
        address: string;
        lat: number;
        lng: number;
        placeId: string;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Validate password strength
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        // Ensure a hospital was actually selected from the list
        if (!hospitalDetails) {
            setError('Please select a valid hospital from search suggestions.');
            return;
        }



        setIsLoading(true);

        try {
            const idToken = await auth.currentUser?.getIdToken(true);
            if (!idToken) throw new Error("Not authenticated as Super Admin");

            const response = await fetch('http://localhost:3001/api/auth/create-hospital-staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    hospitalName,
                    placeId: hospitalDetails.placeId,
                    role,
                    address: hospitalDetails.address,
                    lat: hospitalDetails.lat,
                    lng: hospitalDetails.lng
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create account');
            }

            setSuccess(true);
        } catch (err: unknown) {
            let errorMessage = 'An error occurred during registration.';

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (err && typeof err === 'object' && 'code' in err) {
                const firebaseError = err as { code: string };
                switch (firebaseError.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'An account with this email already exists.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'Email/password accounts are not enabled.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password is too weak. Use at least 6 characters.';
                        break;
                    default:
                        errorMessage = 'Failed to create account. Please try again.';
                }
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSuccess(false);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setHospitalName('');
        setHospitalDetails(null);
        setRole('hospitaladmin');
        setError('');
    };

    if (success) {
        return (
            <div className="space-y-6 pt-2 px-6 pb-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        Create Staff Account
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Provision new hospital admin or fleet officer accounts
                    </p>
                </div>

                {/* Success Card */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-sm">
                    <div className="flex flex-col items-center text-center max-w-md mx-auto py-8">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                            Staff Account Created!
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            The staff account has been created successfully. They can now sign in using their credentials.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => navigate('/')}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Create Another
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-2 px-6 pb-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        Create Staff Account
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Provision new hospital admin or fleet officer accounts
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <p>Only super admins can create new staff accounts. The new user will be able to log in immediately after creation.</p>
            </div>

            {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                                    placeholder="Enter full name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                                    placeholder="admin@hospital.com"
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                            >
                                <option value="hospitaladmin">Hospital Admin</option>
                                <option value="fleetofficer">Fleet Officer</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Hospital Information Section */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hospital Information</h2>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hospital Name</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />

                            {isLoaded ? (
                                <Autocomplete
                                    onPlaceSelected={(place) => {
                                        setHospitalName(place.name);
                                        setHospitalDetails({
                                            address: place.formatted_address,
                                            lat: place.geometry.location.lat(),
                                            lng: place.geometry.location.lng(),
                                            placeId: place.place_id
                                        });
                                    }}
                                    options={{
                                        types: ['hospital'],
                                        componentRestrictions: { country: 'lk' },
                                        fields: ['name', 'formatted_address', 'geometry', 'place_id'],
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                                    placeholder="Search your hospital in Sri Lanka..."
                                />
                            ) : (
                                <input
                                    disabled
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                    placeholder="Loading map data..."
                                />
                            )}
                        </div>
                        {hospitalDetails && (
                            <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <MapPin size={12} /> {hospitalDetails.address}
                            </p>
                        )}
                    </div>
                </section>

                {/* Security Section */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                                    placeholder="At least 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full pl-10 pr-12 py-2.5 text-sm border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:border-transparent outline-none transition ${
                                        confirmPassword && password !== confirmPassword
                                            ? 'border-red-400 dark:border-red-600 focus:ring-red-500'
                                            : 'border-gray-200 dark:border-gray-700 focus:ring-red-500'
                                    }`}
                                    placeholder="Confirm password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-500">Passwords do not match.</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all shadow-md hover:shadow-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                Create Account
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

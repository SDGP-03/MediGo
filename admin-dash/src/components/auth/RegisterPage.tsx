import { useState } from 'react';
import { Mail, MapPin, Lock, AlertCircle, Eye, EyeOff, User, Building2, CheckCircle } from 'lucide-react';
import { auth } from '../../firebase';
import Autocomplete from 'react-google-autocomplete';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries = ['places'] as any;

interface RegisterPageProps {
    onBackToLogin: () => void;
}

export function RegisterPage({ onBackToLogin }: RegisterPageProps) {
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

            const response = await fetch('http://localhost:3001/auth/create-hospital-staff', {
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

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-gray-900 text-2xl font-semibold mb-4">Registration Successful!</h2>
                        <p className="text-gray-600 mb-8">
                            Your admin account has been created successfully. You can now sign in with your credentials.
                        </p>
                        <button
                            onClick={onBackToLogin}
                            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                    {/* Header */}
                    <div className="flex items-center justify-center mb-8">
                        <img src="/logo.png" alt="MediGo Logo" className="h-12 w-auto" />
                    </div>

                    <div className="mb-8">
                        <h2 className="text-gray-900 text-2xl font-semibold mb-2">Create Staff Account</h2>
                        <p className="text-gray-600">Register a hospital admin or fleet officer</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-red-900 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-gray-700 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                                    placeholder="Enter Name"
                                />
                            </div>
                        </div>

                        {/* The google autocomplete input*/}
                        <div>
                            <label className="block text-gray-700 mb-2">Hospital Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />

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
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
                                        placeholder="Search your hospital in Sri Lanka..."
                                    />
                                ) : (
                                    <input
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none bg-gray-50 text-gray-500"
                                        placeholder="Loading map data..."
                                    />
                                )}
                            </div>
                            {hospitalDetails && (
                                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                    <MapPin size={12} /> {hospitalDetails.address}
                                </p>
                            )}
                        </div>

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
                            <label className="block text-gray-700 mb-2">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white"
                            >
                                <option value="hospitaladmin">Hospital Admin</option>
                                <option value="fleetofficer">Fleet Officer</option>
                            </select>
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
                                    placeholder="At least 6 characters"
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

                        <div>
                            <label className="block text-gray-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            <button
                                type="button"
                                onClick={onBackToLogin}
                                className="text-red-600 hover:underline font-medium"
                            >
                                Back to Dashboard
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

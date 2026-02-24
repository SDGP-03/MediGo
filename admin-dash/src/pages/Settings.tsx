import { User, Bell, Shield, Smartphone, Mail, Globe, Monitor, Eye, EyeOff, X, CheckCircle, AlertCircle, Lock, LogOut, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    signOut,
    deleteUser,
} from 'firebase/auth';
import { auth } from '../firebase';

// ── password strength helper ──────────────────────────────────────────────
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score, label: 'Very Weak', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Weak', color: 'bg-orange-500' };
    if (score === 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 4) return { score, label: 'Strong', color: 'bg-blue-500' };
    return { score, label: 'Very Strong', color: 'bg-green-500' };
}

export function Settings() {
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        marketing: false,
    });

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    // ── change-password modal ─────────────────────────────────────────────
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwToast, setPwToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // ── sign-out modal ────────────────────────────────────────────────────
    const [showSignOut, setShowSignOut] = useState(false);
    const [signOutLoading, setSignOutLoading] = useState(false);

    // ── delete account modal ──────────────────────────────────────────────
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePw, setShowDeletePw] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteToast, setDeleteToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const strength = getPasswordStrength(pwForm.newPw);

    const resetPasswordModal = () => {
        setPwForm({ current: '', newPw: '', confirm: '' });
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setPwToast(null);
        setShowChangePassword(false);
    };

    const handleChangePassword = async () => {
        if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
            setPwToast({ type: 'error', message: 'All fields are required.' });
            return;
        }
        if (pwForm.newPw.length < 8) {
            setPwToast({ type: 'error', message: 'New password must be at least 8 characters.' });
            return;
        }
        if (pwForm.newPw !== pwForm.confirm) {
            setPwToast({ type: 'error', message: 'New passwords do not match.' });
            return;
        }
        if (pwForm.current === pwForm.newPw) {
            setPwToast({ type: 'error', message: 'New password must differ from the current password.' });
            return;
        }

        const user = auth.currentUser;
        if (!user || !user.email) {
            setPwToast({ type: 'error', message: 'No authenticated user found. Please log in again.' });
            return;
        }

        setPwLoading(true);
        setPwToast(null);

        try {
            // Re-authenticate to verify the current password with Firebase
            const credential = EmailAuthProvider.credential(user.email, pwForm.current);
            await reauthenticateWithCredential(user, credential);

            // Current password verified — now update to the new password
            await updatePassword(user, pwForm.newPw);

            setPwLoading(false);
            setPwToast({ type: 'success', message: 'Password changed successfully!' });
            setTimeout(() => resetPasswordModal(), 1800);
        } catch (err: unknown) {
            setPwLoading(false);
            let message = 'Failed to update password. Please try again.';
            if (err && typeof err === 'object' && 'code' in err) {
                const code = (err as { code: string }).code;
                if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                    message = 'Current password is incorrect.';
                } else if (code === 'auth/too-many-requests') {
                    message = 'Too many attempts. Please wait a moment and try again.';
                } else if (code === 'auth/weak-password') {
                    message = 'New password is too weak. Choose a stronger password.';
                } else if (code === 'auth/requires-recent-login') {
                    message = 'Session expired. Please log out and log in again before changing your password.';
                }
            }
            setPwToast({ type: 'error', message });
        }
    };

    const handleSignOut = async () => {
        setSignOutLoading(true);
        try {
            await signOut(auth);
            // Redirect to login — the app's auth guard will handle navigation
            window.location.href = '/';
        } catch {
            setSignOutLoading(false);
            setShowSignOut(false);
        }
    };

    const handleDeleteAccount = async () => {
        const user = auth.currentUser;
        if (!user || !user.email) {
            setDeleteToast({ type: 'error', message: 'No authenticated user found.' });
            return;
        }
        if (!deletePassword) {
            setDeleteToast({ type: 'error', message: 'Please enter your password to confirm.' });
            return;
        }
        setDeleteLoading(true);
        setDeleteToast(null);
        try {
            const credential = EmailAuthProvider.credential(user.email, deletePassword);
            await reauthenticateWithCredential(user, credential);
            await deleteUser(user);
            window.location.href = '/';
        } catch (err: unknown) {
            setDeleteLoading(false);
            let message = 'Failed to delete account. Please try again.';
            if (err && typeof err === 'object' && 'code' in err) {
                const code = (err as { code: string }).code;
                if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                    message = 'Incorrect password.';
                } else if (code === 'auth/too-many-requests') {
                    message = 'Too many attempts. Please wait and try again.';
                }
            }
            setDeleteToast({ type: 'error', message });
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Profile Section */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 p-[2px]">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                    <User className="w-10 h-10 text-gray-400" />
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-medium">Change</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">Admin User</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">admin@medigo.com</p>
                            <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </section>

                {/* Appearance Section */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </section>

                {/* Notifications Section */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${notifications.email ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications on your device</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${notifications.push ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.push ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Security Section */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                        >
                            <span className="font-medium text-gray-900 dark:text-white">Change Password</span>
                            <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</span>
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group">
                            <span className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</span>
                            <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</span>
                        </button>
                    </div>
                </section>

                {/* ── Change Password Modal ──────────────────────────────────────── */}
                {showChangePassword && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                                </div>
                                <button
                                    onClick={resetPasswordModal}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">
                                {/* Toast */}
                                {pwToast && (
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${pwToast.type === 'success'
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                        }`}>
                                        {pwToast.type === 'success'
                                            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                                        {pwToast.message}
                                    </div>
                                )}

                                {/* Current Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={pwForm.current}
                                            onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                                            placeholder="Enter current password"
                                            className="w-full pr-10 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={pwForm.newPw}
                                            onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                                            placeholder="Enter new password"
                                            className="w-full pr-10 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Strength meter */}
                                    {pwForm.newPw && (
                                        <div className="space-y-1">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className={`text-xs font-medium ${strength.color
                                                .replace('bg-', 'text-')
                                                .replace('-500', '-600')
                                                }`}>{strength.label}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={pwForm.confirm}
                                            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                            placeholder="Confirm new password"
                                            className={`w-full pr-10 px-4 py-2.5 rounded-xl border ${pwForm.confirm && pwForm.newPw !== pwForm.confirm
                                                ? 'border-red-400 dark:border-red-600 focus:ring-red-500'
                                                : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
                                                } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:border-transparent outline-none transition`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                                        <p className="text-xs text-red-500">Passwords do not match.</p>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 px-6 pb-6">
                                <button
                                    onClick={resetPasswordModal}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={pwLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium transition-all shadow-md hover:shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {pwLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Updating...
                                        </>
                                    ) : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Language & Region */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Language & Region</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                            <select className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option>English (US)</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Zone</label>
                            <select className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option>Pacific Time (PT)</option>
                                <option>Eastern Time (ET)</option>
                                <option>Greenwich Mean Time (GMT)</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Account Section */}
                <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <User className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account</h2>
                    </div>

                    <div className="space-y-3">
                        {/* Sign Out */}
                        <button
                            onClick={() => setShowSignOut(true)}
                            className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 group"
                        >
                            <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">Sign Out</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account on this device</p>
                            </div>
                            <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</span>
                        </button>

                        {/* Delete Account */}
                        <button
                            onClick={() => { setShowDeleteAccount(true); setDeletePassword(''); setDeleteToast(null); }}
                            className="w-full text-left px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-3 group"
                        >
                            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                            <div className="flex-1">
                                <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                                <p className="text-sm text-red-400 dark:text-red-500">Permanently delete your account and all data</p>
                            </div>
                            <span className="text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300">→</span>
                        </button>
                    </div>
                </section>

            </div>

            {/* ── Sign Out Confirmation Modal ─────────────────────────────────── */}
            {showSignOut && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sign Out</h3>
                            </div>
                            <button
                                onClick={() => setShowSignOut(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Are you sure you want to sign out? You will need to log in again to access your account.</p>
                        </div>
                        <div className="flex items-center gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowSignOut(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignOut}
                                disabled={signOutLoading}
                                className="flex-1 py-2.5 rounded-xl bg-gray-800 dark:bg-gray-200 hover:bg-gray-900 dark:hover:bg-white text-white dark:text-gray-900 font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {signOutLoading ? (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                ) : <LogOut className="w-4 h-4" />}
                                {signOutLoading ? 'Signing out...' : 'Sign Out'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Account Confirmation Modal ───────────────────────────── */}
            {showDeleteAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-200/50 dark:border-red-800/50 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-red-100 dark:border-red-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Delete Account</h3>
                            </div>
                            <button
                                onClick={() => setShowDeleteAccount(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Warning banner */}
                            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p><strong>This action is irreversible.</strong> All your data, settings, and history will be permanently deleted.</p>
                            </div>

                            {/* Toast */}
                            {deleteToast && (
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${deleteToast.type === 'success'
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    }`}>
                                    {deleteToast.type === 'success'
                                        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                                    {deleteToast.message}
                                </div>
                            )}

                            {/* Password confirmation */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm with your password</label>
                                <div className="relative">
                                    <input
                                        type={showDeletePw ? 'text' : 'password'}
                                        value={deletePassword}
                                        onChange={e => setDeletePassword(e.target.value)}
                                        placeholder="Enter your current password"
                                        className="w-full pr-10 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDeletePw(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showDeletePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowDeleteAccount(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading || !deletePassword}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all shadow-md hover:shadow-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                ) : <Trash2 className="w-4 h-4" />}
                                {deleteLoading ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

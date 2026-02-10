import { Ambulance, Users, BarChart3, LogOut, Activity, ArrowRightLeft } from 'lucide-react';
import { User } from 'firebase/auth';

type View = 'dashboard' | 'transfer' | 'fleet' | 'records' | 'analytics';

interface HeaderProps {
    user: User | null;
    currentView: View;
    onViewChange: (view: View) => void;
    onLogout: () => void;
}

export function Header({ user, currentView, onViewChange, onLogout }: HeaderProps) {
    // Get display name from email
    const displayName = user?.email?.split('@')[0] || 'User';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Activity },
        { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
        { id: 'fleet', label: 'Fleet', icon: Ambulance },
        { id: 'records', label: 'Records', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ] as const;

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100/50">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between relative">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="MediGo Logo" className="h-10 w-auto" />
                    </div>

                    {/* Centered Navigation */}
                    <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center bg-gray-100/50 p-1 rounded-xl">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentView === item.id
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                                    }`}
                            >
                                <item.icon size={16} />
                                <span className="hidden lg:inline">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* User Profile & Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 rounded-full border border-gray-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-gray-600 text-sm font-medium capitalize">{displayName}</span>
                        </div>

                        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation (visible only on small screens) */}
                <div className="md:hidden mt-4 overflow-x-auto pb-2">
                    <nav className="flex items-center gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${currentView === item.id
                                    ? 'bg-black text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={16} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
}

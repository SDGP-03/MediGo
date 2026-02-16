import { useRef, useState, useEffect, useCallback } from 'react';
import { User as UserIcon, Settings, Moon, Sun, HelpCircle, Ambulance, Users, BarChart3, LogOut, Activity, ArrowRightLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '@radix-ui/react-dropdown-menu';
import { User } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';

type View = 'dashboard' | 'transfer' | 'fleet' | 'records' | 'analytics';

interface HeaderProps {
    user: User | null;

    // 4. removing due to deletion of the useState
    // currentView: View;
    // onViewChange: (view: View) => void;


    onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {

    const navigate = useNavigate();
    const location = useLocation();
    const displayName = user?.email?.split('@')[0] || 'User';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Activity },
        { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
        { id: 'fleet', label: 'Fleet', icon: Ambulance },
        { id: 'records', label: 'Records', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ] as const;

    //determine active view based on URL
    const currentView = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

    // Refs for measuring tab positions for the sliding indicator
    const navRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    const updateIndicator = useCallback(() => {
        const activeTab = tabRefs.current[currentView];
        const nav = navRef.current;
        if (activeTab && nav) {
            const navRect = nav.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();
            setIndicatorStyle({
                left: tabRect.left - navRect.left,
                width: tabRect.width,
            });
        }
    }, [currentView]);

    useEffect(() => {
        updateIndicator();
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);


    // Theme toggle logic with persistence
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    };

    return (
        <header
            className="sticky top-0 z-50"
            style={{
                background: 'var(--header-bg)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderColor: 'var(--header-border-color)',
            }}
        >
            <div className=" max-w-full mx-auto px-20 py-4">
                <div className="flex items-center justify-between relative">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="MediGo Logo" className="h-14 w-auto block dark:hidden" />
                        <img src="/logo-darkmode.PNG" alt="MediGo Logo" className="h-14 w-auto hidden dark:block" />
                    </div>

                    {/* Desktop Nav — Liquid Glass Tabs */}
                    <nav
                        ref={navRef}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center p-1 rounded-2xl"
                        style={{
                            background: 'var(--header-nav-bg)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid var(--header-nav-border-color)',
                            boxShadow: '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}
                    >
                        {/* Sliding indicator pill */}
                        <div
                            className="absolute top-1 bottom-1 rounded-xl pointer-events-none"
                            style={{
                                left: indicatorStyle.left,
                                width: indicatorStyle.width,
                                transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: 'var(--header-indicator-bg)',
                                border: '1.8px solid var(--header-border-color)',
                                boxShadow: '0 1px 8px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -1px 1px rgba(0,0,0,0.03)',
                                backdropFilter: 'blur(12px) saturate(120%)',
                            }}
                        />

                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                ref={(el) => { tabRefs.current[item.id] = el; }}
                                onClick={() => navigate(item.id === 'dashboard' ? '/' : `/${item.id}`)} //using the navigate
                                className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-300"
                                style={{
                                    color: currentView === item.id ? 'var(--header-text)' : 'var(--header-text-muted)',
                                }}
                                onMouseEnter={(e) => {
                                    if (currentView !== item.id) {
                                        e.currentTarget.style.color = 'var(--header-nav-item-hover)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentView !== item.id) {
                                        e.currentTarget.style.color = 'var(--header-text-muted)';
                                    }
                                }}
                            >
                                <item.icon size={16} />
                                <span className="hidden lg:inline">{item.label}</span>
                            </button>
                        ))}
                    </nav>




                    {/* User profile dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className='hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors hover:bg-white/20 outline-none cursor-pointer'
                                style={{
                                    background: 'var(--header-nav-bg)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid var(--header-nav-border-color)',
                                    color: 'var(--header-text)',
                                }}>
                                <div className='w-3 h-3 bg-sky-500 rounded-full animate-bounce'></div>
                                <span className='text-sm font-medium capitalize'>{displayName}</span>
                            </button>
                        </DropdownMenuTrigger>



                        <DropdownMenuContent align='end' className='w-56 rounded-sm mt-2 p-4 data-[state=open]:animate-in data-[state=closed]:animate-out'
                            style={{
                                background: 'var(--header-bg)'
                            }}>
                            <DropdownMenuLabel className='pb-4 font-bold'>My account</DropdownMenuLabel>
                            <DropdownMenuSeparator />


                            {/* Profile option */}
                            <DropdownMenuItem onClick={() => navigate('/profile')} className='flex flex-row justify-start items-center py-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:pl-6 focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer group'>
                                <UserIcon className='mr-2 h-4 w-4' />
                                <span>Profile</span>
                            </DropdownMenuItem>

                            {/* Settings */}
                            <DropdownMenuItem onClick={() => navigate('/settings')} className='flex flex-row justify-start items-center py-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:pl-6 focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer group' >
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>

                            {/* Dark mode */}
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    toggleTheme();
                                }}
                                className='flex flex-row justify-start items-center py-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:pl-6 focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer group'
                            >
                                <Moon className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Sun className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span>Toggle Theme</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Logout option */}
                            <DropdownMenuItem onClick={onLogout} className="flex flex-row justify-start items-center py-2 text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:pl-6 focus:bg-destructive/10 focus:text-destructive focus:outline-none cursor-pointer border-0 group" >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>


                    {/*Previous User Profile & Actions */}
                    {/* <div className="flex items-center gap-4">
                        <div
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{
                                background: 'rgba(255,255,255,0.4)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.5)',
                            }}
                        >
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-gray-600 text-sm font-medium capitalize">{displayName}</span>
                        </div>

                        <div className="h-6 w-px bg-gray-200/50 hidden sm:block"></div>

                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors duration-300 p-2 rounded-lg hover:bg-red-50/50"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div> */}
                </div>

                {/* Mobile Nav — Liquid Glass */}
                <div className="md:hidden mt-4 overflow-x-auto pb-2">
                    <nav className="flex items-center gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.id === 'dashboard' ? '/' : `/${item.id}`)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300"
                                style={currentView === item.id ? {
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%)',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                                    border: '1px solid rgba(255,255,255,0.6)',
                                    color: '#111827',
                                } : {
                                    color: '#9ca3af',
                                }}
                            >
                                <item.icon size={16} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </header >
    );
}

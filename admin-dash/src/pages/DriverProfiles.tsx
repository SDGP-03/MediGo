import { useState } from 'react';
import {
    User, Star, Phone, Clock, Car, Search,
    ChevronDown, ChevronUp, AlertTriangle, TrendingUp,
    X, CreditCard, Calendar, Mail, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type DriverStatus = 'active' | 'off_duty' | 'on_leave';

interface Driver {
    id: string;
    name: string;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    email: string;
    licenseNumber: string;
    licenseExpiry: string;
    joinDate: string;
    status: DriverStatus;
    assignedAmbulance: string | null;
    rating: number;
    totalTrips: number;
    totalKm: number;
    avgResponseTime: string;
    incidentReports: number;
    baseSalary: number;
    overtimeHours: number;
    overtimeRate: number;
    tripsBonus: number;
    attendanceDays: number;
    leaveDays: number;
    fuelEfficiencyScore: number;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const initialDrivers: Driver[] = [
    {
        id: 'DRV-001', name: 'John Smith', gender: 'Male',
        phone: '+91 98765 43210', email: 'john.smith@medigo.com',
        licenseNumber: 'TN-2019-0045231', licenseExpiry: '2027-06-30',
        joinDate: '2021-03-15', status: 'active', assignedAmbulance: 'AMB-001',
        rating: 4.7, totalTrips: 312, totalKm: 18540, avgResponseTime: '7 mins',
        incidentReports: 0, baseSalary: 28000, overtimeHours: 14, overtimeRate: 150,
        tripsBonus: 50, attendanceDays: 24, leaveDays: 2, fuelEfficiencyScore: 82,
    },
    {
        id: 'DRV-002', name: 'Sarah Lee', gender: 'Female',
        phone: '+91 87654 32109', email: 'sarah.lee@medigo.com',
        licenseNumber: 'TN-2020-0067452', licenseExpiry: '2026-03-15',
        joinDate: '2022-07-01', status: 'active', assignedAmbulance: 'AMB-002',
        rating: 4.9, totalTrips: 287, totalKm: 16230, avgResponseTime: '6 mins',
        incidentReports: 0, baseSalary: 30000, overtimeHours: 20, overtimeRate: 160,
        tripsBonus: 50, attendanceDays: 26, leaveDays: 0, fuelEfficiencyScore: 91,
    },
    {
        id: 'DRV-003', name: 'Mike Chen', gender: 'Male',
        phone: '+91 76543 21098', email: 'mike.chen@medigo.com',
        licenseNumber: 'TN-2018-0034521', licenseExpiry: '2025-11-30',
        joinDate: '2020-01-10', status: 'active', assignedAmbulance: 'AMB-003',
        rating: 4.2, totalTrips: 401, totalKm: 22100, avgResponseTime: '9 mins',
        incidentReports: 1, baseSalary: 27000, overtimeHours: 8, overtimeRate: 140,
        tripsBonus: 40, attendanceDays: 22, leaveDays: 4, fuelEfficiencyScore: 74,
    },
    {
        id: 'DRV-004', name: 'David Kumar', gender: 'Male',
        phone: '+91 65432 10987', email: 'david.kumar@medigo.com',
        licenseNumber: 'TN-2021-0089654', licenseExpiry: '2028-09-20',
        joinDate: '2023-02-20', status: 'off_duty', assignedAmbulance: 'AMB-004',
        rating: 3.8, totalTrips: 145, totalKm: 8970, avgResponseTime: '11 mins',
        incidentReports: 2, baseSalary: 25000, overtimeHours: 0, overtimeRate: 130,
        tripsBonus: 40, attendanceDays: 18, leaveDays: 8, fuelEfficiencyScore: 65,
    },
    {
        id: 'DRV-005', name: 'Emily Davis', gender: 'Female',
        phone: '+91 54321 09876', email: 'emily.davis@medigo.com',
        licenseNumber: 'TN-2020-0054123', licenseExpiry: '2026-12-01',
        joinDate: '2021-09-05', status: 'active', assignedAmbulance: 'AMB-005',
        rating: 4.5, totalTrips: 268, totalKm: 15400, avgResponseTime: '8 mins',
        incidentReports: 0, baseSalary: 29000, overtimeHours: 12, overtimeRate: 155,
        tripsBonus: 50, attendanceDays: 25, leaveDays: 1, fuelEfficiencyScore: 88,
    },
    {
        id: 'DRV-006', name: 'Robert Taylor', gender: 'Male',
        phone: '+91 43210 98765', email: 'robert.taylor@medigo.com',
        licenseNumber: 'TN-2022-0012345', licenseExpiry: '2029-04-10',
        joinDate: '2023-06-01', status: 'on_leave', assignedAmbulance: 'AMB-006',
        rating: 4.0, totalTrips: 98, totalKm: 5600, avgResponseTime: '10 mins',
        incidentReports: 1, baseSalary: 24000, overtimeHours: 0, overtimeRate: 120,
        tripsBonus: 40, attendanceDays: 14, leaveDays: 12, fuelEfficiencyScore: 70,
    },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    size={13}
                    className={s <= Math.round(rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'}
                />
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: DriverStatus }) {
    const styles: Record<DriverStatus, string> = {
        active: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
        off_duty: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
        on_leave: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs border ${styles[status]}`}>
            {status.replace('_', ' ').toUpperCase()}
        </span>
    );
}

// ─── Register Driver Modal ────────────────────────────────────────────────────

interface RegisterModalProps {
    onClose: () => void;
    onRegister: (driver: Driver) => void;
}

function RegisterDriverModal({ onClose, onRegister }: RegisterModalProps) {
    const [form, setForm] = useState({
        name: '', gender: 'Male', phone: '', email: '',
        licenseNumber: '', licenseExpiry: '', joinDate: new Date().toISOString().split('T')[0],
        baseSalary: '', overtimeRate: '', tripsBonus: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (key: string, value: string) =>
        setForm(f => ({ ...f, [key]: value }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.phone.trim()) e.phone = 'Required';
        if (!form.email.includes('@')) e.email = 'Invalid email';
        if (!form.licenseNumber.trim()) e.licenseNumber = 'Required';
        if (!form.licenseExpiry) e.licenseExpiry = 'Required';
        if (!form.baseSalary || isNaN(Number(form.baseSalary))) e.baseSalary = 'Enter a valid number';
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        onRegister({
            id: `DRV-${String(Date.now()).slice(-3).padStart(3, '0')}`,
            name: form.name,
            gender: form.gender as 'Male' | 'Female' | 'Other',
            phone: form.phone,
            email: form.email,
            licenseNumber: form.licenseNumber,
            licenseExpiry: form.licenseExpiry,
            joinDate: form.joinDate,
            status: 'active',
            assignedAmbulance: null,
            rating: 0, totalTrips: 0, totalKm: 0,
            avgResponseTime: 'N/A', incidentReports: 0,
            baseSalary: Number(form.baseSalary),
            overtimeHours: 0,
            overtimeRate: Number(form.overtimeRate) || 0,
            tripsBonus: Number(form.tripsBonus) || 0,
            attendanceDays: 0, leaveDays: 0, fuelEfficiencyScore: 0,
        });
        onClose();
    };

    const Field = ({
        label, fieldKey, type = 'text', icon
    }: { label: string; fieldKey: string; type?: string; icon?: React.ReactNode }) => (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
                <input
                    type={type}
                    value={form[fieldKey as keyof typeof form]}
                    onChange={e => set(fieldKey, e.target.value)}
                    className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm border rounded-lg bg-input-field-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 ${errors[fieldKey] ? 'border-red-500' : 'border-input'}`}
                />
            </div>
            {errors[fieldKey] && <p className="text-red-500 text-xs mt-1">{errors[fieldKey]}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-5 border-b border-border">
                    <div>
                        <h2 className="text-foreground font-semibold text-lg">Register New Driver</h2>
                        <p className="text-muted-foreground text-sm">Add a new driver to the MediGo system</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-6">

                    {/* Section 1: Personal */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <User size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="Full Name *" fieldKey="name" icon={<User size={14} />} />
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Gender</label>
                                <select
                                    value={form.gender}
                                    onChange={e => set('gender', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-input rounded-lg bg-input-field-bg text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <Field label="Phone Number *" fieldKey="phone" type="tel" icon={<Phone size={14} />} />
                            <Field label="Email Address *" fieldKey="email" type="email" icon={<Mail size={14} />} />
                        </div>
                    </div>

                    {/* Section 2: License */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">License & Employment</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="License Number *" fieldKey="licenseNumber" icon={<CreditCard size={14} />} />
                            <Field label="License Expiry *" fieldKey="licenseExpiry" type="date" icon={<Calendar size={14} />} />
                            <Field label="Joining Date" fieldKey="joinDate" type="date" icon={<Calendar size={14} />} />
                        </div>
                    </div>

                    {/* Section 3: Salary */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">Salary Configuration</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Field label="Base Monthly Salary (₹) *" fieldKey="baseSalary" type="number" />
                            <Field label="Overtime Rate/Hour (₹)" fieldKey="overtimeRate" type="number" />
                            <Field label="Per Trip Bonus (₹)" fieldKey="tripsBonus" type="number" />
                        </div>
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 p-5 border-t border-border">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Register Driver
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Driver Detail Expanded Panel ─────────────────────────────────────────────

function DriverDetailPanel({ driver }: { driver: Driver }) {
    const estimatedSalary =
        driver.baseSalary +
        driver.overtimeHours * driver.overtimeRate +
        driver.totalTrips * driver.tripsBonus;

    const licenseExpiringSoon =
        new Date(driver.licenseExpiry) < new Date(Date.now() + 60 * 24 * 3600 * 1000);

    return (
        <div className="border-t border-border bg-accent/20 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Col 1: Driver Info */}
            <div className="space-y-3">
                <h4 className="text-foreground text-sm font-semibold mb-1">Driver Info</h4>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                    {driver.phone}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    {driver.email}
                </p>
                <p className="text-sm text-muted-foreground">
                    Gender: <span className="text-foreground">{driver.gender}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                    Joined: <span className="text-foreground">{new Date(driver.joinDate).toLocaleDateString()}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                    License No: <span className="text-foreground font-mono text-xs">{driver.licenseNumber}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                    License Expiry:{' '}
                    <span className={licenseExpiringSoon ? 'text-red-500 font-medium' : 'text-foreground'}>
                        {new Date(driver.licenseExpiry).toLocaleDateString()}
                        {licenseExpiringSoon && ' ⚠️ Expiring Soon'}
                    </span>
                </p>

                {/* Fuel Efficiency Bar */}
                <div className="pt-1">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Fuel Efficiency Score</span>
                        <span className="text-xs text-teal-600 font-medium">{driver.fuelEfficiencyScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${driver.fuelEfficiencyScore}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Col 2: Attendance & Performance */}
            <div className="space-y-3">
                <h4 className="text-foreground text-sm font-semibold mb-1">Attendance & Performance</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-semibold text-green-600">{driver.attendanceDays}</p>
                        <p className="text-xs text-muted-foreground">Days Present</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-semibold text-yellow-600">{driver.leaveDays}</p>
                        <p className="text-xs text-muted-foreground">Days Leave</p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={15} className="text-blue-600" />
                        <span className="text-sm text-muted-foreground">Overtime Hours</span>
                    </div>
                    <span className="text-blue-600 font-semibold">{driver.overtimeHours}h</span>
                </div>
                <div className="bg-card rounded-lg p-3 flex items-center justify-between border border-border">
                    <div className="flex items-center gap-2">
                        <Car size={15} className="text-gray-500" />
                        <span className="text-sm text-muted-foreground">Avg Response Time</span>
                    </div>
                    <span className="text-foreground font-medium">{driver.avgResponseTime}</span>
                </div>
                {driver.incidentReports > 0 ? (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                        <span className="text-sm text-red-600">
                            {driver.incidentReports} incident report{driver.incidentReports > 1 ? 's' : ''} this month
                        </span>
                    </div>
                ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center gap-2">
                        <span className="text-sm text-green-600">✅ No incidents reported</span>
                    </div>
                )}
            </div>

            {/* Col 3: Salary Breakdown */}
            <div>
                <h4 className="text-foreground text-sm font-semibold mb-3">Salary Breakdown (This Month)</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Base Salary</span>
                        <span className="text-foreground font-medium">₹{driver.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">
                            Overtime ({driver.overtimeHours}h × ₹{driver.overtimeRate})
                        </span>
                        <span className="text-foreground font-medium">
                            ₹{(driver.overtimeHours * driver.overtimeRate).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">
                            Trip Bonus ({driver.totalTrips} trips × ₹{driver.tripsBonus})
                        </span>
                        <span className="text-foreground font-medium">
                            ₹{(driver.totalTrips * driver.tripsBonus).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 mt-1">
                        <span className="text-foreground font-semibold">Estimated Total</span>
                        <span className="text-green-600 font-bold text-base">
                            ₹{estimatedSalary.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Performance Score */}
                <div className="mt-4 bg-card border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Overall Performance Score</p>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-foreground">{driver.rating}</div>
                        <div>
                            <StarRating rating={driver.rating} />
                            <p className="text-xs text-muted-foreground mt-0.5">{driver.totalTrips} trips completed</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DriverProfiles() {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | DriverStatus>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const filtered = drivers.filter(d => {
        const matchStatus = filterStatus === 'all' || d.status === filterStatus;
        const matchSearch =
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.assignedAmbulance ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatus && matchSearch;
    });

    const stats = {
        total: drivers.length,
        active: drivers.filter(d => d.status === 'active').length,
        avgRating: drivers.length
            ? (drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(1)
            : '0.0',
        totalOvertime: drivers.reduce((s, d) => s + d.overtimeHours, 0),
    };

    return (
        <div className="space-y-6 p-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Go back"
                    >
                        <ArrowLeft size={20} className="text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-foreground text-2xl font-bold">Driver Profiles</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage drivers, view performance and calculate salaries
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowRegisterModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
                >
                    <User size={16} />
                    + Register New Driver
                </button>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-5">
                    <p className="text-muted-foreground text-xs mb-1">Total Drivers</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
                    <p className="text-muted-foreground text-xs mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-5">
                    <p className="text-muted-foreground text-xs mb-1">Avg Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.avgRating} ⭐</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
                    <p className="text-muted-foreground text-xs mb-1">Total Overtime Hrs</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalOvertime}h</p>
                </div>
            </div>

            {/* ── Search + Filter Bar ── */}
            <div className="bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, ID or ambulance..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-input rounded-lg bg-input-field-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'active', 'off_duty', 'on_leave'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${filterStatus === s
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-card text-foreground border-border hover:bg-accent'}`}
                        >
                            {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Driver Cards ── */}
            <div className="space-y-3">
                {filtered.map(driver => (
                    <div
                        key={driver.id}
                        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
                    >
                        {/* Card Summary Row */}
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">

                            {/* Avatar + Name */}
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                    <User size={20} className="text-red-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-foreground font-semibold">{driver.name}</span>
                                        <span className="text-muted-foreground text-xs">#{driver.id}</span>
                                        <StatusBadge status={driver.status} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <StarRating rating={driver.rating} />
                                        <span className="text-muted-foreground text-xs">{driver.rating}/5</span>
                                        {driver.assignedAmbulance && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Car size={11} /> {driver.assignedAmbulance}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-5 flex-wrap md:flex-nowrap">
                                {[
                                    { label: 'Trips', value: driver.totalTrips },
                                    { label: 'KM', value: driver.totalKm.toLocaleString() },
                                    { label: 'Overtime', value: `${driver.overtimeHours}h` },
                                    {
                                        label: 'Incidents',
                                        value: driver.incidentReports,
                                        color: driver.incidentReports > 0 ? 'text-red-500' : 'text-green-500',
                                    },
                                ].map(stat => (
                                    <div key={stat.label} className="text-center">
                                        <p className={`font-semibold ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
                                        <p className="text-muted-foreground text-xs">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Expand Button */}
                            <button
                                onClick={() => setExpandedId(expandedId === driver.id ? null : driver.id)}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors self-end md:self-auto flex-shrink-0"
                            >
                                {expandedId === driver.id
                                    ? <><ChevronUp size={17} /> Hide</>
                                    : <><ChevronDown size={17} /> Details</>}
                            </button>
                        </div>

                        {/* Expanded Panel */}
                        {expandedId === driver.id && <DriverDetailPanel driver={driver} />}
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="bg-card border border-border rounded-xl p-12 text-center">
                        <User className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
                        <p className="text-foreground font-medium">No drivers found</p>
                        <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filter</p>
                    </div>
                )}
            </div>

            {/* ── Register Modal ── */}
            {showRegisterModal && (
                <RegisterDriverModal
                    onClose={() => setShowRegisterModal(false)}
                    onRegister={driver => setDrivers(prev => [driver, ...prev])}
                />
            )}

        </div>
    );
}
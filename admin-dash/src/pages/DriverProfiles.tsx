import { useState } from 'react';
import {
    User, Star, Phone, Clock, Car, Search,
    ChevronDown, ChevronUp, AlertTriangle, TrendingUp,
    X, CreditCard, Calendar, Mail, Ambulance, Trash2, Pencil, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFleetData, Driver, DriverStatus } from '../hooks/useFleetData';

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

// ─── Field component used by the register modal ─────────────────────────────────

interface FieldProps {
    label: string;
    type?: string;
    icon?: React.ReactNode;
    value: string;
    onChange: (val: string) => void;
    error?: string;
}

function Field({
    label,
    type = 'text',
    icon,
    value,
    onChange,
    error,
}: FieldProps) {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm border rounded-lg bg-input-field-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 ${error ? 'border-red-500' : 'border-input'}`}
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

// ─── Register Driver Modal ────────────────────────────────────────────────────

interface RegisterModalProps {
    onClose: () => void;
    onRegister: (driver: Driver) => Promise<void>;
}

function RegisterDriverModal({ onClose, onRegister }: RegisterModalProps) {
    const [form, setForm] = useState({
        name: '', gender: 'Male', phone: '', email: '',
        licenseNumber: '', licenseExpiry: '', joinDate: new Date().toISOString().split('T')[0],
        baseSalary: '', overtimeRate: '', tripsBonus: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

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

    const handleSubmit = async () => {
        const e = validate();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        setSaving(true);
        try {
            await onRegister({
                id: `DRV-${Date.now()}`,
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
        } catch (err) {
            console.error('Failed to register driver:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-5 border-b border-border">
                    <div>
                        <h2 className="text-foreground font-semibold text-lg">Register New Driver</h2>
                        <p className="text-muted-foreground text-sm">Add a new driver to the MediGo system</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>
                <div className="p-5 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <User size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field
                                label="Full Name *"
                                icon={<User size={14} />}
                                value={form.name}
                                onChange={v => set('name', v)}
                                error={errors.name}
                            />
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
                            <Field
                                label="Phone Number *"
                                type="tel"
                                icon={<Phone size={14} />}
                                value={form.phone}
                                onChange={v => set('phone', v)}
                                error={errors.phone}
                            />
                            <Field
                                label="Email Address *"
                                type="email"
                                icon={<Mail size={14} />}
                                value={form.email}
                                onChange={v => set('email', v)}
                                error={errors.email}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">License & Employment</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field
                                label="License Number *"
                                icon={<CreditCard size={14} />}
                                value={form.licenseNumber}
                                onChange={v => set('licenseNumber', v)}
                                error={errors.licenseNumber}
                            />
                            <Field
                                label="License Expiry *"
                                type="date"
                                icon={<Calendar size={14} />}
                                value={form.licenseExpiry}
                                onChange={v => set('licenseExpiry', v)}
                                error={errors.licenseExpiry}
                            />
                            <Field
                                label="Joining Date"
                                type="date"
                                icon={<Calendar size={14} />}
                                value={form.joinDate}
                                onChange={v => set('joinDate', v)}
                                error={errors.joinDate}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">Salary Configuration</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Field
                                label="Base Monthly Salary (LKR) *"
                                type="number"
                                value={form.baseSalary}
                                onChange={v => set('baseSalary', v)}
                                error={errors.baseSalary}
                            />
                            <Field
                                label="Overtime Rate/Hour "
                                type="number"
                                value={form.overtimeRate}
                                onChange={v => set('overtimeRate', v)}
                                error={errors.overtimeRate}
                            />
                            <Field
                                label="Per Trip Bonus (LKR)"
                                type="number"
                                value={form.tripsBonus}
                                onChange={v => set('tripsBonus', v)}
                                error={errors.tripsBonus}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 p-5 border-t border-border">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? 'Saving…' : 'Register Driver'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────

function DeleteConfirmModal({
    driver, onClose, onConfirm,
}: { driver: Driver; onClose: () => void; onConfirm: () => void; }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <Trash2 size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-foreground font-semibold text-base">Remove Driver</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Are you sure you want to remove{' '}
                            <span className="text-foreground font-medium">{driver.name}</span>{' '}
                            ({driver.id})? This action cannot be undone.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg transition-colors">
                        <X size={16} className="text-muted-foreground" />
                    </button>
                </div>
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Yes, Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Driver Modal ───────────────────────────────────────────────────────

interface EditModalProps {
    driver: Driver;
    onClose: () => void;
    onSave: (updated: Driver) => Promise<void>;
}

function EditDriverModal({ driver, onClose, onSave }: EditModalProps) {
    const [form, setForm] = useState({
        name: driver.name,
        gender: driver.gender,
        phone: driver.phone,
        email: driver.email,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry,
        joinDate: driver.joinDate,
        status: driver.status,
        assignedAmbulance: driver.assignedAmbulance ?? '',
        baseSalary: String(driver.baseSalary),
        overtimeRate: String(driver.overtimeRate),
        tripsBonus: String(driver.tripsBonus),
        overtimeHours: String(driver.overtimeHours),
        attendanceDays: String(driver.attendanceDays),
        leaveDays: String(driver.leaveDays),
        fuelEfficiencyScore: String(driver.fuelEfficiencyScore),
        incidentReports: String(driver.incidentReports),
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
        onSave({
            ...driver,
            name: form.name,
            gender: form.gender as 'Male' | 'Female' | 'Other',
            phone: form.phone,
            email: form.email,
            licenseNumber: form.licenseNumber,
            licenseExpiry: form.licenseExpiry,
            joinDate: form.joinDate,
            status: form.status as Driver['status'],
            assignedAmbulance: form.assignedAmbulance.trim() || null,
            baseSalary: Number(form.baseSalary),
            overtimeRate: Number(form.overtimeRate) || 0,
            tripsBonus: Number(form.tripsBonus) || 0,
            overtimeHours: Number(form.overtimeHours) || 0,
            attendanceDays: Number(form.attendanceDays) || 0,
            leaveDays: Number(form.leaveDays) || 0,
            fuelEfficiencyScore: Math.min(100, Math.max(0, Number(form.fuelEfficiencyScore) || 0)),
            incidentReports: Number(form.incidentReports) || 0,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-5 border-b border-border">
                    <div>
                        <h2 className="text-foreground font-semibold text-lg">Edit Driver Profile</h2>
                        <p className="text-muted-foreground text-sm">{driver.name} &bull; {driver.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>
                <div className="p-5 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <User size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="Full Name *" icon={<User size={14} />} value={form.name} onChange={v => set('name', v)} error={errors.name} />
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Gender</label>
                                <select value={form.gender} onChange={e => set('gender', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-input rounded-lg bg-input-field-bg text-foreground focus:outline-none focus:ring-2 focus:ring-red-500">
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                            </div>
                            <Field label="Phone Number *" type="tel" icon={<Phone size={14} />} value={form.phone} onChange={v => set('phone', v)} error={errors.phone} />
                            <Field label="Email Address *" type="email" icon={<Mail size={14} />} value={form.email} onChange={v => set('email', v)} error={errors.email} />
                        </div>
                    </div>
                    {/* License & Employment */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">License &amp; Employment</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="License Number *" icon={<CreditCard size={14} />} value={form.licenseNumber} onChange={v => set('licenseNumber', v)} error={errors.licenseNumber} />
                            <Field label="License Expiry *" type="date" icon={<Calendar size={14} />} value={form.licenseExpiry} onChange={v => set('licenseExpiry', v)} error={errors.licenseExpiry} />
                            <Field label="Joining Date" type="date" icon={<Calendar size={14} />} value={form.joinDate} onChange={v => set('joinDate', v)} />
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                                <select value={form.status} onChange={e => set('status', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-input rounded-lg bg-input-field-bg text-foreground focus:outline-none focus:ring-2 focus:ring-red-500">
                                    <option value="active">Active</option>
                                    <option value="off_duty">Off Duty</option>
                                    <option value="on_leave">On Leave</option>
                                </select>
                            </div>
                            <Field label="Assigned Ambulance" icon={<Car size={14} />} value={form.assignedAmbulance} onChange={v => set('assignedAmbulance', v)} />
                        </div>
                    </div>
                    {/* Salary */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">Salary Configuration</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Field label="Base Monthly Salary (LKR) *" type="number" value={form.baseSalary} onChange={v => set('baseSalary', v)} error={errors.baseSalary} />
                            <Field label="Overtime Rate/Hour" type="number" value={form.overtimeRate} onChange={v => set('overtimeRate', v)} />
                            <Field label="Per Trip Bonus (LKR)" type="number" value={form.tripsBonus} onChange={v => set('tripsBonus', v)} />
                        </div>
                    </div>
                    {/* Attendance & Performance */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock size={15} className="text-red-500" />
                            <h3 className="text-foreground text-sm font-medium">Attendance &amp; Performance</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Field label="Overtime Hours" type="number" value={form.overtimeHours} onChange={v => set('overtimeHours', v)} />
                            <Field label="Attendance Days" type="number" value={form.attendanceDays} onChange={v => set('attendanceDays', v)} />
                            <Field label="Leave Days" type="number" value={form.leaveDays} onChange={v => set('leaveDays', v)} />
                            <Field label="Incident Reports" type="number" value={form.incidentReports} onChange={v => set('incidentReports', v)} />
                        </div>
                        <div className="mt-3">
                            <Field label="Fuel Efficiency Score (0-100)" type="number" value={form.fuelEfficiencyScore} onChange={v => set('fuelEfficiencyScore', v)} />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 p-5 border-t border-border">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

// ─── Driver Detail Expanded Panel ─────────────────────────────────────────────

function DriverDetailPanel({ driver }: { driver: Driver }) {
    const licenseExpiringSoon =
        new Date(driver.licenseExpiry) < new Date(Date.now() + 60 * 24 * 3600 * 1000);

    return (
        <div className="border-t border-border bg-accent/20 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-sm text-muted-foreground">Gender: <span className="text-foreground">{driver.gender}</span></p>
                <p className="text-sm text-muted-foreground">Joined: <span className="text-foreground">{new Date(driver.joinDate).toLocaleDateString()}</span></p>
                <p className="text-sm text-muted-foreground">License No: <span className="text-foreground font-mono text-xs">{driver.licenseNumber}</span></p>
                <p className="text-sm text-muted-foreground">
                    License Expiry:{' '}
                    <span className={licenseExpiringSoon ? 'text-red-500 font-medium' : 'text-foreground'}>
                        {new Date(driver.licenseExpiry).toLocaleDateString()}
                        {licenseExpiringSoon && ' ⚠️ Expiring Soon'}
                    </span>
                </p>
                <div className="pt-1">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Fuel Efficiency Score</span>
                        <span className="text-xs text-teal-600 font-medium">{driver.fuelEfficiencyScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${driver.fuelEfficiencyScore}%` }} />
                    </div>
                </div>
            </div>
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
                        <span className="text-sm text-red-600">{driver.incidentReports} incident report{driver.incidentReports > 1 ? 's' : ''} this month</span>
                    </div>
                ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center gap-2">
                        <span className="text-sm text-green-600">✅ No incidents reported</span>
                    </div>
                )}
            </div>
            <div>
                <h4 className="text-foreground text-sm font-semibold mb-3">Performance Overview</h4>
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

    // ── Firebase backend via useFleetData hook ──
    const {
        drivers,
        loading,
        error,
        addDriver,
        updateDriver,
        deleteDriver,
    } = useFleetData();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | DriverStatus>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
    const [editTarget, setEditTarget] = useState<Driver | null>(null);

    // ── Firebase CRUD handlers ──

    const handleRegister = async (driver: Driver) => {
        await addDriver(driver);
    };

    const handleEditSave = async (updated: Driver) => {
        const { id, ...changes } = updated;
        await updateDriver(id, changes);
        setEditTarget(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        await deleteDriver(deleteTarget.id);
        if (expandedId === deleteTarget.id) setExpandedId(null);
        setDeleteTarget(null);
    };

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

    // ── Loading state ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
                <Loader2 size={40} className="animate-spin text-red-500" />
                <p className="text-sm">Loading drivers from Firebase…</p>
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertTriangle size={40} className="text-red-500" />
                <p className="text-foreground font-medium">Failed to load driver data</p>
                <p className="text-muted-foreground text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-2 px-6 pb-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-foreground text-2xl font-bold">Driver Profiles</h1>
                    <p className="text-muted-foreground text-sm">Manage drivers, view performance and calculate salaries</p>
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
                    <p className="text-2xl font-bold text-yellow-600">{stats.avgRating}</p>
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
                            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${filterStatus === s ? 'bg-red-600 text-white border-red-600' : 'bg-card text-foreground border-border hover:bg-accent'}`}
                        >
                            {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Driver Cards ── */}
            <div className="space-y-3">
                {filtered.map(driver => (
                    <div key={driver.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                            <div className="flex gap-5 flex-wrap md:flex-nowrap">
                                {[
                                    { label: 'Trips', value: driver.totalTrips },
                                    { label: 'KM', value: driver.totalKm.toLocaleString() },
                                    { label: 'Overtime', value: `${driver.overtimeHours}h` },
                                    { label: 'Incidents', value: driver.incidentReports, color: driver.incidentReports > 0 ? 'text-red-500' : 'text-green-500' },
                                ].map(stat => (
                                    <div key={stat.label} className="text-center">
                                        <p className={`font-semibold ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
                                        <p className="text-muted-foreground text-xs">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                                <button
                                    onClick={() => setExpandedId(expandedId === driver.id ? null : driver.id)}
                                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {expandedId === driver.id ? <><ChevronUp size={17} />Hide</> : <><ChevronDown size={17} />Details</>}
                                </button>
                                <button
                                    onClick={() => setEditTarget(driver)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    title="Edit driver"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(driver)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Remove driver"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
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
                    onRegister={handleRegister}
                />
            )}

            {/* ── Edit Driver Modal ── */}
            {editTarget && (
                <EditDriverModal
                    driver={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleEditSave}
                />
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && (
                <DeleteConfirmModal
                    driver={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                />
            )}

            {/* ── Transfer Request Shortcut ── */}
            <button
                onClick={() => navigate('/transfer')}
                className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 z-50 flex items-center gap-2 group"
                title="New Transfer Request"
            >
                <Ambulance size={24} />
                <span className="hidden group-hover:block transition-all duration-300">New Request</span>
            </button>
        </div>
    );
}
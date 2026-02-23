import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ambulance, MapPin, User, Clock, Search, TrendingUp,
  Plus, Wrench, CheckCircle, AlertTriangle, X, ChevronRight,
  Thermometer, Activity, Shield, Zap,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../components/ui/dialog';

// ─── Types ───────────────────────────────────────────────────────────────────

type AmbulanceStatus = 'available' | 'in_service' | 'maintenance';

interface AmbulanceUnit {
  id: string;
  status: AmbulanceStatus;
  driver: string;
  driverGender: string;
  attendant: string;
  attendantGender: string;
  location: string;
  lastService?: string;
  nextServiceDue?: string;
  maintenanceNotes?: string;
  currentTransfer?: string;
  etaMinutes?: number; // mutable for countdown
  equipment: string[];
  hasDoctor: boolean;
  hasVentilator: boolean;
  mileage?: number;
  year?: number;
}

interface PendingTransfer {
  id: string;
  patient: string;
  from: string;
  to: string;
  priority: 'critical' | 'urgent' | 'standard';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_AMBULANCES: AmbulanceUnit[] = [
  {
    id: 'AMB-001', status: 'available',
    driver: 'John Smith', driverGender: 'Male',
    attendant: 'Tom Wilson', attendantGender: 'Male',
    location: 'City General Hospital', lastService: '2025-11-15', nextServiceDue: '2026-02-15',
    equipment: ['Oxygen', 'Defibrillator', 'IV Fluids'],
    hasDoctor: false, hasVentilator: false, mileage: 42300, year: 2020,
  },
  {
    id: 'AMB-002', status: 'in_service',
    driver: 'Sarah Lee', driverGender: 'Female',
    attendant: 'Maria Garcia', attendantGender: 'Female',
    location: 'En route to Central Medical', currentTransfer: 'TR-2401', etaMinutes: 12,
    equipment: ['Oxygen', 'Ventilator', 'Cardiac Monitor'],
    hasDoctor: true, hasVentilator: true, mileage: 38100, year: 2021,
  },
  {
    id: 'AMB-003', status: 'available',
    driver: 'Mike Chen', driverGender: 'Male',
    attendant: 'Lisa Brown', attendantGender: 'Female',
    location: 'Divisional Hospital North', lastService: '2025-11-18', nextServiceDue: '2026-02-18',
    equipment: ['Oxygen', 'Defibrillator', 'IV Fluids', 'Stretcher'],
    hasDoctor: false, hasVentilator: false, mileage: 55700, year: 2019,
  },
  {
    id: 'AMB-004', status: 'maintenance',
    driver: 'David Kumar', driverGender: 'Male',
    attendant: 'Not Assigned', attendantGender: 'N/A',
    location: 'Service Center', lastService: '2025-11-20', nextServiceDue: '2026-02-20',
    maintenanceNotes: 'Scheduled brake inspection & oil change',
    equipment: [],
    hasDoctor: false, hasVentilator: false, mileage: 61200, year: 2018,
  },
  {
    id: 'AMB-005', status: 'available',
    driver: 'Emily Davis', driverGender: 'Female',
    attendant: 'Jessica Wong', attendantGender: 'Female',
    location: 'City General Hospital', lastService: '2025-11-17', nextServiceDue: '2026-02-17',
    equipment: ['Oxygen', 'Cardiac Monitor', 'IV Fluids'],
    hasDoctor: false, hasVentilator: false, mileage: 29800, year: 2022,
  },
  {
    id: 'AMB-006', status: 'in_service',
    driver: 'Robert Taylor', driverGender: 'Male',
    attendant: 'Mark Anderson', attendantGender: 'Male',
    location: 'En route to Regional Base', currentTransfer: 'TR-2402', etaMinutes: 18,
    equipment: ['Oxygen', 'Defibrillator', 'IV Fluids'],
    hasDoctor: false, hasVentilator: false, mileage: 47500, year: 2020,
  },
  {
    id: 'AMB-007', status: 'available',
    driver: 'Jennifer White', driverGender: 'Female',
    attendant: 'Anna Martinez', attendantGender: 'Female',
    location: 'Central Medical Center', lastService: '2025-11-16', nextServiceDue: '2026-02-16',
    equipment: ['Oxygen', 'Ventilator', 'Cardiac Monitor', 'Defibrillator'],
    hasDoctor: true, hasVentilator: true, mileage: 33200, year: 2021,
  },
  {
    id: 'AMB-008', status: 'available',
    driver: 'Chris Johnson', driverGender: 'Male',
    attendant: 'Paul Brown', attendantGender: 'Male',
    location: 'City General Hospital', lastService: '2025-11-19', nextServiceDue: '2026-02-19',
    equipment: ['Oxygen', 'IV Fluids', 'Stretcher'],
    hasDoctor: false, hasVentilator: false, mileage: 51000, year: 2019,
  },
];

const PENDING_TRANSFERS: PendingTransfer[] = [
  { id: 'REQ-1024', patient: 'Robert Taylor', from: 'Divisional Hospital East', to: 'City General Hospital', priority: 'urgent' },
  { id: 'REQ-1025', patient: 'Jennifer White', from: 'Rural Health Center', to: 'Central Medical Center', priority: 'standard' },
  { id: 'REQ-1026', patient: 'Arjun Perera', from: 'Metro Hospital', to: 'Specialist Care Hospital', priority: 'critical' },
];

const EQUIPMENT_OPTIONS = ['Oxygen', 'Defibrillator', 'IV Fluids', 'Cardiac Monitor', 'Ventilator', 'Stretcher', 'Blood Pressure Monitor', 'Pulse Oximeter'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEta(minutes: number): string {
  if (minutes <= 0) return 'Arrived';
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AmbulanceFleet() {
  const navigate = useNavigate();

  // ── Core state ──
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>(INITIAL_AMBULANCES);
  const [filterStatus, setFilterStatus] = useState<'all' | AmbulanceStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Toast ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Detail modal ──
  const [detailAmbulance, setDetailAmbulance] = useState<AmbulanceUnit | null>(null);

  // ── Assign dialog ──
  const [assignAmbulance, setAssignAmbulance] = useState<AmbulanceUnit | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState('');

  // ── Maintenance dialog ──
  const [maintenanceAmbulance, setMaintenanceAmbulance] = useState<AmbulanceUnit | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  // ── Add ambulance dialog ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    id: '', driver: '', driverGender: 'Male',
    attendant: '', attendantGender: 'Male',
    location: 'City General Hospital',
    equipment: [] as string[],
    hasDoctor: false, hasVentilator: false,
    year: new Date().getFullYear(),
  });

  // ── Live ETA countdown ──
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulances(prev => prev.map(a =>
        a.status === 'in_service' && a.etaMinutes !== undefined && a.etaMinutes > 0
          ? { ...a, etaMinutes: a.etaMinutes - 1 }
          : a
      ));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Derived data ──
  const stats = {
    total: ambulances.length,
    available: ambulances.filter(a => a.status === 'available').length,
    inService: ambulances.filter(a => a.status === 'in_service').length,
    maintenance: ambulances.filter(a => a.status === 'maintenance').length,
  };

  const filteredAmbulances = ambulances.filter(amb => {
    const matchesStatus = filterStatus === 'all' || amb.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      amb.id.toLowerCase().includes(q) ||
      amb.driver.toLowerCase().includes(q) ||
      amb.location.toLowerCase().includes(q) ||
      (amb.currentTransfer ?? '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // ── Chart data ──
  const fuelData = [
    { month: 'Jan', value: 26 }, { month: 'Feb', value: 25 }, { month: 'Mar', value: 27 },
    { month: 'Apr', value: 26 }, { month: 'May', value: 28 }, { month: 'Jun', value: 27 },
    { month: 'Jul', value: 28 },
  ];
  const distanceData = [
    { day: 'Mon', value: 380 }, { day: 'Tue', value: 420 }, { day: 'Wed', value: 450 },
    { day: 'Thu', value: 480 }, { day: 'Fri', value: 520 }, { day: 'Sat', value: 560 },
    { day: 'Sun', value: 408 },
  ];

  // ── Status styling ──
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'in_service': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'critical') return 'bg-red-600 text-white';
    if (p === 'urgent') return 'bg-orange-500 text-white';
    return 'bg-green-600 text-white';
  };

  // ── Actions ──
  const handleAssignConfirm = () => {
    if (!assignAmbulance || !selectedTransferId) return;
    const transfer = PENDING_TRANSFERS.find(t => t.id === selectedTransferId)!;
    setAmbulances(prev => prev.map(a =>
      a.id === assignAmbulance.id
        ? {
          ...a, status: 'in_service',
          currentTransfer: selectedTransferId,
          etaMinutes: 15,
          location: `En route to ${transfer.to}`,
        }
        : a
    ));
    showToast(`${assignAmbulance.id} assigned to transfer ${selectedTransferId} ✓`);
    setAssignAmbulance(null);
    setSelectedTransferId('');
  };

  const handleScheduleMaintenance = () => {
    if (!maintenanceAmbulance) return;
    setAmbulances(prev => prev.map(a =>
      a.id === maintenanceAmbulance.id
        ? {
          ...a, status: 'maintenance',
          location: 'Service Center',
          currentTransfer: undefined, etaMinutes: undefined,
          nextServiceDue: maintenanceDate || a.nextServiceDue,
          maintenanceNotes: maintenanceNotes || a.maintenanceNotes,
        }
        : a
    ));
    showToast(`${maintenanceAmbulance.id} scheduled for maintenance ✓`);
    setMaintenanceAmbulance(null);
    setMaintenanceDate('');
    setMaintenanceNotes('');
  };

  const handleCompleteMaintenance = (ambId: string) => {
    setAmbulances(prev => prev.map(a =>
      a.id === ambId
        ? {
          ...a, status: 'available',
          location: 'City General Hospital',
          lastService: new Date().toISOString().slice(0, 10),
          maintenanceNotes: undefined,
        }
        : a
    ));
    showToast(`${ambId} maintenance complete — now available ✓`);
  };

  const handleAddAmbulance = () => {
    if (!addForm.id.trim() || !addForm.driver.trim()) {
      showToast('Ambulance ID and driver name are required.', 'error');
      return;
    }
    if (ambulances.some(a => a.id === addForm.id.trim())) {
      showToast(`ID ${addForm.id} already exists.`, 'error');
      return;
    }
    const newUnit: AmbulanceUnit = {
      id: addForm.id.trim(),
      status: 'available',
      driver: addForm.driver,
      driverGender: addForm.driverGender,
      attendant: addForm.attendant || 'Not Assigned',
      attendantGender: addForm.attendant ? addForm.attendantGender : 'N/A',
      location: addForm.location,
      lastService: new Date().toISOString().slice(0, 10),
      equipment: addForm.equipment,
      hasDoctor: addForm.hasDoctor,
      hasVentilator: addForm.hasVentilator,
      year: addForm.year,
      mileage: 0,
    };
    setAmbulances(prev => [...prev, newUnit]);
    showToast(`${newUnit.id} added to the fleet ✓`);
    setShowAddModal(false);
    setAddForm({
      id: '', driver: '', driverGender: 'Male', attendant: '', attendantGender: 'Male',
      location: 'City General Hospital', equipment: [], hasDoctor: false, hasVentilator: false,
      year: new Date().getFullYear(),
    });
  };

  const toggleEquipmentInAddForm = (item: string) => {
    setAddForm(f => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter(e => e !== item)
        : [...f.equipment, item],
    }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 relative">

      {/* ── Toast container ── */}
      <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white text-sm flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300 ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            {t.type === 'success' && <CheckCircle size={16} />}
            {t.type === 'error' && <AlertTriangle size={16} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ambulance Fleet</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and monitor your entire ambulance fleet</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Ambulance
        </button>
      </div>

      {/* ── Statistics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet', value: stats.total, color: 'text-foreground', bg: 'bg-card border-border' },
          { label: 'Available', value: stats.available, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
          { label: 'In Service', value: stats.inService, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
          { label: 'Maintenance', value: stats.maintenance, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-lg shadow-sm border p-5 ${s.bg}`}>
            <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
            <p className="text-muted-foreground text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fuel Efficiency */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-foreground font-semibold">Fuel Efficiency</h4>
              <p className="text-muted-foreground text-sm">Avg liters / 100 km</p>
            </div>
            <span className="flex items-center gap-1 text-teal-600 text-sm font-medium">
              <TrendingUp size={14} /> +12%
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-4">28L</div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={fuelData}>
              <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} dot={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distance */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-foreground font-semibold">Distance Travelled</h4>
              <p className="text-muted-foreground text-sm">Kilometers per day</p>
            </div>
            <span className="flex items-center gap-1 text-teal-600 text-sm font-medium">
              <TrendingUp size={14} /> +8%
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-4">408km</div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={distanceData}>
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by ID, driver, location, or transfer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'available', 'in_service', 'maintenance'] as const).map(f => {
              const labels: Record<string, string> = { all: 'All', available: 'Available', in_service: 'In Service', maintenance: 'Maintenance' };
              const active: Record<string, string> = {
                all: 'bg-red-600 text-white border-red-600',
                available: 'bg-green-600 text-white border-green-600',
                in_service: 'bg-blue-600 text-white border-blue-600',
                maintenance: 'bg-orange-600 text-white border-orange-600',
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-4 py-2.5 rounded-lg border transition-colors text-sm ${filterStatus === f ? active[f] : 'bg-card text-foreground border-border hover:bg-accent'}`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Ambulance Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAmbulances.map(ambulance => (
          <div
            key={ambulance.id}
            className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-all hover:border-red-200 dark:hover:border-red-900/50 group"
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${ambulance.status === 'available' ? 'bg-green-50 dark:bg-green-900/20' : ambulance.status === 'in_service' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                  <Ambulance
                    size={22}
                    className={ambulance.status === 'available' ? 'text-green-600' : ambulance.status === 'in_service' ? 'text-blue-600' : 'text-orange-600'}
                  />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold">{ambulance.id}</h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStatusColor(ambulance.status)}`}>
                    {ambulance.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Detail button */}
              <button
                onClick={() => setDetailAmbulance(ambulance)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 opacity-0 group-hover:opacity-100"
                title="View details"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Info rows */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400 shrink-0" />
                <span className="text-muted-foreground">Driver: <span className="text-foreground">{ambulance.driver}</span> ({ambulance.driverGender})</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400 shrink-0" />
                <span className="text-muted-foreground">Attendant: <span className="text-foreground">{ambulance.attendant}</span> ({ambulance.attendantGender})</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <span className="text-muted-foreground">{ambulance.location}</span>
              </div>
              {ambulance.status === 'in_service' && ambulance.etaMinutes !== undefined && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-400 shrink-0" />
                  <span className="text-blue-600 font-medium">ETA: {formatEta(ambulance.etaMinutes)}</span>
                  {ambulance.currentTransfer && (
                    <span className="text-muted-foreground">— {ambulance.currentTransfer}</span>
                  )}
                </div>
              )}
              {ambulance.status === 'maintenance' && ambulance.maintenanceNotes && (
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-orange-400 shrink-0" />
                  <span className="text-orange-600 text-xs">{ambulance.maintenanceNotes}</span>
                </div>
              )}
            </div>

            {/* Equipment */}
            {ambulance.equipment.length > 0 && (
              <div className="mb-4">
                <p className="text-muted-foreground text-xs mb-1.5">Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  {ambulance.equipment.map(item => (
                    <span key={item} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {(ambulance.hasDoctor || ambulance.hasVentilator) && (
              <div className="flex gap-2 mb-4">
                {ambulance.hasDoctor && (
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs">
                    Doctor On Board
                  </span>
                )}
                {ambulance.hasVentilator && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
                    Ventilator
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {ambulance.status === 'available' && (
                <>
                  <button
                    onClick={() => { setAssignAmbulance(ambulance); setSelectedTransferId(''); }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Assign to Transfer
                  </button>
                  <button
                    onClick={() => {
                      setMaintenanceAmbulance(ambulance);
                      setMaintenanceDate('');
                      setMaintenanceNotes('');
                    }}
                    className="w-full px-4 py-2 bg-card border border-border text-muted-foreground rounded-lg hover:bg-accent transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Wrench size={14} /> Schedule Maintenance
                  </button>
                </>
              )}
              {ambulance.status === 'in_service' && ambulance.currentTransfer && (
                <>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Track Transfer {ambulance.currentTransfer}
                  </button>
                  <button
                    onClick={() => {
                      setMaintenanceAmbulance(ambulance);
                      setMaintenanceDate('');
                      setMaintenanceNotes('');
                    }}
                    className="w-full px-4 py-2 bg-card border border-border text-muted-foreground rounded-lg hover:bg-accent transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Wrench size={14} /> Schedule Maintenance
                  </button>
                </>
              )}
              {ambulance.status === 'maintenance' && (
                <button
                  onClick={() => handleCompleteMaintenance(ambulance.id)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle size={14} /> Mark Maintenance Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredAmbulances.length === 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <Ambulance className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-foreground mb-2">No ambulances found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => navigate('/transfer')}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 z-50 flex items-center gap-2 group"
        title="New Transfer Request"
      >
        <Ambulance size={22} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm">
          New Request
        </span>
      </button>

      {/* ═══════════════════════════════════════════════════════════════
          DETAIL MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!detailAmbulance} onOpenChange={open => !open && setDetailAmbulance(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ambulance size={20} className="text-red-600" />
              {detailAmbulance?.id} — Details
            </DialogTitle>
          </DialogHeader>
          {detailAmbulance && (
            <div className="space-y-4 text-sm">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(detailAmbulance.status)}`}>
                  {detailAmbulance.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Crew */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Driver</p>
                  <p className="text-foreground font-medium">{detailAmbulance.driver}</p>
                  <p className="text-xs text-muted-foreground">{detailAmbulance.driverGender}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Attendant</p>
                  <p className="text-foreground font-medium">{detailAmbulance.attendant}</p>
                  <p className="text-xs text-muted-foreground">{detailAmbulance.attendantGender}</p>
                </div>
              </div>

              {/* Location & Transfer */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <span className="text-foreground">{detailAmbulance.location}</span>
                </div>
                {detailAmbulance.status === 'in_service' && detailAmbulance.etaMinutes !== undefined && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-400 shrink-0" />
                    <span className="text-blue-600 font-medium">ETA: {formatEta(detailAmbulance.etaMinutes)}</span>
                  </div>
                )}
                {detailAmbulance.currentTransfer && (
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-400 shrink-0" />
                    <span className="text-muted-foreground">Transfer: <span className="text-foreground font-medium">{detailAmbulance.currentTransfer}</span></span>
                  </div>
                )}
              </div>

              {/* Vehicle info */}
              <div className="grid grid-cols-3 gap-3">
                {detailAmbulance.year && (
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <Shield size={16} className="mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p className="font-semibold text-foreground">{detailAmbulance.year}</p>
                  </div>
                )}
                {detailAmbulance.mileage !== undefined && (
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <Zap size={16} className="mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Mileage</p>
                    <p className="font-semibold text-foreground">{detailAmbulance.mileage.toLocaleString()} km</p>
                  </div>
                )}
                {detailAmbulance.lastService && (
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <Thermometer size={16} className="mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Last Service</p>
                    <p className="font-semibold text-foreground">{detailAmbulance.lastService}</p>
                  </div>
                )}
              </div>

              {/* Service due */}
              {detailAmbulance.nextServiceDue && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${new Date(detailAmbulance.nextServiceDue) < new Date() ? 'bg-red-50 dark:bg-red-900/20 border border-red-200' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200'}`}>
                  <AlertTriangle size={14} className={new Date(detailAmbulance.nextServiceDue) < new Date() ? 'text-red-600' : 'text-blue-600'} />
                  <span className={`text-sm ${new Date(detailAmbulance.nextServiceDue) < new Date() ? 'text-red-700' : 'text-blue-700'}`}>
                    Next service due: <strong>{detailAmbulance.nextServiceDue}</strong>
                    {new Date(detailAmbulance.nextServiceDue) < new Date() && ' — OVERDUE'}
                  </span>
                </div>
              )}

              {/* Maintenance notes */}
              {detailAmbulance.maintenanceNotes && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-600 mb-1 font-medium">Maintenance Notes</p>
                  <p className="text-orange-700 text-sm">{detailAmbulance.maintenanceNotes}</p>
                </div>
              )}

              {/* Equipment */}
              {detailAmbulance.equipment.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Equipment</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailAmbulance.equipment.map(e => (
                      <span key={e} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special capabilities */}
              {(detailAmbulance.hasDoctor || detailAmbulance.hasVentilator) && (
                <div className="flex gap-2">
                  {detailAmbulance.hasDoctor && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs">Doctor On Board</span>
                  )}
                  {detailAmbulance.hasVentilator && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">Ventilator</span>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setDetailAmbulance(null)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm"
            >
              Close
            </button>
            {detailAmbulance?.status === 'available' && (
              <button
                onClick={() => {
                  setDetailAmbulance(null);
                  setAssignAmbulance(detailAmbulance!);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Assign to Transfer
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          ASSIGN DIALOG
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!assignAmbulance} onOpenChange={open => !open && setAssignAmbulance(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign {assignAmbulance?.id} to Transfer</DialogTitle>
            <DialogDescription>Select a pending transfer request to assign this ambulance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {PENDING_TRANSFERS.map(t => (
              <label
                key={t.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedTransferId === t.id ? 'border-red-600 bg-red-50 dark:bg-red-900/10' : 'border-border hover:border-red-300'}`}
              >
                <input
                  type="radio"
                  name="transfer"
                  value={t.id}
                  checked={selectedTransferId === t.id}
                  onChange={() => setSelectedTransferId(t.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{t.patient}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(t.priority)}`}>
                      {t.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{t.id} · {t.from} → {t.to}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <button onClick={() => setAssignAmbulance(null)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm">
              Cancel
            </button>
            <button
              onClick={handleAssignConfirm}
              disabled={!selectedTransferId}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedTransferId ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Confirm Assignment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MAINTENANCE DIALOG
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!maintenanceAmbulance} onOpenChange={open => !open && setMaintenanceAmbulance(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench size={18} className="text-orange-500" />
              Schedule Maintenance — {maintenanceAmbulance?.id}
            </DialogTitle>
            <DialogDescription>
              This will immediately set the ambulance status to Maintenance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm text-foreground mb-1.5">Expected Return Date</label>
              <input
                type="date"
                value={maintenanceDate}
                onChange={e => setMaintenanceDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-input-field-bg text-foreground text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1.5">Maintenance Notes</label>
              <textarea
                value={maintenanceNotes}
                onChange={e => setMaintenanceNotes(e.target.value)}
                rows={3}
                placeholder="e.g., Oil change, brake inspection, tyre rotation..."
                className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-input-field-bg text-foreground text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setMaintenanceAmbulance(null)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm">
              Cancel
            </button>
            <button
              onClick={handleScheduleMaintenance}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Wrench size={14} /> Schedule Maintenance
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          ADD AMBULANCE DIALOG
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={18} className="text-red-600" />
              Add New Ambulance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            {/* ID */}
            <div>
              <label className="block text-foreground mb-1.5">Ambulance ID *</label>
              <input
                type="text"
                value={addForm.id}
                onChange={e => setAddForm(f => ({ ...f, id: e.target.value.toUpperCase() }))}
                placeholder="e.g., AMB-009"
                className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
              />
            </div>

            {/* Driver */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-foreground mb-1.5">Driver Name *</label>
                <input
                  type="text"
                  value={addForm.driver}
                  onChange={e => setAddForm(f => ({ ...f, driver: e.target.value }))}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                />
              </div>
              <div>
                <label className="block text-foreground mb-1.5">Driver Gender</label>
                <select
                  value={addForm.driverGender}
                  onChange={e => setAddForm(f => ({ ...f, driverGender: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>

            {/* Attendant */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-foreground mb-1.5">Attendant Name</label>
                <input
                  type="text"
                  value={addForm.attendant}
                  onChange={e => setAddForm(f => ({ ...f, attendant: e.target.value }))}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                />
              </div>
              <div>
                <label className="block text-foreground mb-1.5">Attendant Gender</label>
                <select
                  value={addForm.attendantGender}
                  onChange={e => setAddForm(f => ({ ...f, attendantGender: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>

            {/* Location & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-foreground mb-1.5">Base Location</label>
                <input
                  type="text"
                  value={addForm.location}
                  onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                />
              </div>
              <div>
                <label className="block text-foreground mb-1.5">Vehicle Year</label>
                <input
                  type="number"
                  value={addForm.year}
                  onChange={e => setAddForm(f => ({ ...f, year: parseInt(e.target.value) || f.year }))}
                  min={2000}
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                />
              </div>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-foreground mb-2">Equipment</label>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map(item => (
                  <label key={item} className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-accent text-xs">
                    <input
                      type="checkbox"
                      checked={addForm.equipment.includes(item)}
                      onChange={() => toggleEquipmentInAddForm(item)}
                      className="w-3.5 h-3.5 text-red-600"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            {/* Special capabilities */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
                <input
                  type="checkbox"
                  checked={addForm.hasDoctor}
                  onChange={e => setAddForm(f => ({ ...f, hasDoctor: e.target.checked }))}
                  className="w-4 h-4 text-red-600"
                />
                <div>
                  <p className="text-foreground font-medium">Doctor On Board</p>
                  <p className="text-muted-foreground text-xs">Unit carries an attending physician</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
                <input
                  type="checkbox"
                  checked={addForm.hasVentilator}
                  onChange={e => setAddForm(f => ({ ...f, hasVentilator: e.target.checked }))}
                  className="w-4 h-4 text-red-600"
                />
                <div>
                  <p className="text-foreground font-medium">Ventilator Support</p>
                  <p className="text-muted-foreground text-xs">Unit equipped with mechanical ventilator</p>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm">
              Cancel
            </button>
            <button
              onClick={handleAddAmbulance}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Plus size={14} /> Add to Fleet
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

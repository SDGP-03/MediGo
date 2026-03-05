import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ambulance, MapPin, User, Clock, Search, TrendingUp,
  Plus, Wrench, CheckCircle, AlertTriangle, ChevronRight,
  Thermometer, Activity, Shield, Zap, Trash2, Loader2,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../components/ui/dialog';
import { useFleetData } from '../hooks/useFleetData';
import type { AmbulanceUnit } from '../hooks/useFleetData';
import { initialDrivers } from './DriverProfiles';

// ─── Constants ────────────────────────────────────────────────────────────────

const EQUIPMENT_OPTIONS = [
  'Oxygen', 'Defibrillator', 'IV Fluids', 'Cardiac Monitor',
  'Ventilator', 'Stretcher', 'Blood Pressure Monitor', 'Pulse Oximeter',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Safety wrapper: Firebase can return arrays as {0:'a',1:'b'} objects.
// This always gives back a real JS array regardless.
const toArr = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'object') return Object.values(val as Record<string, string>);
  return [];
};

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

  // ── Firebase realtime hook ──
  // On first load with empty DB it auto-seeds all 8 ambulances.
  // All CRUD operations write directly to /hospitals/{uid}/ambulances/.
  const {
    ambulances,
    pendingTransfers,
    loading,
    error,
    addAmbulance,
    deleteAmbulance,
    assignAmbulanceToTransfer,
    scheduleMaintenance,
    completeMaintenance,
  } = useFleetData();

  // ── UI state ──
  const [filterStatus, setFilterStatus] = useState<'all' | AmbulanceUnit['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [detailAmbulance, setDetailAmbulance] = useState<AmbulanceUnit | null>(null);
  const [assignTarget, setAssignTarget] = useState<AmbulanceUnit | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState('');
  const [maintenanceTarget, setMaintenanceTarget] = useState<AmbulanceUnit | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AmbulanceUnit | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    id: '', driver: '', driverGender: 'Male',
    attendant: '', attendantGender: 'Male',
    location: 'City General Hospital',
    equipment: [] as string[],
    hasDoctor: false, hasVentilator: false,
    year: new Date().getFullYear(),
  });

  // ── Toast helper ──
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Derived stats ──
  const stats = {
    total: ambulances.length,
    available: ambulances.filter(a => a.status === 'available').length,
    inService: ambulances.filter(a => a.status === 'in_service').length,
    maintenance: ambulances.filter(a => a.status === 'maintenance').length,
  };

  const filteredAmbulances = ambulances.filter(amb => {
    const matchesStatus = filterStatus === 'all' || amb.status === filterStatus;
    const q = searchTerm.toLowerCase();
    return matchesStatus && (!q ||
      amb.id.toLowerCase().includes(q) ||
      amb.driver.toLowerCase().includes(q) ||
      amb.location.toLowerCase().includes(q) ||
      (amb.currentTransfer ?? '').toLowerCase().includes(q));
  });

  // ── Calculate fuel efficiency from Firebase ──
  // Fuel efficiency = (fuel consumed / 100km) per 100km traveled
  // From real ambulance data: fuelConsumed (liters) and mileage (km)
  const calculateFuelEfficiency = (): { avgEfficiency: number; monthlyData: { month: string; value: number }[] } => {
    if (ambulances.length === 0) {
      return { avgEfficiency: 0, monthlyData: [] };
    }

    // Calculate average fuel efficiency (L/100km) for all ambulances
    let totalEfficiency = 0;
    let validCount = 0;

    ambulances.forEach(amb => {
      if (amb.mileage && amb.mileage > 0 && amb.fuelConsumed && amb.fuelConsumed > 0) {
        const efficiency = (amb.fuelConsumed / amb.mileage) * 100; // L/100km
        totalEfficiency += efficiency;
        validCount++;
      }
    });

    const avgEfficiency = validCount > 0 ? Math.round(totalEfficiency / validCount * 10) / 10 : 0;

    // Aggregate monthly fuel data from all ambulances
    const monthlyAgg: { [month: string]: number } = {};
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    ambulances.forEach(amb => {
      if (amb.monthlyFuelData) {
        Object.entries(amb.monthlyFuelData).forEach(([month, fuel]) => {
          monthlyAgg[month] = (monthlyAgg[month] || 0) + fuel;
        });
      }
    });

    // Calculate monthly efficiency (L/100km) and convert to sorted array
    const monthlyData = monthOrder
      .filter(m => monthlyAgg[m])
      .map(month => ({
        month,
        value: Math.round((monthlyAgg[month] / 5500) * 100 * 10) / 10, // Assuming ~5500km per month fleet-wide
      }));

    return { avgEfficiency, monthlyData };
  };

  const { avgEfficiency, monthlyData: calculatedFuelData } = calculateFuelEfficiency();

  const fuelData = calculatedFuelData.length > 0
    ? calculatedFuelData
    : [{ month: 'Jan', value: 0 }, { month: 'Feb', value: 0 }, { month: 'Mar', value: 0 }];

  // ── Distance data (from total mileage) ──
  const totalMileage = ambulances.reduce((sum, a) => sum + (a.mileage || 0), 0);
  const avgMileagePerAmbulance = ambulances.length > 0 ? Math.round(totalMileage / ambulances.length) : 0;

  const distanceData = [
    { day: 'Mon', value: avgMileagePerAmbulance * 0.4 }, { day: 'Tue', value: avgMileagePerAmbulance * 0.43 },
    { day: 'Wed', value: avgMileagePerAmbulance * 0.46 }, { day: 'Thu', value: avgMileagePerAmbulance * 0.49 },
    { day: 'Fri', value: avgMileagePerAmbulance * 0.53 }, { day: 'Sat', value: avgMileagePerAmbulance * 0.57 },
    { day: 'Sun', value: avgMileagePerAmbulance * 0.42 },
  ];

  // ── Styling helpers ──
  const getStatusColor = (s: string) => {
    if (s === 'available') return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    if (s === 'in_service') return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    if (s === 'maintenance') return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
    return 'bg-secondary text-secondary-foreground border-border';
  };
  const getPriorityColor = (p: string) =>
    p === 'critical' ? 'bg-red-600 text-white' : p === 'urgent' ? 'bg-orange-500 text-white' : 'bg-green-600 text-white';

  // ── Firebase actions ──

  const handleAssignConfirm = async () => {
    if (!assignTarget || !selectedTransferId) return;
    const transfer = pendingTransfers.find(t => t.id === selectedTransferId);
    if (!transfer) return;
    setActionLoading(true);
    try {
      await assignAmbulanceToTransfer(assignTarget.id, transfer);
      showToast(`${assignTarget.id} assigned to transfer ${selectedTransferId} ✓`);
      setAssignTarget(null);
      setSelectedTransferId('');
    } catch {
      showToast('Failed to assign ambulance.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!maintenanceTarget) return;
    setActionLoading(true);
    try {
      await scheduleMaintenance(maintenanceTarget.id, maintenanceDate, maintenanceNotes);
      showToast(`${maintenanceTarget.id} scheduled for maintenance ✓`);
      setMaintenanceTarget(null);
      setMaintenanceDate('');
      setMaintenanceNotes('');
    } catch {
      showToast('Failed to schedule maintenance.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteMaintenance = async (ambId: string) => {
    setActionLoading(true);
    try {
      await completeMaintenance(ambId);
      showToast(`${ambId} maintenance complete — now available ✓`);
    } catch {
      showToast('Failed to complete maintenance.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAmbulance = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteAmbulance(deleteTarget.id);
      showToast(`${deleteTarget.id} removed from fleet ✓`);
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete ambulance.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAmbulance = async () => {
    if (!addForm.id.trim() || !addForm.driver.trim()) {
      showToast('Ambulance ID and driver name are required.', 'error');
      return;
    }
    const newId = addForm.id.trim().toUpperCase();
    if (ambulances.some(a => a.id === newId)) {
      showToast(`ID ${newId} already exists.`, 'error');
      return;
    }
    const newUnit: AmbulanceUnit = {
      id: newId,
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
    setActionLoading(true);
    try {
      await addAmbulance(newUnit);
      showToast(`${newUnit.id} added to the fleet ✓`);
      setShowAddModal(false);
      setAddForm({
        id: '', driver: '', driverGender: 'Male', attendant: '', attendantGender: 'Male',
        location: 'City General Hospital', equipment: [], hasDoctor: false, hasVentilator: false,
        year: new Date().getFullYear(),
      });
    } catch {
      showToast('Failed to add ambulance. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleEquipment = (item: string) =>
    setAddForm(f => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter(e => e !== item)
        : [...f.equipment, item],
    }));

  // ─── Loading / Error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-full">
          <Loader2 size={40} className="text-red-600 animate-spin" />
        </div>
        <p className="text-foreground font-semibold text-lg">Loading fleet data…</p>
        <p className="text-muted-foreground text-sm">Connecting to Firebase Realtime Database</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-full">
          <AlertTriangle size={40} className="text-red-600" />
        </div>
        <p className="text-foreground font-semibold text-lg">Failed to load fleet data</p>
        <p className="text-muted-foreground text-sm max-w-sm text-center">{error}</p>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 relative">

      {/* ── Toast notifications ── */}
      <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white text-sm flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300 ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
              }`}
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
          <Plus size={18} /> Add Ambulance
        </button>
      </div>

      {/* ── Stat cards ── */}
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
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-foreground font-semibold">Fuel Efficiency</h4>
              <p className="text-muted-foreground text-sm">Avg liters / 100 km (from Firebase)</p>
            </div>
            <span className="flex items-center gap-1 text-teal-600 text-sm font-medium"><TrendingUp size={14} /> +12%</span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-4">{avgEfficiency.toFixed(1)}L</div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={fuelData}>
              <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} dot={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-foreground font-semibold">Distance Travelled</h4>
              <p className="text-muted-foreground text-sm">Kilometers per day (avg)</p>
            </div>
            <span className="flex items-center gap-1 text-teal-600 text-sm font-medium"><TrendingUp size={14} /> +8%</span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-4">{Math.round(avgMileagePerAmbulance * 0.49)}km</div>
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
              const active: Record<string, string> = { all: 'bg-red-600 text-white border-red-600', available: 'bg-green-600 text-white border-green-600', in_service: 'bg-blue-600 text-white border-blue-600', maintenance: 'bg-orange-600 text-white border-orange-600' };
              return (
                <button key={f} onClick={() => setFilterStatus(f)}
                  className={`px-4 py-2.5 rounded-lg border transition-colors text-sm ${filterStatus === f ? active[f] : 'bg-card text-foreground border-border hover:bg-accent'}`}>
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
          <div key={ambulance.id}
            className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-all hover:border-red-200 dark:hover:border-red-900/50 group flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${ambulance.status === 'available' ? 'bg-green-50 dark:bg-green-900/20' : ambulance.status === 'in_service' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                  <Ambulance size={22} className={ambulance.status === 'available' ? 'text-green-600' : ambulance.status === 'in_service' ? 'text-blue-600' : 'text-orange-600'} />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold">{ambulance.id}</h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStatusColor(ambulance.status)}`}>
                    {ambulance.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetailAmbulance(ambulance)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 opacity-0 group-hover:opacity-100" title="View details">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Info */}
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
                  {ambulance.currentTransfer && <span className="text-muted-foreground">— {ambulance.currentTransfer}</span>}
                </div>
              )}
              {ambulance.status === 'maintenance' && ambulance.maintenanceNotes && (
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-orange-400 shrink-0" />
                  <span className="text-orange-600 text-xs">{ambulance.maintenanceNotes}</span>
                </div>
              )}
            </div>

            {/* Equipment — card */}
            {toArr(ambulance.equipment).length > 0 && (
              <div className="mb-4">
                <p className="text-muted-foreground text-xs mb-1.5">Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  {toArr(ambulance.equipment).map(item => (
                    <span key={item} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {(ambulance.hasDoctor || ambulance.hasVentilator) && (
              <div className="flex gap-2 mb-4">
                {ambulance.hasDoctor && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs">Doctor On Board</span>}
                {ambulance.hasVentilator && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">Ventilator</span>}
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-border flex flex-col gap-2 mt-auto">
              {ambulance.status === 'available' && (
                <>
                  <button onClick={() => { setAssignTarget(ambulance); setSelectedTransferId(''); }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                    Assign to Transfer
                  </button>
                  <button onClick={() => { setMaintenanceTarget(ambulance); setMaintenanceDate(''); setMaintenanceNotes(''); }}
                    className="w-full px-4 py-2 bg-card border border-border text-muted-foreground rounded-lg hover:bg-accent transition-colors text-sm flex items-center justify-center gap-2">
                    <Wrench size={14} /> Schedule Maintenance
                  </button>
                  <button onClick={() => setDeleteTarget(ambulance)}
                    className="w-full px-4 py-2 bg-card border border-border text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm flex items-center justify-center gap-2">
                    <Trash2 size={14} /> Delete Ambulance
                  </button>
                </>
              )}
              {ambulance.status === 'in_service' && ambulance.currentTransfer && (
                <>
                  <button onClick={() => navigate('/')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Track Transfer {ambulance.currentTransfer}
                  </button>
                  <button onClick={() => { setMaintenanceTarget(ambulance); setMaintenanceDate(''); setMaintenanceNotes(''); }}
                    className="w-full px-4 py-2 bg-card border border-border text-muted-foreground rounded-lg hover:bg-accent transition-colors text-sm flex items-center justify-center gap-2">
                    <Wrench size={14} /> Schedule Maintenance
                  </button>
                </>
              )}
              {ambulance.status === 'maintenance' && (
                <>
                  <button onClick={() => handleCompleteMaintenance(ambulance.id)} disabled={actionLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Mark Maintenance Complete
                  </button>
                  <button onClick={() => setDeleteTarget(ambulance)}
                    className="w-full px-4 py-2 bg-card border border-border text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm flex items-center justify-center gap-2">
                    <Trash2 size={14} /> Delete Ambulance
                  </button>
                </>
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

      {/* FAB */}
      <button onClick={() => navigate('/transfer')}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 z-50 flex items-center gap-2 group"
        title="New Transfer Request">
        <Ambulance size={22} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm">New Request</span>
      </button>

      {/* ══════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={!!detailAmbulance} onOpenChange={open => !open && setDetailAmbulance(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ambulance size={20} className="text-red-600" /> {detailAmbulance?.id} — Details
            </DialogTitle>
          </DialogHeader>
          {detailAmbulance && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(detailAmbulance.status)}`}>
                  {detailAmbulance.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
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
              {detailAmbulance.nextServiceDue && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${new Date(detailAmbulance.nextServiceDue) < new Date() ? 'bg-red-50 dark:bg-red-900/20 border border-red-200' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200'}`}>
                  <AlertTriangle size={14} className={new Date(detailAmbulance.nextServiceDue) < new Date() ? 'text-red-600' : 'text-blue-600'} />
                  <span className={`text-sm ${new Date(detailAmbulance.nextServiceDue) < new Date() ? 'text-red-700' : 'text-blue-700'}`}>
                    Next service due: <strong>{detailAmbulance.nextServiceDue}</strong>
                    {new Date(detailAmbulance.nextServiceDue) < new Date() && ' — OVERDUE'}
                  </span>
                </div>
              )}
              {detailAmbulance.maintenanceNotes && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-600 mb-1 font-medium">Maintenance Notes</p>
                  <p className="text-orange-700 text-sm">{detailAmbulance.maintenanceNotes}</p>
                </div>
              )}
              {toArr(detailAmbulance.equipment).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Equipment</p>
                  <div className="flex flex-wrap gap-1.5">
                    {toArr(detailAmbulance.equipment).map(e => (
                      <span key={e} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {(detailAmbulance.hasDoctor || detailAmbulance.hasVentilator) && (
                <div className="flex gap-2">
                  {detailAmbulance.hasDoctor && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs">Doctor On Board</span>}
                  {detailAmbulance.hasVentilator && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">Ventilator</span>}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setDetailAmbulance(null)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm">Close</button>
            {detailAmbulance?.status === 'available' && (
              <button onClick={() => { setDetailAmbulance(null); setAssignTarget(detailAmbulance!); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                Assign to Transfer
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          ASSIGN DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={!!assignTarget} onOpenChange={open => !open && setAssignTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign {assignTarget?.id} to Transfer</DialogTitle>
            <DialogDescription>Select a pending transfer request to assign this ambulance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {pendingTransfers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No pending transfers at the moment.</p>
            ) : pendingTransfers.map(t => (
              <label key={t.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedTransferId === t.id ? 'border-red-600 bg-red-50 dark:bg-red-900/10' : 'border-border hover:border-red-300'}`}>
                <input type="radio" name="transfer" value={t.id} checked={selectedTransferId === t.id}
                  onChange={() => setSelectedTransferId(t.id)} className="mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{t.patient}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(t.priority)}`}>{t.priority.toUpperCase()}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{t.id} · {t.from} → {t.to}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <button onClick={() => setAssignTarget(null)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm">Cancel</button>
            <button onClick={handleAssignConfirm} disabled={!selectedTransferId || actionLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${selectedTransferId && !actionLoading ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
              {actionLoading && <Loader2 size={14} className="animate-spin" />}
              Confirm Assignment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          MAINTENANCE DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={!!maintenanceTarget} onOpenChange={open => !open && setMaintenanceTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench size={18} className="text-orange-500" /> Schedule Maintenance — {maintenanceTarget?.id}
            </DialogTitle>
            <DialogDescription>This will immediately set the ambulance status to Maintenance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm text-foreground mb-1.5">Expected Return Date</label>
              <input type="date" value={maintenanceDate} onChange={e => setMaintenanceDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-input-field-bg text-foreground text-sm" />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1.5">Maintenance Notes</label>
              <textarea value={maintenanceNotes} onChange={e => setMaintenanceNotes(e.target.value)} rows={3}
                placeholder="e.g., Oil change, brake inspection, tyre rotation..."
                className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-input-field-bg text-foreground text-sm resize-none" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setMaintenanceTarget(null)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm">Cancel</button>
            <button onClick={handleScheduleMaintenance} disabled={actionLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
              Schedule Maintenance
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          DELETE DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle size={20} /> Delete Ambulance</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{deleteTarget?.id}</strong> from the fleet? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
            <p className="font-medium mb-1">Warning:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Driver: {deleteTarget?.driver}</li>
              <li>Status: {deleteTarget?.status.replace('_', ' ').toUpperCase()}</li>
              <li>Location: {deleteTarget?.location}</li>
            </ul>
          </div>
          <DialogFooter>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm">Cancel</button>
            <button onClick={handleDeleteAmbulance} disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          ADD AMBULANCE DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus size={18} className="text-red-600" /> Add New Ambulance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <div>
              <label className="block text-foreground mb-1.5">Ambulance ID *</label>
              <input type="text" value={addForm.id}
                onChange={e => setAddForm(f => ({ ...f, id: e.target.value.toUpperCase() }))}
                placeholder="e.g., AMB-009"
                className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-foreground mb-1.5">Driver Name *</label>
                <select value={initialDrivers.find(d => d.name === addForm.driver)?.id ?? ''}
                  onChange={e => {
                    const id = e.target.value;
                    const drv = initialDrivers.find(d => d.id === id);
                    setAddForm(f => ({ ...f, driver: drv ? drv.name : '', driverGender: drv ? drv.gender : f.driverGender }));
                  }}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground">
                  <option value="">Select driver</option>
                  {initialDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-foreground mb-1.5">Driver Gender</label>
                <select value={addForm.driverGender}
                  onChange={e => setAddForm(f => ({ ...f, driverGender: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground">
                  <option>Male</option><option>Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-foreground mb-1.5">Attendant Name</label>
                <input type="text" value={addForm.attendant}
                  onChange={e => setAddForm(f => ({ ...f, attendant: e.target.value }))}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground" />
              </div>
              <div>
                <label className="block text-foreground mb-1.5">Attendant Gender</label>
                <select value={addForm.attendantGender}
                  onChange={e => setAddForm(f => ({ ...f, attendantGender: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground">
                  <option>Male</option><option>Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-foreground mb-1.5">Base Location</label>
                <input type="text" value={addForm.location}
                  onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground" />
              </div>
              <div>
                <label className="block text-foreground mb-1.5">Vehicle Year</label>
                <input type="number" value={addForm.year}
                  onChange={e => setAddForm(f => ({ ...f, year: parseInt(e.target.value) || f.year }))}
                  min={2000} max={new Date().getFullYear()}
                  className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground" />
              </div>
            </div>
            <div>
              <label className="block text-foreground mb-2">Equipment</label>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map(item => (
                  <label key={item} className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-accent text-xs">
                    <input type="checkbox" checked={addForm.equipment.includes(item)}
                      onChange={() => toggleEquipment(item)} className="w-3.5 h-3.5 text-red-600" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
                <input type="checkbox" checked={addForm.hasDoctor}
                  onChange={e => setAddForm(f => ({ ...f, hasDoctor: e.target.checked }))} className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-foreground font-medium">Doctor On Board</p>
                  <p className="text-muted-foreground text-xs">Unit carries an attending physician</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
                <input type="checkbox" checked={addForm.hasVentilator}
                  onChange={e => setAddForm(f => ({ ...f, hasVentilator: e.target.checked }))} className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-foreground font-medium">Ventilator Support</p>
                  <p className="text-muted-foreground text-xs">Unit equipped with mechanical ventilator</p>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm">Cancel</button>
            <button onClick={handleAddAmbulance} disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add to Fleet
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

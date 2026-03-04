import { useState, useEffect } from 'react';
import { User, MapPin, AlertCircle, FileText, Users, Clock, Truck, CheckCircle2, AlertTriangle, XCircle, Info, Building2 } from 'lucide-react';
import { database } from '../firebase';
import { ref, push, set, onValue, off } from 'firebase/database';

// Hospital coordinates mapping (you can expand this or fetch from Firestore)
const hospitalCoordinates: Record<string, { lat: number; lng: number; address: string }> = {
  'General Hospital O P D': { lat: 6.918955913694652, lng: 79.86611697073118, address: 'WV98+HC9, EW Perera Mawatha, Colombo 01000, Sri Lanka' },
  'Lady Ridgeway Hospital for Children (LRH)': { lat: 6.918381526890345, lng: 79.8759550393045, address: 'Dr Danister De Silva Mawatha, Colombo 00800, Sri Lanka' },
};

interface AvailableDriver {
  id: string;
  driverName: string;
  lat: number;
  lng: number;
}

export function TransferRequest() {
  const [step, setStep] = useState<'patient' | 'transfer' | 'ambulance'>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Patient Info
    patientName: '',
    patientAge: '0',
    patientGender: '',
    patientId: '',
    bloodGroup: '',
    allergies: '',

    // Transfer Info
    fromHospital: 'General Hospital O P D',
    toHospital: '',
    reason: '',
    priority: 'standard',
    medicalHistory: '',
    currentCondition: '',
    vitalSigns: '',
    requiredEquipment: [] as string[],

    // Ambulance Requirements
    requiresDoctor: false,
    requiresVentilator: false,
    requiresOxygen: true,
    attendantGender: '',
  });

  // Fetch available drivers from Firebase
  useEffect(() => {
    const driversRef = ref(database, 'driver_locations');
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (!data) {
        setAvailableDrivers([]);
        return;
      }

      const drivers: AvailableDriver[] = Object.entries(data)
        .map(([id, value]: [string, any]) => ({
          id,
          driverName: value.driverName || 'Unknown Driver',
          lat: value.lat,
          lng: value.lng,
          isOnline: value.isOnline || false,
          timestamp: value.timestamp || 0,
        }))
        .filter((d: any) => d.isOnline && d.lat && d.lng && (Date.now() - d.timestamp) < FIVE_MINUTES);

      setAvailableDrivers(drivers);
    };

    onValue(driversRef, handleData);
    return () => off(driversRef);
  }, []);

  const hospitals = [
    'General Hospital O P D',
    'Lady Ridgeway Hospital for Children (LRH)',
    'Regional Base Hospital',
    'Teaching Hospital East',
    'Metro Hospital',
  ];

  const equipment = [
    'Oxygen Cylinder',
    'Ventilator',
    'Defibrillator',
    'IV Fluids',
    'Cardiac Monitor',
    'Stretcher (Special)',
  ];

  const validatePatientStep = () => {
    const errors: Record<string, string> = {};
    if (!formData.patientName) errors.patientName = 'Patient Name is required';
    if (!formData.patientId) errors.patientId = 'Patient ID is required';
    if (!formData.patientAge) errors.patientAge = 'Age is required';
    if (!formData.patientGender) errors.patientGender = 'Gender is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const validateTransferStep = () => {
    const errors: Record<string, string> = {};
    if (!formData.toHospital) errors.toHospital = 'Destination hospital is required';
    if (!formData.priority) errors.priority = 'Priority level is required';
    if (!formData.reason) errors.reason = 'Reason for transfer is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDriverId) {
      setFormErrors({ selectedDriverId: 'Please select a driver to assign this transfer request.' });
      return;
    }

    setFormErrors({});

    setIsSubmitting(true);

    try {
      const requestsRef = ref(database, 'transfer_requests');
      const newRequestRef = push(requestsRef);

      const fromCoords = hospitalCoordinates[formData.fromHospital] || { lat: 0, lng: 0, address: '' };
      const toCoords = hospitalCoordinates[formData.toHospital] || { lat: 0, lng: 0, address: '' };

      await set(newRequestRef, {
        status: 'pending',
        driverId: selectedDriverId,
        priority: formData.priority,
        createdAt: Date.now(),

        patient: {
          name: formData.patientName,
          age: formData.patientAge,
          gender: formData.patientGender,
          id: formData.patientId,
          bloodGroup: formData.bloodGroup,
          allergies: formData.allergies,
          medicalHistory: formData.medicalHistory,
          currentCondition: formData.currentCondition,
        },

        pickup: {
          hospitalName: formData.fromHospital,
          address: fromCoords.address,
          lat: fromCoords.lat,
          lng: fromCoords.lng,
        },

        destination: {
          hospitalName: formData.toHospital,
          address: toCoords.address,
          lat: toCoords.lat,
          lng: toCoords.lng,
        },

        requirements: {
          requiresDoctor: formData.requiresDoctor,
          requiresVentilator: formData.requiresVentilator,
          requiresOxygen: formData.requiresOxygen,
          equipment: formData.requiredEquipment,
        },

        reason: formData.reason,
      });

      setFormErrors({ submitSuccess: 'Transfer request sent to driver! They will receive a notification shortly.' });

      // Reset form
      setStep('patient');
      setFormData({
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientId: '',
        bloodGroup: '',
        allergies: '',
        fromHospital: 'General Hospital O P D',
        toHospital: '',
        reason: '',
        priority: 'standard',
        medicalHistory: '',
        currentCondition: '',
        vitalSigns: '',
        requiredEquipment: [],
        requiresDoctor: false,
        requiresVentilator: false,
        requiresOxygen: true,
        attendantGender: '',
      });
      setSelectedDriverId('');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.submitSuccess;
          return newErrors;
        });
      }, 5000);

    } catch (error) {
      console.error('Error submitting transfer request:', error);
      setFormErrors({ submitError: 'Failed to submit transfer request. Please try again.' });
      // Clear error message after 5 seconds
      setTimeout(() => {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.submitError;
          return newErrors;
        });
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Success Notification */}
      {formErrors.submitSuccess && (
        <div className="absolute top-0 right-0 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 px-6 py-4 bg-green-50 border border-green-200 text-green-700 rounded-lg shadow-lg">
            <CheckCircle2 size={24} className="text-green-600" />
            <p className="font-medium text-green-900">{formErrors.submitSuccess}</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {formErrors.submitError && (
        <div className="absolute top-0 right-0 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-lg">
            <XCircle size={24} className="text-red-600" />
            <p className="font-medium text-red-900">{formErrors.submitError}</p>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${step === 'patient' ? 'text-red-600' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'patient' ? 'bg-red-600 text-white' : 'bg-muted'
              }`}>
              1
            </div>
            <span>Patient Information</span>
          </div>
          <div className="flex-1 h-0.5 bg-border mx-4"></div>
          <div className={`flex items-center gap-3 ${step === 'transfer' ? 'text-red-600' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'transfer' ? 'bg-red-600 text-white' : 'bg-muted'
              }`}>
              2
            </div>
            <span>Transfer Details</span>
          </div>
          <div className="flex-1 h-0.5 bg-border mx-4"></div>
          <div className={`flex items-center gap-3 ${step === 'ambulance' ? 'text-red-600' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'ambulance' ? 'bg-red-600 text-white' : 'bg-muted'
              }`}>
              3
            </div>
            <span>Ambulance Requirements</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Patient Information */}
        {step === 'patient' && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-foreground mb-6 flex items-center gap-2">
                <User size={24} className="text-red-600" />
                Patient Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-foreground mb-2">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => {
                      setFormData({ ...formData, patientName: e.target.value });
                      if (formErrors.patientName) setFormErrors({ ...formErrors, patientName: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground ${formErrors.patientName ? 'border-red-500 ring-1 ring-red-500' : 'border-input'
                      }`}
                    placeholder="Full name"
                  />
                  {formErrors.patientName && <p className="text-red-500 text-xs mt-1">{formErrors.patientName}</p>}
                </div>

                <div>
                  <label className="block text-foreground mb-2">Patient ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.patientId}
                    onChange={(e) => {
                      setFormData({ ...formData, patientId: e.target.value });
                      if (formErrors.patientId) setFormErrors({ ...formErrors, patientId: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground ${formErrors.patientId ? 'border-red-500 ring-1 ring-red-500' : 'border-input'
                      }`}
                    placeholder="Hospital patient ID"
                  />
                  {formErrors.patientId && <p className="text-red-500 text-xs mt-1">{formErrors.patientId}</p>}
                </div>

                <div>
                  <label className="block text-foreground mb-2">Age *</label>
                  <input
                    type="number"
                    required
                    value={formData.patientAge}
                    onChange={(e) => {
                      setFormData({ ...formData, patientAge: e.target.value });
                      if (formErrors.patientAge) setFormErrors({ ...formErrors, patientAge: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground ${formErrors.patientAge ? 'border-red-500 ring-1 ring-red-500' : 'border-input'
                      }`}
                    placeholder="Age in years"
                  />
                  {formErrors.patientAge && <p className="text-red-500 text-xs mt-1">{formErrors.patientAge}</p>}
                </div>

                <div>
                  <label className="block text-foreground mb-2">Gender *</label>
                  <select
                    required
                    value={formData.patientGender}
                    onChange={(e) => {
                      setFormData({ ...formData, patientGender: e.target.value, attendantGender: e.target.value });
                      if (formErrors.patientGender) setFormErrors({ ...formErrors, patientGender: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground ${formErrors.patientGender ? 'border-red-500 ring-1 ring-red-500' : 'border-input'
                      }`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.patientGender && <p className="text-red-500 text-xs mt-1">{formErrors.patientGender}</p>}
                </div>

                <div>
                  <label className="block text-foreground mb-2">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-foreground mb-2">Known Allergies</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                    placeholder="e.g., Penicillin, Latex"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-foreground mb-2">Medical History</label>
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[100px] bg-input-field-bg text-foreground"
                  placeholder="Brief medical history and relevant conditions..."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (validatePatientStep()) {
                  setStep('transfer');
                }
              }}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Continue to Transfer Details
            </button>
          </div>
        )}

        {/* Step 2: Transfer Details */}
        {step === 'transfer' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Transfer Form */}
              <div className="space-y-6 flex flex-col">
                <div className="bg-card rounded-lg shadow-sm border border-border p-6 flex-1">
                  <h2 className="text-foreground mb-6 flex items-center gap-2">
                    <MapPin size={24} className="text-red-600" />
                    Transfer Details
                  </h2>

                  <div className="grid grid-cols-1 gap-6 mb-6">
                    <div>
                      <label className="block text-foreground mb-2">From Hospital</label>
                      <input
                        type="text"
                        disabled
                        value={formData.fromHospital}
                        className="w-full px-4 py-3 border border-input rounded-lg bg-muted text-muted-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground mb-2">To Hospital *</label>
                      <select
                        required
                        value={formData.toHospital}
                        onChange={(e) => {
                          setFormData({ ...formData, toHospital: e.target.value });
                          if (formErrors.toHospital) setFormErrors({ ...formErrors, toHospital: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground ${formErrors.toHospital ? 'border-red-500 ring-1 ring-red-500' : 'border-input'
                          }`}
                      >
                        <option value="">Select destination hospital</option>
                        {hospitals.map(hospital => (
                          <option key={hospital} value={hospital}>{hospital}</option>
                        ))}
                      </select>
                      {formErrors.toHospital && <p className="text-red-500 text-xs mt-1">{formErrors.toHospital}</p>}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-foreground mb-2">Priority Level *</label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: 'critical' })}
                        className={`p-4 rounded-lg border-2 transition-all ${formData.priority === 'critical'
                          ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'border-border hover:border-red-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-600"></div>
                          <span className="text-foreground text-sm font-medium">Critical</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                        className={`p-4 rounded-lg border-2 transition-all ${formData.priority === 'urgent'
                          ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-border hover:border-orange-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                          <span className="text-foreground text-sm font-medium">Urgent</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: 'standard' })}
                        className={`p-4 rounded-lg border-2 transition-all ${formData.priority === 'standard'
                          ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'border-border hover:border-green-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-600"></div>
                          <span className="text-foreground text-sm font-medium">Standard</span>
                        </div>
                      </button>
                    </div>
                    {formErrors.priority && <p className="text-red-500 text-xs mt-2">{formErrors.priority}</p>}
                  </div>

                  <div className="mb-6">
                    <label className="block text-foreground mb-2">Reason for Transfer *</label>
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(e) => {
                        setFormData({ ...formData, reason: e.target.value });
                        if (formErrors.reason) setFormErrors({ ...formErrors, reason: '' });
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[100px] bg-input-field-bg text-foreground ${formErrors.reason ? 'border-red-500 ring-1 ring-red-500' : 'border-input'
                        }`}
                      placeholder="Detailed reason for inter-hospital transfer..."
                    />
                    {formErrors.reason && <p className="text-red-500 text-xs mt-1">{formErrors.reason}</p>}
                  </div>

                  <div className="mb-6">
                    <label className="block text-foreground mb-2">Current Condition & Vital Signs</label>
                    <textarea
                      value={formData.currentCondition}
                      onChange={(e) => setFormData({ ...formData, currentCondition: e.target.value })}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[80px] bg-input-field-bg text-foreground"
                      placeholder="BP, Heart Rate, Oxygen Saturation, Temperature, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-foreground mb-2">Required Equipment</label>
                    <div className="grid grid-cols-2 gap-3">
                      {equipment.map(item => (
                        <label key={item} className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requiredEquipment.includes(item)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  requiredEquipment: [...formData.requiredEquipment, item]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  requiredEquipment: formData.requiredEquipment.filter(i => i !== item)
                                });
                              }
                            }}
                            className="w-4 h-4 text-red-600"
                          />
                          <span className="text-foreground text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Hospital Resource Availability & Guidance */}
              <div className="space-y-6">
                <div className="bg-card rounded-lg shadow-sm border border-border p-6 shadow-md transition-all">
                  <h2 className="text-foreground mb-6 flex items-center gap-2 font-semibold">
                    <Building2 size={24} className="text-blue-600" />
                    Hospital Resource Availability
                  </h2>

                  {!formData.toHospital ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl text-center bg-accent/30 py-16">
                      <Building2 size={48} className="text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground text-sm max-w-xs">Select a destination hospital to view its real-time resource availability.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg mb-6 shadow-inner">
                        <p className="text-blue-900 dark:text-blue-300 text-sm font-medium opacity-80 mb-1">Viewing live data for:</p>
                        <p className="text-blue-700 dark:text-blue-400 font-bold text-lg">{formData.toHospital}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 content-start">
                        {[
                          { id: 'icu', name: 'ICU Beds', status: formData.toHospital.includes('Central') ? 'full' : 'available' },
                          { id: 'nicu', name: 'NICU Beds', status: formData.toHospital.includes('Specialist') ? 'limited' : 'available' },
                          { id: 'picu', name: 'PICU Beds', status: 'available' },
                          { id: 'er', name: 'Emergency Room', status: formData.toHospital.includes('East') ? 'full' : 'available' },
                          { id: 'med_surg', name: 'Med/Surg Beds', status: formData.toHospital.includes('Metro') ? 'limited' : 'available' },
                        ].map((resource) => (
                          <div key={resource.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                            <span className="text-foreground font-medium text-sm">{resource.name}</span>
                            <div className="flex items-center gap-2">
                              {resource.status === 'available' && (
                                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                  <CheckCircle2 size={16} /> Available
                                </span>
                              )}
                              {resource.status === 'limited' && (
                                <span className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                  <AlertTriangle size={16} /> Limited
                                </span>
                              )}
                              {resource.status === 'full' && (
                                <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                  <XCircle size={16} /> Full
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Guidance / Legend Section */}
                <div className="bg-gradient-to-br from-card to-accent/20 rounded-lg shadow-sm border border-border p-6">
                  <h3 className="text-foreground mb-5 flex items-center gap-2 font-semibold">
                    <Info size={20} className="text-muted-foreground" />
                    Availability Indicator Guide
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg shrink-0">
                        <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-semibold mb-1">Available resource</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">Sufficient capacity exists to accommodate incoming patients without delay. Preferred destination for standard transfers.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg shrink-0">
                        <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-semibold mb-1">Limited capacity</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">Resources are nearing capacity limits. Patient may experience boarding delays. Proceed only if closer alternatives are full.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg shrink-0">
                        <XCircle size={20} className="text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-semibold mb-1">Full / Critical status</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">No resources currently available. Selecting this hospital may result in immediate rejection or severe diversion.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('patient')}
                className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateTransferStep()) {
                    setStep('ambulance');
                  }
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Continue to Requirements
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ambulance Requirements */}
        {
          step === 'ambulance' && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-foreground mb-6 flex items-center gap-2">
                  <Users size={24} className="text-red-600" />
                  Ambulance & Staff Requirements
                </h2>

                <div className="space-y-6">
                  {/* Driver Selection */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Truck className="text-green-600 flex-shrink-0 mt-1" size={20} />
                      <div className="w-full">
                        <p className="text-green-900 mb-2 font-medium">Select Available Driver</p>
                        {availableDrivers.length === 0 ? (
                          <p className="text-orange-600 text-sm">
                            ⚠️ No drivers currently available. Please wait for a driver to come online.
                          </p>
                        ) : (
                          <>
                            <select
                              required
                              value={selectedDriverId}
                              onChange={(e) => {
                                setSelectedDriverId(e.target.value);
                                if (formErrors.selectedDriverId) setFormErrors({ ...formErrors, selectedDriverId: '' });
                              }}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-input-field-bg text-foreground ${formErrors.selectedDriverId ? 'border-red-500 ring-1 ring-red-500' : 'border-input'
                                }`}
                            >
                              <option value="">Select a driver...</option>
                              {availableDrivers.map(driver => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.driverName} (ID: {driver.id.substring(0, 8)}...)
                                </option>
                              ))}
                            </select>
                            {formErrors.selectedDriverId && <p className="text-red-500 text-xs mt-1">{formErrors.selectedDriverId}</p>}
                          </>
                        )}
                        <p className="text-green-700 text-xs mt-2">
                          {availableDrivers.length} driver(s) currently online
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                      <div>
                        <p className="text-blue-900 mb-1">Assignment Information</p>
                        <p className="text-blue-700 text-sm">
                          The selected driver will receive a notification on their mobile app with trip details.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requiresDoctor}
                        onChange={(e) => setFormData({ ...formData, requiresDoctor: e.target.checked })}
                        className="w-5 h-5 text-red-600"
                      />
                      <div>
                        <p className="text-foreground">Doctor Required on Ambulance</p>
                        <p className="text-muted-foreground text-sm">For critical cases requiring immediate medical intervention</p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requiresVentilator}
                        onChange={(e) => setFormData({ ...formData, requiresVentilator: e.target.checked })}
                        className="w-5 h-5 text-red-600"
                      />
                      <div>
                        <p className="text-foreground">Ventilator Support Required</p>
                        <p className="text-muted-foreground text-sm">Patient requires mechanical ventilation during transfer</p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requiresOxygen}
                        onChange={(e) => setFormData({ ...formData, requiresOxygen: e.target.checked })}
                        className="w-5 h-5 text-red-600"
                      />
                      <div>
                        <p className="text-foreground">Oxygen Support Required</p>
                        <p className="text-muted-foreground text-sm">Patient requires supplemental oxygen</p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <h4 className="text-purple-900 mb-2">Gender-Based Attendant Assignment</h4>
                    <p className="text-purple-700 text-sm mb-3">
                      Based on patient gender: <strong>{formData.patientGender}</strong>
                    </p>
                    <p className="text-purple-700 text-sm">
                      ✓ System will automatically assign a {formData.patientGender === 'Female' ? 'female' : 'male'} attendant according to hospital protocol
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h3 className="text-foreground mb-4">Transfer Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Patient</p>
                    <p className="text-foreground">{formData.patientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <p className="text-foreground capitalize">{formData.priority}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">From</p>
                    <p className="text-foreground">{formData.fromHospital}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">To</p>
                    <p className="text-foreground">{formData.toHospital}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('transfer')}
                  className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDriverId || availableDrivers.length === 0}
                  className={`flex-1 py-3 rounded-lg transition-colors ${isSubmitting || !selectedDriverId || availableDrivers.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                >
                  {isSubmitting ? 'Sending Request...' : 'Submit Transfer Request'}
                </button>
              </div>
            </div>
          )
        }
      </form >
    </div >
  );
}

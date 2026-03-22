import { useState, useEffect, useRef } from 'react';
import { User, MapPin, AlertCircle, Users, Truck, CheckCircle2, AlertTriangle, XCircle, Info, Building2, Paperclip, File, Star } from 'lucide-react';
import { database } from '../firebase';
import { ref, push, set } from 'firebase/database';
import { AmbulanceMap } from '../components/dashboard/AmbulanceMap';
import { useDriverLocations } from '../useDriverLocations';
import { useFleetData } from '../hooks/useFleetData';
import { encryptData, decryptData, decryptObject } from '../utils/encryption';
import { onValue, off } from 'firebase/database';
import { apiPost, apiFetch } from '../api/apiClient';
import Autocomplete from 'react-google-autocomplete';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries = ['places'] as any;

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
}


// Compute the next patient ID based on the highest existing numeric suffix
function getNextPatientId(records: PatientRecord[]): string {
  const maxNum = records.reduce((max, p) => {
    const match = p.id.match(/PT-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 20250);
  return `PT-${maxNum + 1}`;
}

export function TransferRequest() {
  const [step, setStep] = useState<'patient' | 'transfer' | 'ambulance'>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedDocumentIndices, setSelectedDocumentIndices] = useState<number[]>([]);
  const [toHospitalDetails, setToHospitalDetails] = useState<{
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  } | null>(null);
  const [isDestinationRegistered, setIsDestinationRegistered] = useState<boolean | null>(null);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [hospitalResources, setHospitalResources] = useState<any[]>([]);

  // Fleet data from Firebase (ambulances + drivers)
  const { ambulances, drivers, hospitalName, hospitalId } = useFleetData();
  const { onlineDrivers, busyDrivers } = useDriverLocations();

  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);

  // Fetch real patient records
  useEffect(() => {
    if (!hospitalId) return;

    const recordsRef = ref(database, `hospitals/${hospitalId}/patient_records`);
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const decryptedRecords: PatientRecord[] = Object.entries(data).map(([key, value]) => {
        const decrypted = decryptObject(value as any);
        return {
          id: decrypted.id || key,
          name: decrypted.name || 'Unknown',
          age: Number(decrypted.age) || 0,
          gender: decrypted.gender || 'Unknown',
          bloodGroup: decrypted.bloodGroup || '',
          allergies: decrypted.allergies || '',
          medicalHistory: decrypted.medicalHistory || '',
        };
      });
      setPatientRecords(decryptedRecords);
    });

    return () => off(recordsRef, 'value', unsubscribe);
  }, [hospitalId]);

  // Ambulances that are available AND not assigned to any driver AND have no active transfer
  const assignedAmbulanceIds = new Set(
    drivers.map(d => d.assignedAmbulance).filter(Boolean) as string[]
  );
  const availableAmbulances = ambulances.filter(
    a => a.status === 'available' && !assignedAmbulanceIds.has(a.id) && !a.currentTransfer
  );

  // ─── ACTIVE DRIVERS ───
  // Only show drivers that are:
  //   1. Registered in THIS hospital's Firebase registry (from useFleetData)
  //   2. Currently ONLINE in the SSE live stream (matching by driver ID or name)
  //   3. NOT currently marked as busy
  const activeDrivers = drivers.filter(d => {
    const isLiveOnline = onlineDrivers.some(od =>
      od.id === d.id || od.driverName.toLowerCase().trim() === d.name.toLowerCase().trim()
    );
    const isLiveBusy = busyDrivers.some(bd =>
      bd.id === d.id || bd.driverName.toLowerCase().trim() === d.name.toLowerCase().trim()
    );
    return isLiveOnline && !isLiveBusy;
  });

  // Autocomplete state for patient name
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<PatientRecord[]>([]);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync hospital name to form when it loads
  useEffect(() => {
    if (hospitalName) {
      setFormData(prev => ({ ...prev, fromHospital: `${hospitalName} (Auto-detected)` }));
    }
  }, [hospitalName]);

  const [formData, setFormData] = useState({
    // Patient Info
    patientName: '',
    patientAge: '0',
    patientGender: '',
    patientId: '',
    bloodGroup: '',
    allergies: '',

    // Transfer Info
    fromHospital: 'Loading... (Auto-detected)',
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
    if (!formData.toHospital || !toHospitalDetails) {
      errors.toHospital = 'Destination hospital is required. Please select from suggestions.';
    } else if (isDestinationRegistered === false) {
      errors.toHospital = 'The selected hospital is not registered with MediGo. Please select a registered facility.';
    } else if (checkingRegistration) {
      errors.toHospital = 'Verifying hospital registration. Please wait...';
    }

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

    const errors: Record<string, string> = {};
    if (!selectedAmbulanceId) errors.selectedAmbulanceId = 'Please select an ambulance for this transfer.';
    if (!selectedDriverId) errors.selectedDriverId = 'Please select a driver for this transfer.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    setIsSubmitting(true);

    try {
      const toCoords = toHospitalDetails || { lat: 0, lng: 0, address: '', placeId: '' };

      const payload = {
        driverId: selectedDriverId,
        driverName: activeDrivers.find(d => d.id === selectedDriverId)?.name || '',
        ambulanceId: selectedAmbulanceId,
        ambulance: selectedAmbulanceId,
        priority: formData.priority,

        patient: {
          name: encryptData(formData.patientName),
          age: encryptData(formData.patientAge),
          gender: encryptData(formData.patientGender),
          id: formData.patientId, // ID remains unencrypted as it might be used for referencing
          bloodGroup: encryptData(formData.bloodGroup),
          allergies: encryptData(formData.allergies),
          medicalHistory: encryptData(formData.medicalHistory),
          currentCondition: encryptData(formData.currentCondition),
        },

        destination: {
          hospitalName: formData.toHospital,
          address: toCoords.address,
          lat: toCoords.lat,
          lng: toCoords.lng,
          placeId: toCoords.placeId,
        },

        requirements: {
          requiresDoctor: formData.requiresDoctor,
          requiresVentilator: formData.requiresVentilator,
          requiresOxygen: formData.requiresOxygen,
          equipment: formData.requiredEquipment,
        },

        attachedDocuments: (() => {
          const stored = localStorage.getItem('patientFiles');
          const allFiles: Record<string, { name: string; size: number; type: string }[]> = stored ? JSON.parse(stored) : {};
          const patientFiles = allFiles[formData.patientId] || [];
          return selectedDocumentIndices.map(i => ({
            name: patientFiles[i]?.name || '',
            type: patientFiles[i]?.type || '',
            size: patientFiles[i]?.size || 0,
          })).filter(d => d.name);
        })(),

        reason: formData.reason,
      };

      await apiPost('/transfers', payload);

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
        fromHospital: hospitalName ? `${hospitalName} (Auto-detected)` : 'Loading... (Auto-detected)',
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
      setSelectedAmbulanceId('');
      setSelectedDocumentIndices([]);
      setToHospitalDetails(null);

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
                {/* Patient Name with Autocomplete */}
                <div ref={autocompleteRef} className="relative">
                  <label className="block text-foreground mb-2">Patient Name *</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={formData.patientName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, patientName: val });
                      if (formErrors.patientName) setFormErrors({ ...formErrors, patientName: '' });
                      if (val.trim().length > 0) {
                        const matches = patientRecords.filter(p =>
                          p.name.toLowerCase().includes(val.toLowerCase()) ||
                          p.id.toLowerCase().includes(val.toLowerCase())
                        );
                        setNameSuggestions(matches);
                        setShowSuggestions(matches.length > 0);
                        // New (unregistered) patient – suggest next ID
                        if (matches.length === 0) {
                          const nextId = getNextPatientId(patientRecords);
                          setFormData(prev => ({ ...prev, patientName: val, patientId: nextId }));
                          setIsNewPatient(true);
                        } else {
                          setIsNewPatient(false);
                        }
                      } else {
                        setShowSuggestions(false);
                        setIsNewPatient(false);
                      }
                    }}
                    onFocus={() => {
                      if (formData.patientName.trim().length > 0 && nameSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground ${formErrors.patientName ? 'border-red-500 ring-1 ring-red-500' : 'border-input'
                      }`}
                    placeholder="Start typing a patient name..."
                  />
                  {formErrors.patientName && <p className="text-red-500 text-xs mt-1">{formErrors.patientName}</p>}

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      {nameSuggestions.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({
                              ...prev,
                              patientName: patient.name,
                              patientAge: String(patient.age),
                              patientId: patient.id,
                              bloodGroup: patient.bloodGroup || prev.bloodGroup,
                              allergies: patient.allergies || prev.allergies,
                              medicalHistory: patient.medicalHistory || prev.medicalHistory,
                              patientGender: patient.gender || prev.patientGender,
                              attendantGender: patient.gender || prev.attendantGender,
                            }));
                            setFormErrors(prev => ({ ...prev, patientName: '', patientId: '', patientAge: '' }));
                            setIsNewPatient(false);
                            setShowSuggestions(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b border-border last:border-b-0"
                        >
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center shrink-0">
                            <User size={15} className="text-red-600" />
                          </div>
                          <div>
                            <p className="text-foreground font-medium text-sm">{patient.name}</p>
                            <p className="text-muted-foreground text-xs">{patient.id} • {patient.age} yrs • {patient.gender}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-foreground">Patient ID *</label>
                    {isNewPatient && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium">
                        New Patient – ID suggested
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.patientId}
                    onChange={(e) => {
                      setFormData({ ...formData, patientId: e.target.value });
                      if (formErrors.patientId) setFormErrors({ ...formErrors, patientId: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground ${formErrors.patientId
                      ? 'border-red-500 ring-1 ring-red-500'
                      : isNewPatient
                        ? 'border-amber-400 ring-1 ring-amber-300'
                        : 'border-input'
                      }`}
                    placeholder="Hospital patient ID"
                  />
                  {isNewPatient && (
                    <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                      Auto-generated for new patient. Edit if needed.
                    </p>
                  )}
                  {formErrors.patientId && <p className="text-red-500 text-xs mt-1">{formErrors.patientId}</p>}
                </div>

                <div>
                  <label className="block text-foreground mb-2">Age *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    value={formData.patientAge}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (Number(val) < 0) return;
                      setFormData({ ...formData, patientAge: val });
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
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-foreground font-medium">To Hospital *</label>
                        {toHospitalDetails && isDestinationRegistered === true && (
                          <span className="text-[10px] uppercase tracking-wider bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-bold">
                            MediGo Partner Verified
                          </span>
                        )}
                        {toHospitalDetails && isDestinationRegistered === false && !checkingRegistration && (
                          <span className="text-[10px] uppercase tracking-wider bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-bold">
                            Unregistered Facility
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${toHospitalDetails ? 'text-green-500' : 'text-gray-400 group-focus-within:text-red-500'}`} size={20} />
                        {isLoaded ? (
                          <Autocomplete
                            onPlaceSelected={(place: any) => {
                              if (place && place.name && place.formatted_address && place.geometry) {
                                setFormData({ ...formData, toHospital: place.name });
                                setToHospitalDetails({
                                  address: place.formatted_address,
                                  lat: place.geometry.location.lat(),
                                  lng: place.geometry.location.lng(),
                                  placeId: place.place_id,
                                });
                                if (formErrors.toHospital) setFormErrors({ ...formErrors, toHospital: '' });

                                // Check registration and get real-time resources from BACKEND
                                setCheckingRegistration(true);
                                setIsDestinationRegistered(null);
                                setHospitalResources([]);
                                
                                apiFetch(`/hospitals/${place.place_id}/availability`)
                                  .then((data) => {
                                    if (data.registered) {
                                      setIsDestinationRegistered(true);
                                      setHospitalResources(data.resources || []);
                                    } else {
                                      setIsDestinationRegistered(false);
                                    }
                                  })
                                  .catch((err) => {
                                    console.error("Error fetching hospital info from backend:", err);
                                    setIsDestinationRegistered(false);
                                  })
                                  .finally(() => {
                                    setCheckingRegistration(false);
                                  });
                              }
                            }}
                            options={{
                              types: ['hospital'],
                              componentRestrictions: { country: 'lk' },
                              fields: ['name', 'formatted_address', 'geometry', 'place_id'],
                            }}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all bg-input-field-bg text-foreground ${formErrors.toHospital
                              ? 'border-red-500 ring-1 ring-red-500'
                              : toHospitalDetails
                                ? 'border-green-500 ring-1 ring-green-500/20'
                                : 'border-input hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            placeholder="Search destination hospital..."
                          />
                        ) : (
                          <input
                            disabled
                            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all bg-input-field-bg text-gray-500 border-input"
                            placeholder="Loading map data..."
                          />
                        )}
                      </div>
                      {toHospitalDetails && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                          <p className="text-xs text-green-700 dark:text-green-400 flex items-start gap-2">
                            <MapPin size={14} className="mt-0.5" />
                            <span>
                              <strong>{formData.toHospital}</strong><br />
                              {toHospitalDetails.address}
                            </span>
                          </p>
                        </div>
                      )}
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

                  {/* Optional Patient Document Attachment */}
                  {(() => {
                    const stored = localStorage.getItem('patientFiles');
                    const allFiles: Record<string, { name: string; size: number; type: string }[]> = stored ? JSON.parse(stored) : {};
                    const patientDocs = allFiles[formData.patientId] || [];
                    if (patientDocs.length === 0) return null;
                    return (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip size={16} className="text-blue-600" />
                          <label className="text-foreground font-medium text-sm">Attach Patient Records <span className="text-muted-foreground font-normal">(Optional)</span></label>
                        </div>
                        <p className="text-muted-foreground text-xs mb-3">Select documents from the patient's records to send to the receiving hospital.</p>
                        <div className="space-y-2">
                          {patientDocs.map((file, idx) => (
                            <label
                              key={idx}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedDocumentIndices.includes(idx)
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-border hover:bg-accent'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedDocumentIndices.includes(idx)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocumentIndices(prev => [...prev, idx]);
                                  } else {
                                    setSelectedDocumentIndices(prev => prev.filter(i => i !== idx));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 flex-shrink-0"
                              />
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <File size={15} className="text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-medium truncate">{file.name}</p>
                                <p className="text-muted-foreground text-xs">{(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown type'}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                        {selectedDocumentIndices.length > 0 && (
                          <p className="text-blue-600 text-xs mt-2 font-medium">
                            {selectedDocumentIndices.length} document{selectedDocumentIndices.length > 1 ? 's' : ''} selected to transfer
                          </p>
                        )}
                      </div>
                    );
                  })()}
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
                  ) : checkingRegistration ? (
                    <div className="flex flex-col items-center justify-center p-8 border border-border rounded-xl bg-accent/10 py-16">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-muted-foreground text-sm">Verifying hospital registration...</p>
                    </div>
                  ) : isDestinationRegistered === false ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-red-100 dark:border-red-900/30 rounded-xl text-center bg-red-50/50 dark:bg-red-900/10 py-12 animate-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-gray-800 shadow-sm">
                        <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
                      </div>
                      <h3 className="text-red-900 dark:text-red-300 font-bold text-lg mb-2">Not a MediGo Hospital</h3>
                      <p className="text-red-700 dark:text-red-400 text-sm max-w-[240px] leading-relaxed">
                        The selected hospital <strong>{formData.toHospital}</strong> is not registered on the MediGo platform.
                      </p>
                      <div className="mt-6 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900/50 text-left">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1">Notice</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Resources and real-time tracking are only available for registered facilities.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg mb-6 shadow-inner">
                        <p className="text-blue-900 dark:text-blue-300 text-sm font-medium opacity-80 mb-1">Viewing live data for:</p>
                        <p className="text-blue-700 dark:text-blue-400 font-bold text-lg">{formData.toHospital}</p>
                      </div>

                      {hospitalResources.length === 0 ? (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
                          <p className="text-yellow-800 dark:text-yellow-400 text-xs italic text-center">No resource availability data reported by this hospital yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 content-start">
                          {hospitalResources.map((resource) => (
                            <div key={resource.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                              <span className="text-foreground font-medium text-sm">{resource.name}</span>
                              <div className="flex items-center gap-2">
                                {resource.available ? (
                                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle2 size={16} /> Available
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <XCircle size={16} /> Full
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
                  {/* Unified Driver & Ambulance Selection */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl shrink-0">
                        <Users className="text-blue-600 dark:text-blue-400" size={24} />
                      </div>
                      <div className="w-full">
                        <p className="text-blue-900 dark:text-blue-300 mb-1 font-bold text-lg">Assign Mission Personnel</p>
                        <p className="text-blue-700 dark:text-blue-400 text-sm mb-4">
                          Select an active driver. The system will automatically link their assigned ambulance.
                        </p>

                        {activeDrivers.length === 0 ? (
                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <p className="text-orange-700 dark:text-orange-400 text-sm flex items-center gap-2">
                              <AlertTriangle size={16} /> No drivers currently active. Please check fleet status.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-blue-900 dark:text-blue-300 text-sm font-medium mb-2">Select Driver *</label>
                              <select
                                value={selectedDriverId}
                                onChange={(e) => {
                                  const drvId = e.target.value;
                                  setSelectedDriverId(drvId);
                                  if (formErrors.selectedDriverId) setFormErrors({ ...formErrors, selectedDriverId: '' });

                                  // Auto-link assigned ambulance using the registry list (correct IDs)
                                  const drvRecord = drivers.find(d => d.id === drvId);
                                  if (drvRecord?.assignedAmbulance) {
                                    setSelectedAmbulanceId(drvRecord.assignedAmbulance);
                                    if (formErrors.selectedAmbulanceId) setFormErrors({ ...formErrors, selectedAmbulanceId: '' });
                                  } else {
                                    setSelectedAmbulanceId('');
                                  }
                                }}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-blue-950/20 text-foreground shadow-sm ${formErrors.selectedDriverId ? 'border-red-500 ring-1 ring-red-500' : 'border-blue-200 dark:border-blue-800'
                                  }`}
                              >
                                <option value="">Choose a driver...</option>
                                {activeDrivers.map(driver => {
                                  const isLive = onlineDrivers.some(od =>
                                    od.id === driver.id ||
                                    od.driverName.toLowerCase().trim() === driver.name.toLowerCase().trim()
                                  );
                                  return (
                                    <option key={driver.id} value={driver.id}>
                                      {driver.name} {isLive ? '🟢 (LIVE ONLINE)' : '⚪ (OFFLINE)'} (Rating: {driver.rating})
                                    </option>
                                  );
                                })}
                              </select>
                              {formErrors.selectedDriverId && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.selectedDriverId}</p>
                              )}
                            </div>

                            {selectedDriverId && (() => {
                              const drv = drivers.find(d => d.id === selectedDriverId);
                              const amb = ambulances.find(a => a.id === (drv?.assignedAmbulance || selectedAmbulanceId));
                              if (!drv) return null;

                              return (
                                <div className="mt-4 p-4 bg-white dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                                  {/* Manual Ambulance Selection Fallback */}
                                  {!drv.assignedAmbulance && (
                                    <div className="mb-4">
                                      <label className="block text-blue-900 dark:text-blue-300 text-sm font-medium mb-2">Select Ambulance *</label>
                                      <select
                                        value={selectedAmbulanceId}
                                        onChange={(e) => {
                                          setSelectedAmbulanceId(e.target.value);
                                          if (formErrors.selectedAmbulanceId) setFormErrors({ ...formErrors, selectedAmbulanceId: '' });
                                        }}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-blue-950/20 text-foreground shadow-sm ${formErrors.selectedAmbulanceId ? 'border-red-500 ring-1 ring-red-500' : 'border-blue-200 dark:border-blue-800'}`}
                                      >
                                        <option value="">Choose an ambulance...</option>
                                        {availableAmbulances.map(a => (
                                          <option key={a.id} value={a.id}>Unit: {a.id}</option>
                                        ))}
                                      </select>
                                      {formErrors.selectedAmbulanceId && (
                                        <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.selectedAmbulanceId}</p>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between mb-3 border-b border-blue-100 dark:border-blue-900/50 pb-2">
                                    <div className="flex items-center gap-2">
                                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                      <span className="text-blue-900 dark:text-blue-100 font-bold">{drv.name}</span>
                                    </div>
                                    <span className="text-blue-600 dark:text-blue-400 text-xs font-medium uppercase tracking-wider">{drv.id}</span>
                                  </div>

                                  {amb ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                                        <Truck size={18} className="text-blue-500" />
                                        <div>
                                          <p className="text-sm font-semibold">Assigned: {amb.id}</p>
                                          <p className="text-[10px] opacity-70">Located at: {amb.location}</p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {amb.hasVentilator && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-bold">VENTILATOR</span>}
                                        {amb.hasDoctor && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-md text-[10px] font-bold">DOCTOR ON BOARD</span>}
                                        {(amb.equipment || []).slice(0, 2).map((e: string) => (
                                          <span key={e} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] uppercase font-bold">{e}</span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs bg-orange-50 dark:bg-orange-950/30 p-2 rounded-lg">
                                      <AlertCircle size={14} />
                                      <span>Warning: This driver has no assigned ambulance.</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        <p className="text-blue-600 dark:text-blue-400 text-[10px] mt-4 italic font-medium">
                          Note: Trip manifest will be dispatched immediately upon submission.
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
                  disabled={isSubmitting || !selectedDriverId || !selectedAmbulanceId}
                  className={`flex-1 py-3 rounded-lg transition-colors ${isSubmitting || !selectedDriverId || !selectedAmbulanceId
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

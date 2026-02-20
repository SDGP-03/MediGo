import { useState, useEffect } from 'react';
import { User, MapPin, AlertCircle, FileText, Users, Clock, Truck } from 'lucide-react';
import { database } from '../firebase';
import { ref, push, set, onValue, off } from 'firebase/database';

// Hospital coordinates mapping (you can expand this or fetch from Firestore)
const hospitalCoordinates: Record<string, { lat: number; lng: number; address: string }> = {
  'City General Hospital': { lat: 6.9271, lng: 79.8612, address: 'Colombo 07, Sri Lanka' },
  'Central Medical Center': { lat: 6.9344, lng: 79.8428, address: 'Union Place, Colombo' },
  'Specialist Care Hospital': { lat: 6.9167, lng: 79.8778, address: 'Narahenpita, Colombo' },
  'Regional Base Hospital': { lat: 6.9147, lng: 79.9727, address: 'Homagama' },
  'Teaching Hospital East': { lat: 6.9108, lng: 79.8541, address: 'Wellawatte, Colombo' },
  'Metro Hospital': { lat: 6.8867, lng: 79.8593, address: 'Dehiwala' },
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

  const [formData, setFormData] = useState({
    // Patient Info
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientId: '',
    bloodGroup: '',
    allergies: '',

    // Transfer Info
    fromHospital: 'City General Hospital',
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
    'Central Medical Center',
    'Specialist Care Hospital',
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
    if (!formData.patientName || !formData.patientId || !formData.patientAge || !formData.patientGender) {
      alert('Please fill in all mandatory patient information fields.');
      return false;
    }
    return true;
  };

  const validateTransferStep = () => {
    if (!formData.toHospital || !formData.priority || !formData.reason) {
      alert('Please fill in all mandatory transfer details fields.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDriverId) {
      alert('Please select a driver to assign this transfer request.');
      return;
    }

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

      alert('Transfer request sent to driver! They will receive a notification shortly.');

      // Reset form
      setStep('patient');
      setFormData({
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientId: '',
        bloodGroup: '',
        allergies: '',
        fromHospital: 'City General Hospital',
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
    } catch (error) {
      console.error('Error submitting transfer request:', error);
      alert('Failed to submit transfer request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-foreground mb-2">Patient ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                    placeholder="Hospital patient ID"
                  />
                </div>

                <div>
                  <label className="block text-foreground mb-2">Age *</label>
                  <input
                    type="number"
                    required
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                    placeholder="Age in years"
                  />
                </div>

                <div>
                  <label className="block text-foreground mb-2">Gender *</label>
                  <select
                    required
                    value={formData.patientGender}
                    onChange={(e) => setFormData({ ...formData, patientGender: e.target.value, attendantGender: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
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
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-foreground mb-6 flex items-center gap-2">
                <MapPin size={24} className="text-red-600" />
                Transfer Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    onChange={(e) => setFormData({ ...formData, toHospital: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
                  >
                    <option value="">Select destination hospital</option>
                    {hospitals.map(hospital => (
                      <option key={hospital} value={hospital}>{hospital}</option>
                    ))}
                  </select>
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
                      <span className="text-foreground">Critical</span>
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
                      <span className="text-foreground">Urgent</span>
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
                      <span className="text-foreground">Standard</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-foreground mb-2">Reason for Transfer *</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[100px] bg-input-field-bg text-foreground"
                  placeholder="Detailed reason for inter-hospital transfer..."
                />
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
        {step === 'ambulance' && (
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
                        <select
                          required
                          value={selectedDriverId}
                          onChange={(e) => setSelectedDriverId(e.target.value)}
                          className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-input-field-bg text-foreground"
                        >
                          <option value="">Select a driver...</option>
                          {availableDrivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.driverName} (ID: {driver.id.substring(0, 8)}...)
                            </option>
                          ))}
                        </select>
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
        )}
      </form>
    </div>
  );
}

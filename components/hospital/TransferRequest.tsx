import { useState } from 'react';
import { User, MapPin, AlertCircle, FileText, Users, Clock } from 'lucide-react';

export function TransferRequest() {
  const [step, setStep] = useState<'patient' | 'transfer' | 'ambulance'>('patient');
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
    requiredEquipment: [],
    
    // Ambulance Requirements
    requiresDoctor: false,
    requiresVentilator: false,
    requiresOxygen: true,
    attendantGender: '',
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit transfer request
    alert('Transfer request submitted successfully! Ambulance will be assigned automatically based on availability and gender requirements.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${step === 'patient' ? 'text-red-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step === 'patient' ? 'bg-red-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span>Patient Information</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <div className={`flex items-center gap-3 ${step === 'transfer' ? 'text-red-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step === 'transfer' ? 'bg-red-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span>Transfer Details</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <div className={`flex items-center gap-3 ${step === 'ambulance' ? 'text-red-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step === 'ambulance' ? 'bg-red-600 text-white' : 'bg-gray-200'
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-gray-900 mb-6 flex items-center gap-2">
                <User size={24} className="text-red-600" />
                Patient Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Patient ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Hospital patient ID"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Age *</label>
                  <input
                    type="number"
                    required
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Age in years"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Gender *</label>
                  <select
                    required
                    value={formData.patientGender}
                    onChange={(e) => setFormData({ ...formData, patientGender: e.target.value, attendantGender: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
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
                  <label className="block text-gray-700 mb-2">Known Allergies</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="e.g., Penicillin, Latex"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 mb-2">Medical History</label>
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[100px]"
                  placeholder="Brief medical history and relevant conditions..."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('transfer')}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Continue to Transfer Details
            </button>
          </div>
        )}

        {/* Step 2: Transfer Details */}
        {step === 'transfer' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-gray-900 mb-6 flex items-center gap-2">
                <MapPin size={24} className="text-red-600" />
                Transfer Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 mb-2">From Hospital</label>
                  <input
                    type="text"
                    disabled
                    value={formData.fromHospital}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">To Hospital *</label>
                  <select
                    required
                    value={formData.toHospital}
                    onChange={(e) => setFormData({ ...formData, toHospital: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Select destination hospital</option>
                    {hospitals.map(hospital => (
                      <option key={hospital} value={hospital}>{hospital}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Priority Level *</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'critical' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.priority === 'critical'
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-600"></div>
                      <span className="text-gray-900">Critical</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.priority === 'urgent'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                      <span className="text-gray-900">Urgent</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: 'standard' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.priority === 'standard'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-600"></div>
                      <span className="text-gray-900">Standard</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Reason for Transfer *</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[100px]"
                  placeholder="Detailed reason for inter-hospital transfer..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Current Condition & Vital Signs</label>
                <textarea
                  value={formData.currentCondition}
                  onChange={(e) => setFormData({ ...formData, currentCondition: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[80px]"
                  placeholder="BP, Heart Rate, Oxygen Saturation, Temperature, etc."
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Required Equipment</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {equipment.map(item => (
                    <label key={item} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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
                      <span className="text-gray-700 text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('patient')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('ambulance')}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-gray-900 mb-6 flex items-center gap-2">
                <Users size={24} className="text-red-600" />
                Ambulance & Staff Requirements
              </h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-blue-900 mb-1">Auto-Assignment Information</p>
                      <p className="text-blue-700 text-sm">
                        The system will automatically assign an available ambulance based on proximity, equipment availability, and gender requirements for attendants.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresDoctor}
                      onChange={(e) => setFormData({ ...formData, requiresDoctor: e.target.checked })}
                      className="w-5 h-5 text-red-600"
                    />
                    <div>
                      <p className="text-gray-900">Doctor Required on Ambulance</p>
                      <p className="text-gray-600 text-sm">For critical cases requiring immediate medical intervention</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresVentilator}
                      onChange={(e) => setFormData({ ...formData, requiresVentilator: e.target.checked })}
                      className="w-5 h-5 text-red-600"
                    />
                    <div>
                      <p className="text-gray-900">Ventilator Support Required</p>
                      <p className="text-gray-600 text-sm">Patient requires mechanical ventilation during transfer</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresOxygen}
                      onChange={(e) => setFormData({ ...formData, requiresOxygen: e.target.checked })}
                      className="w-5 h-5 text-red-600"
                    />
                    <div>
                      <p className="text-gray-900">Oxygen Support Required</p>
                      <p className="text-gray-600 text-sm">Patient requires supplemental oxygen</p>
                    </div>
                  </label>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-4">Transfer Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Patient</p>
                  <p className="text-gray-900">{formData.patientName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Priority</p>
                  <p className="text-gray-900 capitalize">{formData.priority}</p>
                </div>
                <div>
                  <p className="text-gray-600">From</p>
                  <p className="text-gray-900">{formData.fromHospital}</p>
                </div>
                <div>
                  <p className="text-gray-600">To</p>
                  <p className="text-gray-900">{formData.toHospital}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('transfer')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Submit Transfer Request
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

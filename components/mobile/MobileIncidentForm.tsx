import { useState } from 'react';
import { X, AlertCircle, User, Phone, FileText } from 'lucide-react';

interface MobileIncidentFormProps {
  ambulance: any;
  serviceType: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const incidentTypes = [
  { id: 'cardiac', label: 'Cardiac Emergency' },
  { id: 'respiratory', label: 'Respiratory Distress' },
  { id: 'trauma', label: 'Trauma/Accident' },
  { id: 'stroke', label: 'Stroke' },
  { id: 'seizure', label: 'Seizure' },
  { id: 'bleeding', label: 'Severe Bleeding' },
  { id: 'burn', label: 'Burn Injury' },
  { id: 'poisoning', label: 'Poisoning' },
  { id: 'allergic', label: 'Allergic Reaction' },
  { id: 'diabetic', label: 'Diabetic Emergency' },
  { id: 'pregnancy', label: 'Pregnancy Complication' },
  { id: 'other', label: 'Other' },
];

export function MobileIncidentForm({ ambulance, serviceType, onSubmit, onBack }: MobileIncidentFormProps) {
  const [formData, setFormData] = useState({
    incidentType: '',
    patientName: '',
    patientAge: '',
    patientGender: '',
    contactNumber: '',
    description: '',
    symptoms: '',
    consciousness: 'conscious',
    breathing: 'normal',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
        <div className="flex-1">
          <h3 className="text-gray-900">Incident Report</h3>
          <p className="text-gray-600 text-sm">{ambulance.name}</p>
        </div>
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Incident Type */}
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <label className="flex items-center gap-2 text-gray-900 mb-3">
            <AlertCircle size={18} className="text-red-600" />
            Incident Type *
          </label>
          <select
            required
            value={formData.incidentType}
            onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600 text-gray-900"
          >
            <option value="">Select incident type</option>
            {incidentTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Patient Information */}
        <div className="bg-white rounded-2xl p-4 shadow-md space-y-4">
          <h4 className="flex items-center gap-2 text-gray-900">
            <User size={18} className="text-red-600" />
            Patient Information
          </h4>
          
          <div>
            <label className="block text-gray-700 mb-2 text-sm">Patient Name *</label>
            <input
              type="text"
              required
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600"
              placeholder="Full name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Age *</label>
              <input
                type="number"
                required
                value={formData.patientAge}
                onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600"
                placeholder="Age"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Gender *</label>
              <select
                required
                value={formData.patientGender}
                onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-1 text-gray-700 mb-2 text-sm">
              <Phone size={16} />
              Contact Number *
            </label>
            <input
              type="tel"
              required
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>

        {/* Current Condition */}
        <div className="bg-white rounded-2xl p-4 shadow-md space-y-4">
          <h4 className="text-gray-900">Current Condition</h4>
          
          <div>
            <label className="block text-gray-700 mb-2 text-sm">Consciousness</label>
            <select
              value={formData.consciousness}
              onChange={(e) => setFormData({ ...formData, consciousness: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600"
            >
              <option value="conscious">Conscious</option>
              <option value="drowsy">Drowsy</option>
              <option value="unconscious">Unconscious</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2 text-sm">Breathing</label>
            <select
              value={formData.breathing}
              onChange={(e) => setFormData({ ...formData, breathing: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600"
            >
              <option value="normal">Normal</option>
              <option value="difficulty">Difficulty</option>
              <option value="not_breathing">Not Breathing</option>
            </select>
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <label className="block text-gray-900 mb-2">Symptoms</label>
          <textarea
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600 min-h-[80px]"
            placeholder="Describe symptoms..."
          />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <label className="flex items-center gap-2 text-gray-900 mb-2">
            <FileText size={18} className="text-red-600" />
            Incident Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-600 min-h-[100px]"
            placeholder="Provide detailed description of the incident..."
          />
        </div>

        {/* First Aid Note */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
          <p className="text-yellow-800 mb-2">⚠️ While you wait:</p>
          <ul className="space-y-1 text-yellow-700 text-sm">
            <li>• Keep patient calm and comfortable</li>
            <li>• Don't move unless necessary</li>
            <li>• Monitor breathing</li>
            <li>• Prepare medical documents</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 -mx-4 space-y-3">
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            Submit & Request Ambulance
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl active:scale-95 transition-transform"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}

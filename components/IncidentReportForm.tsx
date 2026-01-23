import { useState } from 'react';
import { X, AlertCircle, User, Phone, FileText } from 'lucide-react';

interface IncidentReportFormProps {
  ambulance: any;
  serviceType: string;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

const incidentTypes = [
  { id: 'cardiac', label: 'Cardiac Emergency', priority: 'critical' },
  { id: 'respiratory', label: 'Respiratory Distress', priority: 'critical' },
  { id: 'trauma', label: 'Trauma/Accident', priority: 'urgent' },
  { id: 'stroke', label: 'Stroke', priority: 'critical' },
  { id: 'seizure', label: 'Seizure', priority: 'urgent' },
  { id: 'bleeding', label: 'Severe Bleeding', priority: 'urgent' },
  { id: 'burn', label: 'Burn Injury', priority: 'urgent' },
  { id: 'poisoning', label: 'Poisoning', priority: 'urgent' },
  { id: 'allergic', label: 'Allergic Reaction', priority: 'urgent' },
  { id: 'diabetic', label: 'Diabetic Emergency', priority: 'urgent' },
  { id: 'pregnancy', label: 'Pregnancy Complication', priority: 'critical' },
  { id: 'other', label: 'Other', priority: 'standard' },
];

export function IncidentReportForm({ ambulance, serviceType, onSubmit, onClose }: IncidentReportFormProps) {
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
    bleeding: 'none',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900">Incident Report</h2>
            <p className="text-gray-600">Ambulance: {ambulance.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Incident Type */}
          <div>
            <label className="block text-gray-900 mb-2">
              <AlertCircle className="inline mr-2" size={18} />
              Incident Type *
            </label>
            <select
              required
              value={formData.incidentType}
              onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">Select incident type</option>
              {incidentTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label} ({type.priority})
                </option>
              ))}
            </select>
          </div>

          {/* Patient Information */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-gray-900">
              <User className="inline mr-2" size={18} />
              Patient Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Full name"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Age *</label>
                <input
                  type="number"
                  required
                  value={formData.patientAge}
                  onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Age"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Gender *</label>
                <select
                  required
                  value={formData.patientGender}
                  onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  <Phone className="inline mr-1" size={16} />
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Medical Condition */}
          <div className="space-y-4">
            <h3 className="text-gray-900">Current Condition</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Consciousness</label>
                <select
                  value={formData.consciousness}
                  onChange={(e) => setFormData({ ...formData, consciousness: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="conscious">Conscious</option>
                  <option value="drowsy">Drowsy</option>
                  <option value="unconscious">Unconscious</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Breathing</label>
                <select
                  value={formData.breathing}
                  onChange={(e) => setFormData({ ...formData, breathing: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="normal">Normal</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="not_breathing">Not Breathing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Bleeding</label>
                <select
                  value={formData.bleeding}
                  onChange={(e) => setFormData({ ...formData, bleeding: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="none">None</option>
                  <option value="minor">Minor</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-gray-900 mb-2">Symptoms</label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[80px]"
              placeholder="Describe symptoms (e.g., chest pain, difficulty breathing, etc.)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-900 mb-2">
              <FileText className="inline mr-2" size={18} />
              Incident Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[100px]"
              placeholder="Provide detailed description of the incident..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Submit & Request Ambulance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { FileText, Search, User, Calendar, AlertCircle, Upload, Download, File, Ambulance } from 'lucide-react';

interface PatientRecordsProps {
  onNavigate?: (view: any) => void;
}

export function PatientRecords({ onNavigate }: PatientRecordsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: any[] }>(() => {
    const stored = localStorage.getItem('patientFiles');
    return stored ? JSON.parse(stored) : {};
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newMedication, setNewMedication] = useState('');
  const [newTransfer, setNewTransfer] = useState({
    date: '',
    from: '',
    to: '',
    reason: '',
    status: 'In Progress'
  });
  const patients = [
    {
      id: 'PT-20251',
      name: 'Sarah Johnson',
      age: 45,
      gender: 'Female',
      bloodGroup: 'A+',
      allergies: 'Penicillin',
      medicalHistory: 'Hypertension, Diabetes Type 2',
      recentTransfers: [
        {
          date: '2025-11-20',
          from: 'City General Hospital',
          to: 'Central Medical Center',
          reason: 'Cardiac Emergency',
          status: 'Completed',
        },
      ],
      vitalSigns: {
        bp: '140/90',
        heartRate: '82',
        temperature: '98.6°F',
        oxygen: '96%',
      },
      medications: ['Metformin 500mg', 'Lisinopril 10mg', 'Aspirin 81mg'],
    },
    {
      id: 'PT-20252',
      name: 'David Miller',
      age: 62,
      gender: 'Male',
      bloodGroup: 'O+',
      allergies: 'None',
      medicalHistory: 'Coronary Artery Disease, Previous MI',
      recentTransfers: [
        {
          date: '2025-11-21',
          from: 'Divisional Hospital North',
          to: 'City General Hospital',
          reason: 'Chest Pain',
          status: 'In Progress',
        },
      ],
      vitalSigns: {
        bp: '155/95',
        heartRate: '95',
        temperature: '98.4°F',
        oxygen: '94%',
      },
      medications: ['Atorvastatin 40mg', 'Clopidogrel 75mg', 'Metoprolol 50mg'],
    },
    {
      id: 'PT-20253',
      name: 'Emma Davis',
      age: 28,
      gender: 'Female',
      bloodGroup: 'B+',
      allergies: 'Latex, Shellfish',
      medicalHistory: 'Asthma, Seasonal Allergies',
      recentTransfers: [],
      vitalSigns: {
        bp: '118/75',
        heartRate: '72',
        temperature: '98.2°F',
        oxygen: '98%',
      },
      medications: ['Albuterol Inhaler', 'Fluticasone Nasal Spray'],
    },
  ];

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // File upload handler with localStorage persistence
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, patientId: string) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true); // Start loading state
      const newFiles = Array.from(files);

      // File size validation (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      const oversizedFiles = newFiles.filter(file => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        alert(`Some files are too large (max 5MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
        setIsUploading(false); // Stop loading
        return;
      }

      // Convert files to base64 for storage
      const filePromises = newFiles.map(file => {
        return new Promise<{ name: string, size: number, type: string, data: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              data: e.target?.result as string
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(fileData => {
        // Get existing files from localStorage
        const stored = localStorage.getItem('patientFiles');
        const existingFiles = stored ? JSON.parse(stored) : {};

        // Add new files to existing files for this patient
        const updatedFiles = {
          ...existingFiles,
          [patientId]: [...(existingFiles[patientId] || []), ...fileData]
        };

        // Save to localStorage (persistent storage)
        localStorage.setItem('patientFiles', JSON.stringify(updatedFiles));

        // Update React state (for immediate UI update)
        setUploadedFiles(prev => ({
          ...prev,
          [patientId]: [...(prev[patientId] || []), ...fileData.map(fd => ({
            name: fd.name,
            size: fd.size,
            type: fd.type,
            data: fd.data
          } as any))]
        }));

        setIsUploading(false); // Stop loading state
      });
    }
  };
  // File removal handler
  const handleFileRemove = (patientId: string, fileIndex: number) => {
    setUploadedFiles(prev => {
      const updatedFiles = {
        ...prev,
        [patientId]: prev[patientId].filter((_, index) => index !== fileIndex)
      };
      localStorage.setItem('patientFiles', JSON.stringify(updatedFiles));
      return updatedFiles;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-gray-900 mb-4">Centralized Patient Records</h2>
        <p className="text-gray-600 mb-4">
          Search by name or ID to view complete medical histories, vital signs, and transfer records across all facilities.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className={`lg:col-span-1 ${!selectedPatient ? 'lg:col-span-3' : ''} transition-all duration-300`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900">Patient List</h3>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
                </span>
              </div>
            </div>
            <div className={`divide-y divide-gray-200 overflow-y-auto ${selectedPatient ? 'max-h-[600px]' : ''}`}>
              {filteredPatients.length > 0 ? (
                <div className={`${!selectedPatient ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4' : ''}`}>
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border rounded-lg ${selectedPatient?.id === patient.id
                        ? 'bg-red-50 border-red-200'
                        : 'border-transparent hover:border-gray-200'
                        } ${!selectedPatient ? 'border-gray-200' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="text-red-600" size={20} />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{patient.name}</p>
                          <p className="text-gray-600 text-sm">{patient.id}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">
                        {patient.age} yrs • {patient.gender} • {patient.bloodGroup}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
                  <p className="text-gray-900 font-medium mb-1">No matches found</p>
                  <p className="text-gray-600 text-sm">
                    {searchTerm ? `No patients match "${searchTerm}"` : 'No patients available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Details */}
        {selectedPatient && (
          <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Patient Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600 lg:hidden"
                  >
                    <span className="sr-only">Back to list</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-gray-900 mb-1 font-bold text-xl">{selectedPatient.name}</h2>
                      <button
                        onClick={() => setSelectedPatient(null)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline hidden lg:block"
                      >
                        Back to List
                      </button>
                    </div>
                    <p className="text-gray-600">{selectedPatient.id}</p>
                  </div>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditedPatient({ ...selectedPatient });
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Edit Record
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Save changes
                        setSelectedPatient(editedPatient);
                        setIsEditing(false);
                        alert('Changes saved! (In production, this would update the database)');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedPatient(null);
                      }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-6 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-gray-600 mb-1">Age</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedPatient.age}
                      onChange={(e) => setEditedPatient({ ...editedPatient, age: parseInt(e.target.value) })}
                      className="text-gray-900 border border-gray-300 rounded px-2 py-1 w-20 focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{selectedPatient.age} years</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Gender</p>
                  {isEditing ? (
                    <select
                      value={editedPatient.gender}
                      onChange={(e) => setEditedPatient({ ...editedPatient, gender: e.target.value })}
                      className="text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 font-medium">{selectedPatient.gender}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Blood Group</p>
                  {isEditing ? (
                    <select
                      value={editedPatient.bloodGroup}
                      onChange={(e) => setEditedPatient({ ...editedPatient, bloodGroup: e.target.value })}
                      className="text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                      <option>O+</option>
                      <option>O-</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 font-medium">{selectedPatient.bloodGroup}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Allergies</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedPatient.allergies}
                      onChange={(e) => setEditedPatient({ ...editedPatient, allergies: e.target.value })}
                      className="text-red-600 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  ) : (
                    <p className="text-red-600 font-medium">{selectedPatient.allergies}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-4 font-semibold">Current Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-600 text-sm mb-1 font-medium">Blood Pressure</p>
                  <p className="text-gray-900 text-lg font-bold">{selectedPatient.vitalSigns.bp}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-green-600 text-sm mb-1 font-medium">Heart Rate</p>
                  <p className="text-gray-900 text-lg font-bold">{selectedPatient.vitalSigns.heartRate} <span className="text-sm font-normal text-gray-600">bpm</span></p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <p className="text-orange-600 text-sm mb-1 font-medium">Temperature</p>
                  <p className="text-gray-900 text-lg font-bold">{selectedPatient.vitalSigns.temperature}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-purple-600 text-sm mb-1 font-medium">Oxygen Sat.</p>
                  <p className="text-gray-900 text-lg font-bold">{selectedPatient.vitalSigns.oxygen}</p>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-4 font-semibold">Medical History</h3>
              {isEditing ? (
                <textarea
                  value={editedPatient.medicalHistory}
                  onChange={(e) => setEditedPatient({ ...editedPatient, medicalHistory: e.target.value })}
                  className="w-full text-gray-700 border border-gray-300 rounded p-3 min-h-[80px] focus:ring-2 focus:ring-red-500 outline-none"
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{selectedPatient.medicalHistory}</p>
              )}
            </div>

            {/* Medications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-4 font-semibold">Current Medications</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {(isEditing ? editedPatient.medications : selectedPatient.medications).map((med: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg group">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-gray-900 font-medium">{med}</span>
                    {isEditing && (
                      <button
                        onClick={() => {
                          const newMeds = editedPatient.medications.filter((_: any, i: number) => i !== index);
                          setEditedPatient({ ...editedPatient, medications: newMeds });
                        }}
                        className="ml-2 text-gray-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="Add new medication..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMedication.trim()) {
                        setEditedPatient({
                          ...editedPatient,
                          medications: [...editedPatient.medications, newMedication.trim()]
                        });
                        setNewMedication('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newMedication.trim()) {
                        setEditedPatient({
                          ...editedPatient,
                          medications: [...editedPatient.medications, newMedication.trim()]
                        });
                        setNewMedication('');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Transfer History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-4 font-semibold">Transfer History</h3>

              {isEditing && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Transfer Record</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="date"
                      value={newTransfer.date}
                      onChange={(e) => setNewTransfer({ ...newTransfer, date: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <select
                      value={newTransfer.status}
                      onChange={(e) => setNewTransfer({ ...newTransfer, status: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Pending</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Reason"
                      value={newTransfer.reason}
                      onChange={(e) => setNewTransfer({ ...newTransfer, reason: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="From Facility"
                      value={newTransfer.from}
                      onChange={(e) => setNewTransfer({ ...newTransfer, from: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="To Facility"
                      value={newTransfer.to}
                      onChange={(e) => setNewTransfer({ ...newTransfer, to: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (newTransfer.date && newTransfer.reason) {
                        setEditedPatient({
                          ...editedPatient,
                          recentTransfers: [newTransfer, ...editedPatient.recentTransfers]
                        });
                        setNewTransfer({
                          date: '',
                          from: '',
                          to: '',
                          reason: '',
                          status: 'In Progress'
                        });
                      } else {
                        alert('Please fill in Date and Reason');
                      }
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add Record
                  </button>
                </div>
              )}

              {(isEditing ? editedPatient.recentTransfers : selectedPatient.recentTransfers).length > 0 ? (
                <div className="space-y-4">
                  {(isEditing ? editedPatient.recentTransfers : selectedPatient.recentTransfers).map((transfer: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors relative group">
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newTransfers = editedPatient.recentTransfers.filter((_: any, i: number) => i !== index);
                            setEditedPatient({ ...editedPatient, recentTransfers: newTransfers });
                          }}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1"
                          title="Remove record"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      <div className="flex items-center justify-between mb-2 pr-8">
                        <span className="text-gray-600 text-sm flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {transfer.date}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${transfer.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}>
                          {transfer.status}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-1 font-medium">{transfer.reason}</p>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mt-2">
                        <span>{transfer.from}</span>
                        <span className="text-gray-400">→</span>
                        <span>{transfer.to}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">No transfer history records found</p>
              )}
            </div>
            {/* Medical Documents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Medical Documents</h3>
                {uploadedFiles[selectedPatient.id]?.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {uploadedFiles[selectedPatient.id].length}
                  </span>
                )}
              </div>
              <label className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer flex items-center justify-center gap-2 mb-4">
                <Upload size={16} />
                {isUploading ? 'Uploading...' : 'Upload New File'}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, selectedPatient.id)}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>


              {/* Display uploaded files */}
              <div className="space-y-2">
                {uploadedFiles[selectedPatient.id]?.length > 0 ? (
                  uploadedFiles[selectedPatient.id].map((file: File, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group">
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <File className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium text-sm truncate">{file.name}</p>
                          <p className="text-gray-500 text-xs">
                            {(file.size / 1024).toFixed(2)} KB • {file.type || 'Unknown type'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            const url = URL.createObjectURL(file);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.name;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download file"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleFileRemove(selectedPatient.id, index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <File className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-gray-600 text-sm font-medium">No documents uploaded yet</p>
                    <p className="text-gray-400 text-xs mt-1">Upload patient reports, lab results, or transfer documents</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
      <button
        onClick={() => onNavigate?.('transfer')}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 z-50 flex items-center gap-2 group"
        title="New Transfer Request"
      >
        <Ambulance size={24} />
        <span className="hidden group-hover:block transition-all duration-300">New Request</span>
      </button>
    </div>
  );
}

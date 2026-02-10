import { useState } from 'react';
import { FileText, Search, User, Calendar, AlertCircle, Upload, Download, File } from 'lucide-react';

export function PatientRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File[] }>({});

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
  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, patientId: string) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => ({
        ...prev,
        [patientId]: [...(prev[patientId] || []), ...newFiles]
      }));
    }
  };
  // File removal handler
  const handleFileRemove = (patientId: string, fileIndex: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [patientId]: prev[patientId].filter((_, index) => index !== fileIndex)
    }));
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

      {/* Patient List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900">Patient List</h3>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedPatient?.id === patient.id ? 'bg-red-50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="text-red-600" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-900">{patient.name}</p>
                        <p className="text-gray-600 text-sm">{patient.id}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {patient.age} yrs • {patient.gender} • {patient.bloodGroup}
                    </p>
                  </button>
                ))
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

        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-gray-900 mb-1">{selectedPatient.name}</h2>
                    <p className="text-gray-600">{selectedPatient.id}</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                    Edit Record
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Age</p>
                    <p className="text-gray-900">{selectedPatient.age} years</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gender</p>
                    <p className="text-gray-900">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Blood Group</p>
                    <p className="text-gray-900">{selectedPatient.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Allergies</p>
                    <p className="text-red-600">{selectedPatient.allergies}</p>
                  </div>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-gray-900 mb-4">Current Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-600 text-sm mb-1">Blood Pressure</p>
                    <p className="text-gray-900">{selectedPatient.vitalSigns.bp}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-600 text-sm mb-1">Heart Rate</p>
                    <p className="text-gray-900">{selectedPatient.vitalSigns.heartRate} bpm</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-orange-600 text-sm mb-1">Temperature</p>
                    <p className="text-gray-900">{selectedPatient.vitalSigns.temperature}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-purple-600 text-sm mb-1">Oxygen Sat.</p>
                    <p className="text-gray-900">{selectedPatient.vitalSigns.oxygen}</p>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-gray-900 mb-4">Medical History</h3>
                <p className="text-gray-700">{selectedPatient.medicalHistory}</p>
              </div>

              {/* Medications */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-gray-900 mb-4">Current Medications</h3>
                <div className="space-y-2">
                  {selectedPatient.medications.map((med: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="text-gray-900">{med}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer History */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-gray-900 mb-4">Transfer History</h3>
                {selectedPatient.recentTransfers.length > 0 ? (
                  <div className="space-y-4">
                    {selectedPatient.recentTransfers.map((transfer: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 text-sm flex items-center gap-2">
                            <Calendar size={16} />
                            {transfer.date}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs ${transfer.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                            }`}>
                            {transfer.status}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-1">{transfer.reason}</p>
                        <p className="text-gray-600 text-sm">
                          {transfer.from} → {transfer.to}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No transfer history</p>
                )}
              </div>
              {/* Medical Documents */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">Medical Documents</h3>
                  <label className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer flex items-center gap-2">
                    <Upload size={16} />
                    Upload Files
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, selectedPatient.id)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Display uploaded files */}
                <div className="space-y-2">
                  {uploadedFiles[selectedPatient.id]?.length > 0 ? (
                    uploadedFiles[selectedPatient.id].map((file: File, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
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
                        <div className="flex items-center gap-2">
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
                    <div className="text-center py-8">
                      <File className="mx-auto text-gray-400 mb-3" size={40} />
                      <p className="text-gray-600 text-sm">No documents uploaded yet</p>
                      <p className="text-gray-500 text-xs mt-1">Upload patient reports, lab results, or transfer documents</p>
                    </div>
                  )}
                </div>
              </div>

            </div>


          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="max-w-xl mx-auto">
                {/* Upload Icon */}
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="text-red-600" size={40} />
                </div>

                {/* Title */}
                <h3 className="text-gray-900 mb-2 text-xl font-semibold text-center">
                  Upload Patient Reports
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 text-center">
                  Select a patient from the list, then upload medical reports, lab results, or transfer documents.
                </p>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-900 font-medium text-sm mb-2">📋 How to Upload:</p>
                  <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                    <li>Click on a patient from the list on the left</li>
                    <li>Scroll to the "Medical Documents" section</li>
                    <li>Click "Upload Files" and select PDF, images, or documents</li>
                    <li>Files will be available for all hospitals during transfers</li>
                  </ol>
                </div>

                {/* Accepted formats */}
                <div className="text-center">
                  <p className="text-gray-500 text-sm">
                    Accepted formats: PDF, PNG, JPG, JPEG, DOC, DOCX
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

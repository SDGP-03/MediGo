
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Calendar, AlertCircle, Upload, Download, File, Ambulance, Loader2, FileText, Plus, X, FileJson, Share2 } from 'lucide-react';
import { database, auth } from '../firebase';
import { ref, onValue, off, set, update, push, get } from 'firebase/database';
import { encryptData, decryptObject, decryptData } from '../utils/encryption';

interface PatientTransfer {
  date: string;
  from: string;
  to: string;
  reason: string;
  status: string;
}

interface VitalSigns {
  bp: string;
  heartRate: string;
  temperature: string;
  oxygen: string;
}

interface PatientDocument {
  name: string;
  size: number;
  type: string;
  data: string;
  uploadedAt: number;
}

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
  medications: string[];
  vitalSigns: VitalSigns;
  recentTransfers: PatientTransfer[];
  documents: PatientDocument[];
}

interface TransferRequestRecord {
  createdAt?: number;
  status?: string;
  reason?: string;
  patient?: {
    name?: string;
    age?: number | string;
    gender?: string;
    id?: string;
    bloodGroup?: string;
    allergies?: string;
    medicalHistory?: string;
    currentCondition?: string;
    vitalSigns?: string;
  };
  pickup?: {
    hospitalName?: string;
  };
  destination?: {
    hospitalName?: string;
  };
}

type PatientOverrides = Record<string, Partial<PatientRecord>>;

const EMPTY_VITALS: VitalSigns = {
  bp: 'Not recorded',
  heartRate: 'Not recorded',
  temperature: 'Not recorded',
  oxygen: 'Not recorded',
};

const sanitizeKey = (value: string) => value.replace(/[.#$/[\]]/g, '_');

const normalizeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toISOString().slice(0, 10);
};

const statusLabel = (status?: string): string => {
  if (!status) return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};

const toDocumentsArray = (value: unknown): PatientDocument[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as PatientDocument[];
  return Object.values(value as Record<string, PatientDocument>);
};

const toAscii = (value: string) => value.replace(/[^\x20-\x7E]/g, '?');
const escapePdfText = (value: string) => toAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const HOSPITAL_OPTIONS = [
  'Central Medical Center',
  'Specialist Care Hospital',
  'Regional Base Hospital',
  'Teaching Hospital East',
  'Metro Hospital',
];

const wrapText = (text: string, maxChars = 80): string[] => {
  const cleaned = toAscii(text || '');
  if (!cleaned) return ['-'];
  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars) {
      lines.push(line || word);
      line = line ? word : '';
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
};

const loadJpegHexFromPath = async (path: string, maxSize = 42): Promise<{ hex: string; width: number; height: number } | null> => {
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image ${path}`));
      img.src = path;
    });

    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = window.document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = jpegDataUrl.split(',')[1];
    if (!base64) return null;
    const binary = window.atob(base64);

    let hex = '';
    for (let i = 0; i < binary.length; i += 1) {
      hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
    }
    hex += '>';
    return { hex, width, height };
  } catch {
    return null;
  }
};

const createStyledPdfBlob = async (patient: PatientRecord): Promise<Blob> => {
  const logo = await loadJpegHexFromPath('/MediGo-icon.PNG');
  const now = new Date();
  const generatedAt = now.toLocaleString();

  let content = '';
  content += '0.95 0.96 0.98 rg 0 730 612 62 re f\n';
  content += '0.80 0.11 0.11 rg 0 726 612 6 re f\n';

  if (logo) {
    content += `q ${logo.width} 0 0 ${logo.height} 42 742 cm /Im1 Do Q\n`;
    content += `q 18 0 0 18 556 746 cm /Im1 Do Q\n`;
  }

  content += '0.07 0.10 0.18 rg\n';
  content += 'BT /F2 20 Tf 95 764 Td (MediGo Patient Medical Report) Tj ET\n';
  content += '0.16 0.16 0.16 rg\n';
  content += `BT /F1 10 Tf 95 748 Td (Generated: ${escapePdfText(generatedAt)}) Tj ET\n`;

  content += '0.3 0.3 0.3 RG 1 w 40 615 532 95 re S\n';
  content += '40 645 m 572 645 l S\n';
  content += '305 615 m 305 710 l S\n';

  content += '0.08 0.08 0.08 rg\n';
  content += `BT /F2 10 Tf 50 692 Td (Patient ID) Tj ET\n`;
  content += `BT /F1 10 Tf 50 677 Td (${escapePdfText(patient.id)}) Tj ET\n`;
  content += `BT /F2 10 Tf 50 662 Td (Name) Tj ET\n`;
  content += `BT /F1 10 Tf 50 647 Td (${escapePdfText(patient.name)}) Tj ET\n`;

  content += `BT /F2 10 Tf 315 692 Td (Age / Gender) Tj ET\n`;
  content += `BT /F1 10 Tf 315 677 Td (${escapePdfText(`${patient.age} / ${patient.gender}`)}) Tj ET\n`;
  content += `BT /F2 10 Tf 315 662 Td (Blood Group / Allergies) Tj ET\n`;
  content += `BT /F1 10 Tf 315 647 Td (${escapePdfText(`${patient.bloodGroup} / ${patient.allergies || 'None'}`)}) Tj ET\n`;

  let y = 596;
  const sectionTitle = (title: string) => {
    content += `0.90 0.93 0.98 rg 40 ${y - 4} 532 20 re f\n`;
    content += '0.08 0.08 0.08 rg\n';
    content += `BT /F2 11 Tf 46 ${y + 2} Td (${escapePdfText(title)}) Tj ET\n`;
    y -= 24;
  };

  const writeLines = (lines: string[], font = '/F1', size = 10) => {
    content += '0.08 0.08 0.08 rg\n';
    lines.forEach((line) => {
      if (y < 40) return;
      content += `BT ${font} ${size} Tf 48 ${y} Td (${escapePdfText(line)}) Tj ET\n`;
      y -= 14;
    });
  };

  sectionTitle('Vital Signs');
  writeLines([
    `Blood Pressure: ${patient.vitalSigns.bp}`,
    `Heart Rate: ${patient.vitalSigns.heartRate} bpm`,
    `Temperature: ${patient.vitalSigns.temperature}`,
    `Oxygen Saturation: ${patient.vitalSigns.oxygen}`,
  ]);

  y -= 4;
  sectionTitle('Medical History');
  writeLines(wrapText(patient.medicalHistory || 'No history available.', 92));

  y -= 4;
  sectionTitle('Current Medications');
  writeLines(
    patient.medications.length > 0
      ? patient.medications.map((med) => `- ${med}`)
      : ['- None recorded'],
  );

  y -= 4;
  sectionTitle('Recent Transfers');
  if (patient.recentTransfers.length === 0) {
    writeLines(['- No transfer records']);
  } else {
    patient.recentTransfers.slice(0, 8).forEach((transfer, index) => {
      writeLines([
        `${index + 1}. ${transfer.date} | ${transfer.status}`,
        `   ${transfer.from} -> ${transfer.to}`,
        ...wrapText(`   Reason: ${transfer.reason}`, 90),
      ]);
    });
  }

  content += '0.45 0.45 0.45 rg BT /F1 8 Tf 40 20 Td (Generated by MediGo Admin Dashboard) Tj ET\n';

  const objects: string[] = [];
  const imageObjectIndex = logo ? 7 : null;
  const xObjectPart = logo ? `/XObject << /Im1 ${imageObjectIndex} 0 R >>` : '';

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> ${xObjectPart} >> /Contents 6 0 R >>\nendobj\n`);
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');
  objects.push(`6 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  if (logo && imageObjectIndex) {
    objects.push(
      `${imageObjectIndex} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${logo.hex.length} >>\nstream\n${logo.hex}\nendstream\nendobj\n`,
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to convert report to data URL'));
    reader.readAsDataURL(blob);
  });

const mergePatients = (
  transferRequests: Record<string, TransferRequestRecord>,
  overrides: PatientOverrides,
): PatientRecord[] => {
  const byPatientId: Record<string, PatientRecord> = {};

  // 1. Process transfer requests first (to collect transfer history)
  Object.values(transferRequests).forEach((request) => {
    if (!request?.patient) return;

    const id = request.patient.id || `REQ-${request.createdAt ?? Date.now()}`;
    if (!byPatientId[id]) {
      byPatientId[id] = {
        id,
        name: decryptData(request.patient.name) || 'Unknown Patient',
        age: normalizeNumber(decryptData(request.patient.age)),
        gender: decryptData(request.patient.gender) || 'Unknown',
        bloodGroup: decryptData(request.patient.bloodGroup) || 'Unknown',
        allergies: decryptData(request.patient.allergies) || 'None',
        medicalHistory: decryptData(request.patient.medicalHistory) || 'No history available.',
        medications: [],
        vitalSigns: {
          ...EMPTY_VITALS,
          temperature: decryptData(request.patient.vitalSigns) || EMPTY_VITALS.temperature,
        },
        recentTransfers: [],
        documents: [],
      };
    }

    byPatientId[id].recentTransfers.push({
      date: formatDate(request.createdAt),
      from: decryptData(request.pickup?.hospitalName) || 'Unknown',
      to: decryptData(request.destination?.hospitalName) || 'Unknown',
      reason: decryptData(request.reason) || 'Not specified',
      status: statusLabel(request.status),
    });
  });

  // 2. Process ALL overrides (patient_records from Firebase)
  // This ensures that manually added patients show up even if they have no transfer history
  Object.entries(overrides).forEach(([key, override]) => {
    const id = override.id || key;
    if (!byPatientId[id]) {
      // Create new record if it doesn't exist in transferRequests
      byPatientId[id] = {
        id,
        name: override.name || 'Unknown Patient',
        age: normalizeNumber(override.age),
        gender: override.gender || 'Unknown',
        bloodGroup: override.bloodGroup || 'Unknown',
        allergies: override.allergies || 'None',
        medicalHistory: override.medicalHistory || 'No history available.',
        medications: [],
        vitalSigns: { ...EMPTY_VITALS },
        recentTransfers: [],
        documents: [],
      };
    }

    // Merge override data into the record
    byPatientId[id] = {
      ...byPatientId[id],
      ...override,
      medications: Array.isArray(override.medications) ? override.medications : byPatientId[id].medications,
      recentTransfers: Array.isArray(override.recentTransfers) ? override.recentTransfers : byPatientId[id].recentTransfers,
      vitalSigns: { ...byPatientId[id].vitalSigns, ...(override.vitalSigns || {}) },
      documents: toDocumentsArray(override.documents),
    };
  });

  // 3. Final sorting
  Object.values(byPatientId).forEach((patient) => {
    patient.recentTransfers.sort((a, b) => b.date.localeCompare(a.date));
  });

  return Object.values(byPatientId).sort((a, b) => a.name.localeCompare(b.name));
};

export function PatientRecords() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [transferRequests, setTransferRequests] = useState<Record<string, TransferRequestRecord>>({});
  const [patientOverrides, setPatientOverrides] = useState<PatientOverrides>({});

  // Resolve Hospital ID first
  useEffect(() => {
    const fetchHospitalId = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoadError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        const adminSnap = await get(ref(database, `admin/${user.uid}`));
        const adminData = adminSnap.exists() ? adminSnap.val() : {};
        const id = adminData.hospitalPlaceId || user.uid;
        const hName = adminData.hospitalName || null;
        
        setHospitalId(id);
        setHospitalName(hName);

        // Load thermal data from localStorage for this specific hospital
        const savedTransfers = localStorage.getItem(`medigo_transfers_${id}`);
        if (savedTransfers) setTransferRequests(JSON.parse(savedTransfers));

        const savedOverrides = localStorage.getItem(`medigo_records_${id}`);
        if (savedOverrides) setPatientOverrides(JSON.parse(savedOverrides));

      } catch (err) {
        console.error('Error resolving hospital ID:', err);
        setLoadError('Failed to initialize hospital system');
        setIsLoading(false);
      }
    };

    fetchHospitalId();
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<PatientRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newTransfer, setNewTransfer] = useState({
    date: '',
    from: '',
    to: '',
    reason: '',
    status: 'In Progress',
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatientData, setNewPatientData] = useState<Partial<PatientRecord>>({
    name: '',
    age: 0,
    id: '',
    gender: 'Male',
    bloodGroup: 'A+',
    allergies: 'None',
    medicalHistory: '',
    medications: [],
    vitalSigns: { ...EMPTY_VITALS },
    recentTransfers: [],
    documents: [],
  });

  const handleAddPatient = async () => {
    if (!newPatientData.name || !newPatientData.id || !newPatientData.age) {
      alert('Please fill in Name, Age, and Patient ID.');
      return;
    }

    setIsSaving(true);
    try {
      await savePatient(newPatientData as PatientRecord);
      setIsAddModalOpen(false);
      setNewPatientData({
        name: '',
        age: 0,
        id: '',
        gender: 'Male',
        bloodGroup: 'A+',
        allergies: 'None',
        medicalHistory: '',
        medications: [],
        vitalSigns: { ...EMPTY_VITALS },
        recentTransfers: [],
        documents: [],
      });
      setSelectedPatientId(newPatientData.id!);
    } catch (error) {
      console.error('Failed to add patient:', error);
      alert('Failed to add patient. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!hospitalId) return;

    const transfersRef = ref(database, 'transfer_requests');
    const recordsRef = ref(database, `hospitals/${hospitalId}/patient_records`);

    const unsubTransfers = onValue(transfersRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      // Filter transfers to only show those involving this hospital
      const filteredTransfers: Record<string, TransferRequestRecord> = {};
      if (hospitalName) {
        Object.entries(data).forEach(([key, val]: [string, any]) => {
          if (val.pickup?.hospitalName === hospitalName || val.destination?.hospitalName === hospitalName) {
            filteredTransfers[key] = val;
          }
        });
      } else {
        // Fallback for superadmin or if name is missing (shows all)
        Object.assign(filteredTransfers, data);
      }

      setTransferRequests(filteredTransfers);
      try {
        localStorage.setItem(`medigo_transfers_${hospitalId}`, JSON.stringify(filteredTransfers));
      } catch (err) {
        console.error('Failed to save transfers to local JSON storage:', err);
      }
    }, (err) => {
      console.error('[PatientRecords] Transfers error:', err);
    });

    const unsubRecords = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const decryptedData: PatientOverrides = {};
      Object.entries(data).forEach(([key, value]) => {
        decryptedData[key] = decryptObject(value as Partial<PatientRecord>);
      });
      setPatientOverrides(decryptedData);
      try {
        localStorage.setItem(`medigo_records_${hospitalId}`, JSON.stringify(decryptedData));
      } catch (err) {
        console.error('Failed to save records to local JSON storage:', err);
      }
      setIsLoading(false);
    }, (err) => {
      console.error('[PatientRecords] Records error:', err);
      setIsLoading(false);
      setLoadError('Failed to load records from cloud. Using local data if available.');
    });

    return () => {
      off(transfersRef);
      off(recordsRef);
    };
  }, [hospitalId]);

  const patients = useMemo(
    () => mergePatients(transferRequests, patientOverrides),
    [transferRequests, patientOverrides],
  );

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(term) ||
        patient.id.toLowerCase().includes(term),
    );
  }, [patients, searchTerm]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  );

  useEffect(() => {
    if (!selectedPatientId) return;
    const stillExists = patients.some((patient) => patient.id === selectedPatientId);
    if (!stillExists) {
      setSelectedPatientId(null);
      setIsEditing(false);
      setEditedPatient(null);
    }
  }, [patients, selectedPatientId]);

  const savePatient = async (record: PatientRecord) => {
    if (!hospitalId) return;
    const key = sanitizeKey(record.id);
    setIsSaving(true);
    try {
      await set(ref(database, `hospitals/${hospitalId}/patient_records/${key}`), {
        id: record.id,
        name: encryptData(record.name),
        age: encryptData(record.age),
        gender: encryptData(record.gender),
        bloodGroup: encryptData(record.bloodGroup),
        allergies: encryptData(record.allergies),
        medicalHistory: encryptData(record.medicalHistory),
        medications: record.medications.map(m => encryptData(m)),
        vitalSigns: {
          bp: encryptData(record.vitalSigns.bp),
          heartRate: encryptData(record.vitalSigns.heartRate),
          temperature: encryptData(record.vitalSigns.temperature),
          oxygen: encryptData(record.vitalSigns.oxygen),
        },
        recentTransfers: record.recentTransfers.map(t => ({
          ...t,
          reason: encryptData(t.reason),
          from: encryptData(t.from),
          to: encryptData(t.to),
        })),
        documents: record.documents || [],
      });
      setIsEditing(false);
      setEditedPatient(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedPatient) return;
    try {
      await savePatient(editedPatient);
    } catch (error) {
      console.error('Failed to save patient record:', error);
      alert('Failed to save patient changes. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, patient: PatientRecord) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 5 * 1024 * 1024;
    const selectedFiles = Array.from(files);
    const oversized = selectedFiles.filter((file) => file.size > maxSize);

    if (oversized.length > 0) {
      alert(`Some files are too large (max 5MB): ${oversized.map((file) => file.name).join(', ')}`);
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const encodedFiles = await Promise.all(
        selectedFiles.map(
          (file) =>
            new Promise<PatientDocument>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (loadEvent) => {
                resolve({
                  name: file.name,
                  size: file.size,
                  type: file.type || 'Unknown type',
                  data: String(loadEvent.target?.result || ''),
                  uploadedAt: Date.now(),
                });
              };
              reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
              reader.readAsDataURL(file);
            }),
        ),
      );

      const updatedRecord: PatientRecord = {
        ...patient,
        documents: [...(patient.documents || []), ...encodedFiles],
      };
      await savePatient(updatedRecord);
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleFileRemove = async (patient: PatientRecord, fileIndex: number) => {
    const updatedRecord: PatientRecord = {
      ...patient,
      documents: patient.documents.filter((_, index) => index !== fileIndex),
    };

    try {
      await savePatient(updatedRecord);
    } catch (error) {
      console.error('Failed to remove file:', error);
      alert('Failed to remove file. Please try again.');
    }
  };

  const downloadPatientReportPdf = async (patient: PatientRecord) => {
    const pdfBlob = await createStyledPdfBlob(patient);
    const url = URL.createObjectURL(pdfBlob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${sanitizeKey(patient.id)}-report.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendPatientReportToHospital = async (patient: PatientRecord) => {
    if (!selectedHospital) {
      alert('Please select a destination hospital first.');
      return;
    }

    setIsSending(true);
    try {
      const pdfBlob = await createStyledPdfBlob(patient);
      const reportData = await blobToDataUrl(pdfBlob);

      const transferRef = ref(database, 'transfer_requests');
      const newTransferRef = push(transferRef);

      await set(newTransferRef, {
        destinationHospital: selectedHospital,
        status: 'sent',
        reportType: 'patient_medical_report',
        fileName: `${sanitizeKey(patient.id)}-report.pdf`,
        fileType: 'application/pdf',
        reportData,
        createdAt: Date.now(),
        patient: {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
        },
        summary: {
          transferCount: patient.recentTransfers.length,
          medicationsCount: patient.medications.length,
        },
      });

      alert(`Report sent to ${selectedHospital} successfully.`);
    } catch (error) {
      console.error('Failed to send report:', error);
      alert('Failed to send report to hospital. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(Object.values(patients), null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const fileName = `medigo_patients_${hospitalId}_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = window.document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedPatients = JSON.parse(content);

        if (!Array.isArray(importedPatients)) {
          throw new Error('Invalid JSON format. Expected an array of patients.');
        }

        if (window.confirm(`Found ${importedPatients.length} patients in the file. Import them into your hospital records system?`)) {
          setIsSaving(true);
          for (const patient of importedPatients) {
            // Basic validation and mapping
            if (patient.id && patient.name) {
              await savePatient(patient);
            }
          }
          alert('Extraction complete. All valid records have been added to your system.');
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to extract data: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setIsSaving(false);
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-foreground mb-4">Centralized Patient Records</h2>
        <p className="text-muted-foreground mb-4">
          Search by name or ID to view complete medical histories, vital signs, and transfer records across facilities.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient name or ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-input-field-bg text-foreground"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              x
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <Loader2 className="mx-auto mb-3 animate-spin text-red-600" size={28} />
          <p className="text-muted-foreground">Loading patient records...</p>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="bg-card rounded-lg border border-red-200 p-6 text-center">
          <AlertCircle className="mx-auto text-red-600 mb-2" />
          <p className="text-red-600">{loadError}</p>
        </div>
      )}

      {!isLoading && !loadError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-1 ${!selectedPatient ? 'lg:col-span-3' : ''} transition-all duration-300`}>
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-foreground">Patient List</h3>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                      {filteredPatients.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="p-2 hover:bg-accent rounded-lg text-muted-foreground cursor-pointer transition-colors" title="Extract from JSON file">
                      <Upload size={18} />
                      <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                    </label>
                    <button
                      onClick={handleExportJSON}
                      className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
                      title="Save to local device (JSON)"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold shadow-sm ml-2"
                    >
                      <Plus size={14} />
                      New Patient
                    </button>
                  </div>
                </div>
              </div>

              <div className={`divide-y divide-border overflow-y-auto ${selectedPatient ? 'max-h-[600px]' : ''}`}>
                {filteredPatients.length > 0 ? (
                  <div className={`${!selectedPatient ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4' : ''}`}>
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setIsEditing(false);
                          setEditedPatient(null);
                        }}
                        className={`w-full p-4 text-left hover:bg-accent transition-colors border rounded-lg ${selectedPatient?.id === patient.id
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900'
                          : 'border-transparent hover:border-border'
                          } ${!selectedPatient ? 'border-border' : ''}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center shrink-0">
                            <User className="text-red-600" size={20} />
                          </div>
                          <div>
                            <p className="text-foreground font-medium">{patient.name}</p>
                            <p className="text-muted-foreground text-sm">{patient.id}</p>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mt-2">
                          {patient.age} yrs - {patient.gender} - {patient.bloodGroup}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <AlertCircle className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-foreground font-medium mb-1">No matches found</p>
                    <p className="text-muted-foreground text-sm">
                      {searchTerm ? `No patients match "${searchTerm}"` : 'No patients available'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedPatient && (
            <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setSelectedPatientId(null)}
                      className="p-2 -ml-2 hover:bg-accent rounded-lg text-muted-foreground lg:hidden"
                    >
                      <span className="sr-only">Back to list</span>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-foreground mb-1 font-bold text-xl">{selectedPatient.name}</h2>
                        <button
                          onClick={() => setSelectedPatientId(null)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline hidden lg:block"
                        >
                          Back to List
                        </button>
                      </div>
                      <p className="text-muted-foreground">{selectedPatient.id}</p>
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedHospital}
                        onChange={(event) => setSelectedHospital(event.target.value)}
                        className="px-3 py-2 bg-input-field-bg border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select hospital</option>
                        {HOSPITAL_OPTIONS.map((hospital) => (
                          <option key={hospital} value={hospital}>
                            {hospital}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => sendPatientReportToHospital(selectedPatient)}
                        disabled={isSending || !selectedHospital}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSending ? 'Sending...' : 'Send Report'}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await downloadPatientReportPdf(selectedPatient);
                          } catch (error) {
                            console.error('Failed to download report:', error);
                            alert('Failed to download PDF report. Please try again.');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm inline-flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Download PDF
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditedPatient({
                            ...selectedPatient,
                            medications: [...selectedPatient.medications],
                            recentTransfers: [...selectedPatient.recentTransfers],
                            documents: [...selectedPatient.documents],
                          });
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Edit Record
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-70"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-6 pt-6 border-t border-border">
                  <div>
                    <p className="text-muted-foreground mb-1">Age</p>
                    {isEditing && editedPatient ? (
                      <input
                        type="number"
                        value={editedPatient.age}
                        onChange={(event) =>
                          setEditedPatient({ ...editedPatient, age: normalizeNumber(event.target.value) })
                        }
                        className="text-foreground bg-input-field-bg border border-input rounded px-2 py-1 w-20 focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{selectedPatient.age} years</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Gender</p>
                    {isEditing && editedPatient ? (
                      <select
                        value={editedPatient.gender}
                        onChange={(event) => setEditedPatient({ ...editedPatient, gender: event.target.value })}
                        className="text-foreground bg-input-field-bg border border-input rounded px-2 py-1 focus:ring-2 focus:ring-red-500 outline-none"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    ) : (
                      <p className="text-foreground font-medium">{selectedPatient.gender}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Blood Group</p>
                    {isEditing && editedPatient ? (
                      <select
                        value={editedPatient.bloodGroup}
                        onChange={(event) => setEditedPatient({ ...editedPatient, bloodGroup: event.target.value })}
                        className="text-foreground bg-input-field-bg border border-input rounded px-2 py-1 focus:ring-2 focus:ring-red-500 outline-none"
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
                      <p className="text-foreground font-medium">{selectedPatient.bloodGroup}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Allergies</p>
                    {isEditing && editedPatient ? (
                      <input
                        type="text"
                        value={editedPatient.allergies}
                        onChange={(event) => setEditedPatient({ ...editedPatient, allergies: event.target.value })}
                        className="text-red-600 bg-input-field-bg border border-input rounded px-2 py-1 w-full focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    ) : (
                      <p className="text-red-600 font-medium">{selectedPatient.allergies}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h3 className="text-foreground mb-4 font-semibold">Current Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-blue-600 dark:text-blue-400 text-sm mb-1 font-medium">Blood Pressure</p>
                    <p className="text-foreground text-lg font-bold">{selectedPatient.vitalSigns.bp}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                    <p className="text-green-600 dark:text-green-400 text-sm mb-1 font-medium">Heart Rate</p>
                    <p className="text-foreground text-lg font-bold">
                      {selectedPatient.vitalSigns.heartRate}{' '}
                      <span className="text-sm font-normal text-muted-foreground">bpm</span>
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800">
                    <p className="text-orange-600 dark:text-orange-400 text-sm mb-1 font-medium">Temperature</p>
                    <p className="text-foreground text-lg font-bold">{selectedPatient.vitalSigns.temperature}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                    <p className="text-purple-600 dark:text-purple-400 text-sm mb-1 font-medium">Oxygen Sat.</p>
                    <p className="text-foreground text-lg font-bold">{selectedPatient.vitalSigns.oxygen}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h3 className="text-foreground mb-4 font-semibold">Medical History</h3>
                {isEditing && editedPatient ? (
                  <textarea
                    value={editedPatient.medicalHistory}
                    onChange={(event) => setEditedPatient({ ...editedPatient, medicalHistory: event.target.value })}
                    className="w-full text-foreground bg-input-field-bg border border-input rounded p-3 min-h-[80px] focus:ring-2 focus:ring-red-500 outline-none"
                  />
                ) : (
                  <p className="text-foreground leading-relaxed">{selectedPatient.medicalHistory}</p>
                )}
              </div>

              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h3 className="text-foreground mb-4 font-semibold">Current Medications</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(isEditing && editedPatient ? editedPatient.medications : selectedPatient.medications).map((medication, index) => (
                    <div key={`${medication}-${index}`} className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border rounded-lg group">
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                      <span className="text-foreground font-medium">{medication}</span>
                      {isEditing && editedPatient && (
                        <button
                          onClick={() => {
                            const nextMeds = editedPatient.medications.filter((_, medIndex) => medIndex !== index);
                            setEditedPatient({ ...editedPatient, medications: nextMeds });
                          }}
                          className="ml-2 text-muted-foreground hover:text-red-600"
                        >
                          x
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && editedPatient && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMedication}
                      onChange={(event) => setNewMedication(event.target.value)}
                      placeholder="Add new medication..."
                      className="flex-1 border border-input bg-input-field-bg text-foreground rounded px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && newMedication.trim()) {
                          setEditedPatient({
                            ...editedPatient,
                            medications: [...editedPatient.medications, newMedication.trim()],
                          });
                          setNewMedication('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!newMedication.trim()) return;
                        setEditedPatient({
                          ...editedPatient,
                          medications: [...editedPatient.medications, newMedication.trim()],
                        });
                        setNewMedication('');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h3 className="text-foreground mb-4 font-semibold">Transfer History</h3>

                {isEditing && editedPatient && (
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3">Add New Transfer Record</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="date"
                        value={newTransfer.date}
                        onChange={(event) => setNewTransfer({ ...newTransfer, date: event.target.value })}
                        className="border border-input bg-input-field-bg text-foreground rounded px-3 py-2 text-sm"
                      />
                      <select
                        value={newTransfer.status}
                        onChange={(event) => setNewTransfer({ ...newTransfer, status: event.target.value })}
                        className="border border-input bg-input-field-bg text-foreground rounded px-3 py-2 text-sm"
                      >
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Pending</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Reason"
                        value={newTransfer.reason}
                        onChange={(event) => setNewTransfer({ ...newTransfer, reason: event.target.value })}
                        className="border border-input bg-input-field-bg text-foreground rounded px-3 py-2 text-sm md:col-span-2"
                      />
                      <input
                        type="text"
                        placeholder="From Facility"
                        value={newTransfer.from}
                        onChange={(event) => setNewTransfer({ ...newTransfer, from: event.target.value })}
                        className="border border-input bg-input-field-bg text-foreground rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="To Facility"
                        value={newTransfer.to}
                        onChange={(event) => setNewTransfer({ ...newTransfer, to: event.target.value })}
                        className="border border-input bg-input-field-bg text-foreground rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newTransfer.date || !newTransfer.reason) {
                          alert('Please fill in Date and Reason');
                          return;
                        }

                        setEditedPatient({
                          ...editedPatient,
                          recentTransfers: [newTransfer, ...editedPatient.recentTransfers],
                        });
                        setNewTransfer({
                          date: '',
                          from: '',
                          to: '',
                          reason: '',
                          status: 'In Progress',
                        });
                      }}
                      className="w-full py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Add Record
                    </button>
                  </div>
                )}

                {(isEditing && editedPatient ? editedPatient.recentTransfers : selectedPatient.recentTransfers).length > 0 ? (
                  <div className="space-y-4">
                    {(isEditing && editedPatient ? editedPatient.recentTransfers : selectedPatient.recentTransfers).map((transfer, index) => (
                      <div key={`${transfer.date}-${index}`} className="border border-border rounded-lg p-4 hover:bg-accent transition-colors relative group">
                        {isEditing && editedPatient && (
                          <button
                            onClick={() => {
                              const nextTransfers = editedPatient.recentTransfers.filter((_, transferIndex) => transferIndex !== index);
                              setEditedPatient({ ...editedPatient, recentTransfers: nextTransfers });
                            }}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-red-600 p-1"
                            title="Remove record"
                          >
                            x
                          </button>
                        )}

                        <div className="flex items-center justify-between mb-2 pr-8">
                          <span className="text-muted-foreground text-sm flex items-center gap-2">
                            <Calendar size={16} className="text-muted-foreground" />
                            {transfer.date}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${(transfer.status || 'unknown').toLowerCase() === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              }`}
                          >
                            {transfer.status || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-foreground mb-1 font-medium">{transfer.reason}</p>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                          <span>{transfer.from}</span>
                          <span>to</span>
                          <span>{transfer.to}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 bg-muted/30 rounded-lg border border-dashed border-border">
                    No transfer history records found
                  </p>
                )}
              </div>

              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-semibold">Medical Documents</h3>
                  {selectedPatient.documents?.length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      {selectedPatient.documents.length}
                    </span>
                  )}
                </div>

                <label className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer inline-flex items-center justify-center gap-2 mb-4">
                  <Upload size={16} />
                  {isUploading ? 'Uploading...' : 'Upload New File'}
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(event) => handleFileUpload(event, selectedPatient)}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                <div className="space-y-2">
                  {selectedPatient.documents?.length > 0 ? (
                    selectedPatient.documents.map((doc, index) => (
                      <div key={`${doc.name}-${index}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:border-input transition-colors group">
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <File className="text-blue-600" size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-medium text-sm truncate">{doc.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {(doc.size / 1024).toFixed(2)} KB - {doc.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              const link = window.document.createElement('a');
                              link.href = doc.data;
                              link.download = doc.name;
                              link.click();
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Download file"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleFileRemove(selectedPatient, index)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove file"
                          >
                            x
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
                      <File className="mx-auto text-muted-foreground mb-3" size={32} />
                      <p className="text-muted-foreground text-sm font-medium">No documents uploaded yet</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Upload patient reports, lab results, or transfer documents
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => navigate('/transfer')}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 z-50 flex items-center gap-2 group"
        title="New Transfer Request"
      >
        <Ambulance size={24} />
        <span className="hidden group-hover:block transition-all duration-300">New Request</span>
      </button>

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2 text-red-600">
                <Plus size={20} />
                <h3 className="font-bold text-foreground">Add New Patient</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-accent rounded-full transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={newPatientData.name}
                  onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-input-field-bg border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Patient ID *</label>
                  <input
                    type="text"
                    value={newPatientData.id}
                    onChange={(e) => setNewPatientData({ ...newPatientData, id: e.target.value })}
                    placeholder="e.g. P-123456"
                    className="w-full bg-input-field-bg border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Age *</label>
                  <input
                    type="number"
                    value={newPatientData.age || ''}
                    onChange={(e) => setNewPatientData({ ...newPatientData, age: normalizeNumber(e.target.value) })}
                    placeholder="e.g. 45"
                    className="w-full bg-input-field-bg border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Gender</label>
                  <select
                    value={newPatientData.gender}
                    onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                    className="w-full bg-input-field-bg border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Blood Group</label>
                  <select
                    value={newPatientData.bloodGroup}
                    onChange={(e) => setNewPatientData({ ...newPatientData, bloodGroup: e.target.value })}
                    className="w-full bg-input-field-bg border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Allergies</label>
                <input
                  type="text"
                  value={newPatientData.allergies}
                  onChange={(e) => setNewPatientData({ ...newPatientData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Peanuts"
                  className="w-full bg-input-field-bg border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-red-500 outline-none placeholder:text-red-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Medical History</label>
                <textarea
                  value={newPatientData.medicalHistory}
                  onChange={(e) => setNewPatientData({ ...newPatientData, medicalHistory: e.target.value })}
                  placeholder="Brief summary of patient's medical history..."
                  className="w-full bg-input-field-bg border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/30 border-t border-border flex gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPatient}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Create Patient'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

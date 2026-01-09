import { useState } from 'react';
import { Ambulance, Clock, TrendingUp, AlertCircle, CheckCircle, User, MapPin } from 'lucide-react';

export function HospitalDashboard() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const incomingRequests = [
    {
      id: 1,
      patientName: 'John Doe',
      age: 45,
      gender: 'Male',
      incidentType: 'Cardiac Emergency',
      priority: 'critical',
      eta: '8 mins',
      distance: 3.2,
      ambulanceNumber: 'AMB-102',
      contactNumber: '+91 9876543210',
      symptoms: 'Severe chest pain, shortness of breath',
      consciousness: 'conscious',
      breathing: 'difficulty',
      timestamp: '2 mins ago',
    },
    {
      id: 2,
      patientName: 'Sarah Smith',
      age: 32,
      gender: 'Female',
      incidentType: 'Trauma/Accident',
      priority: 'urgent',
      eta: '12 mins',
      distance: 5.1,
      ambulanceNumber: 'AMB-205',
      contactNumber: '+91 9123456789',
      symptoms: 'Head injury, bleeding from forehead',
      consciousness: 'conscious',
      breathing: 'normal',
      timestamp: '5 mins ago',
    },
    {
      id: 3,
      patientName: 'Raj Kumar',
      age: 28,
      gender: 'Male',
      incidentType: 'Seizure',
      priority: 'urgent',
      eta: '15 mins',
      distance: 6.8,
      ambulanceNumber: 'AMB-301',
      contactNumber: '+91 9898989898',
      symptoms: 'Seizure episode, now stable',
      consciousness: 'drowsy',
      breathing: 'normal',
      timestamp: '8 mins ago',
    },
  ];

  const stats = [
    {
      label: 'Incoming Patients',
      value: '3',
      icon: Ambulance,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Avg Response Time',
      value: '6.2 min',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Today\'s Cases',
      value: '24',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Critical Cases',
      value: '1',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600';
      case 'urgent':
        return 'bg-orange-500';
      default:
        return 'bg-green-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-gray-900 mb-2">Hospital Dashboard</h2>
        <p className="text-gray-600">
          City General Hospital - Emergency Department
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className={`${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Incoming Patients */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Incoming Patients</h3>
        <div className="space-y-4">
          {incomingRequests.map((request) => (
            <div
              key={request.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-red-400 transition-all cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-gray-900">{request.patientName}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs text-white ${getPriorityColor(
                        request.priority
                      )}`}
                    >
                      {request.priority.toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-sm">{request.timestamp}</span>
                  </div>
                  <p className="text-gray-600">
                    {request.age} yrs • {request.gender} • {request.incidentType}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Ambulance size={16} className="text-gray-400" />
                  <span className="text-gray-700 text-sm">{request.ambulanceNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-700 text-sm">ETA {request.eta}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-700 text-sm">{request.distance} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-gray-700 text-sm capitalize">{request.consciousness}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <p className="text-gray-600 text-sm mb-1">Symptoms:</p>
                <p className="text-gray-900 text-sm">{request.symptoms}</p>
              </div>

              <div className="mt-3 flex gap-2">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                  Prepare Room
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Preparation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Resource Preparation Checklist</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-gray-900">Emergency Room 1 - Ready</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-gray-900">Cardiac Team - On Standby</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="text-yellow-600" size={20} />
            <span className="text-gray-900">Trauma Team - Being Notified</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-gray-900">Blood Bank - Notified</span>
          </div>
        </div>
      </div>

      {/* Benefits Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">MediGo Benefits for Hospitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="w-2 bg-blue-600 rounded"></div>
            <div>
              <p className="text-gray-900 mb-1">Faster Patient Intake</p>
              <p className="text-gray-600 text-sm">
                Patients arrive more stabilized with incident reports shared in advance
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 bg-purple-600 rounded"></div>
            <div>
              <p className="text-gray-900 mb-1">Reduced ER Chaos</p>
              <p className="text-gray-600 text-sm">
                Ambulance arrivals are predictable and better coordinated
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 bg-green-600 rounded"></div>
            <div>
              <p className="text-gray-900 mb-1">Better Resource Use</p>
              <p className="text-gray-600 text-sm">
                Prepare staff and equipment based on incoming emergency type
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 bg-orange-600 rounded"></div>
            <div>
              <p className="text-gray-900 mb-1">Increased Trust</p>
              <p className="text-gray-600 text-sm">
                Being part of a reliable system builds public confidence
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

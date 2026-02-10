import { useState } from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle, User, FileText, Star } from 'lucide-react';

export function PatientDashboard() {
  const bookingHistory = [
    {
      id: 1,
      date: '2025-11-15',
      time: '14:30',
      ambulance: 'LifeCare Ambulance',
      vehicleNumber: 'AMB-102',
      incidentType: 'Standard Transport',
      from: 'Home - MG Road',
      to: 'City General Hospital',
      status: 'completed',
      rating: 5,
      cost: 2500,
    },
    {
      id: 2,
      date: '2025-10-22',
      time: '09:15',
      ambulance: 'City Emergency Services',
      vehicleNumber: 'AMB-001',
      incidentType: 'Medical Emergency',
      from: 'Office - Park Street',
      to: 'Metro Hospital',
      status: 'completed',
      rating: 4,
      cost: 0,
    },
    {
      id: 3,
      date: '2025-09-18',
      time: '22:45',
      ambulance: 'RapidCare Emergency',
      vehicleNumber: 'AMB-410',
      incidentType: 'Critical Emergency',
      from: 'Residence - Lake View',
      to: 'Emergency Care Center',
      status: 'completed',
      rating: 5,
      cost: 3200,
    },
  ];

  const benefits = [
    {
      title: 'Faster Access to Emergency Care',
      description: 'No manual searching for ambulances - the app does it instantly',
      icon: Clock,
      color: 'text-red-600',
    },
    {
      title: 'More Reliable Options',
      description: 'Choose between public/private services based on availability and cost',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Live Tracking',
      description: 'Track ambulance location in real-time, reducing panic and uncertainty',
      icon: MapPin,
      color: 'text-blue-600',
    },
    {
      title: 'Guided Emergency Support',
      description: 'Connect with doctors for immediate remote advice until ambulance arrives',
      icon: User,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-gray-900">Patient Dashboard</h2>
            <p className="text-gray-600">John Doe • +91 9876543210</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="text-blue-600" size={24} />
            <span className="text-blue-600">3</span>
          </div>
          <p className="text-gray-700">Total Bookings</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="text-green-600" size={24} />
            <span className="text-green-600">3</span>
          </div>
          <p className="text-gray-700">Completed</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="text-yellow-500" size={24} />
            <span className="text-yellow-500">4.7</span>
          </div>
          <p className="text-gray-700">Avg Rating Given</p>
        </div>
      </div>

      {/* Booking History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Booking History</h3>
        <div className="space-y-4">
          {bookingHistory.map((booking) => (
            <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-gray-900">{booking.ambulance}</h4>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {booking.date} • {booking.time}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < booking.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <p className="text-gray-900">
                    {booking.cost === 0 ? 'Free' : `₹${booking.cost}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-green-600 mt-1" />
                  <div>
                    <p className="text-gray-600 text-sm">From</p>
                    <p className="text-gray-900 text-sm">{booking.from}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-red-600 mt-1" />
                  <div>
                    <p className="text-gray-600 text-sm">To</p>
                    <p className="text-gray-900 text-sm">{booking.to}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-gray-400" />
                  <span className="text-gray-700 text-sm">{booking.incidentType}</span>
                </div>
                <span className="text-gray-600 text-sm">{booking.vehicleNumber}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MediGo Benefits */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">MediGo Benefits for Patients</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex gap-4">
              <div className={`${benefit.color} mt-1`}>
                <benefit.icon size={24} />
              </div>
              <div>
                <h4 className="text-gray-900 mb-1">{benefit.title}</h4>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Benefits Section */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Key Outcomes for Patients</h3>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
            <div>
              <p className="text-gray-900">Transparency & Trust</p>
              <p className="text-gray-600 text-sm">
                Live tracking reduces panic and uncertainty during emergencies
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
            <div>
              <p className="text-gray-900">Comprehensive Medical Support</p>
              <p className="text-gray-600 text-sm">
                Beyond emergency transport - blood, organ, and medical equipment delivery
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
            <div>
              <p className="text-gray-900">Cost Control</p>
              <p className="text-gray-600 text-sm">
                Filter by price to find affordable private services or use free public options
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
            <div>
              <p className="text-gray-900">Remote Medical Guidance</p>
              <p className="text-gray-600 text-sm">
                Connect with doctors for immediate advice while waiting for the ambulance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-red-600 text-white rounded-lg shadow-md p-6">
        <h3 className="mb-4">Emergency Contacts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="mb-2">Ambulance</p>
            <p className="text-xl">108</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="mb-2">Police</p>
            <p className="text-xl">100</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="mb-2">Fire</p>
            <p className="text-xl">101</p>
          </div>
        </div>
      </div>
    </div>
  );
}

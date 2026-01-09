import { User, Phone, Mail, Ambulance, Award, Clock, MapPin, Star, Settings, LogOut } from 'lucide-react';

export function DriverProfile() {
  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-700 text-white rounded-b-3xl p-6 shadow-lg mx-0 -mt-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <User size={40} />
          </div>
          <div className="flex-1">
            <h2 className="text-white mb-1">John Smith</h2>
            <p className="text-red-100 text-sm">Driver • AMB-003</p>
            <p className="text-red-100 text-sm">ID: DRV-12345</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl mb-1">284</p>
            <p className="text-red-100 text-xs">Transfers</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="fill-yellow-300 text-yellow-300" size={16} />
              <p className="text-2xl">4.9</p>
            </div>
            <p className="text-red-100 text-xs">Rating</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl mb-1">3.2</p>
            <p className="text-red-100 text-xs">Years</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl p-4 shadow-md space-y-3">
          <h4 className="text-gray-900">Contact Information</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Phone className="text-gray-400" size={20} />
              <div>
                <p className="text-gray-600 text-xs">Phone</p>
                <p className="text-gray-900">+94 77 123 4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail className="text-gray-400" size={20} />
              <div>
                <p className="text-gray-600 text-xs">Email</p>
                <p className="text-gray-900">john.smith@medigo.lk</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Ambulance className="text-gray-400" size={20} />
              <div>
                <p className="text-gray-600 text-xs">Assigned Ambulance</p>
                <p className="text-gray-900">AMB-003</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <h4 className="text-gray-900 mb-3">Certifications & Licenses</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <Award className="text-green-600" size={20} />
              <div className="flex-1">
                <p className="text-gray-900">Professional Driving License</p>
                <p className="text-gray-600 text-xs">Valid until: Dec 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <Award className="text-blue-600" size={20} />
              <div className="flex-1">
                <p className="text-gray-900">Emergency Medical Technician</p>
                <p className="text-gray-600 text-xs">Certified 2022</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
              <Award className="text-purple-600" size={20} />
              <div className="flex-1">
                <p className="text-gray-900">First Aid & CPR</p>
                <p className="text-gray-600 text-xs">Renewed Oct 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <h4 className="text-gray-900 mb-3">Performance Statistics</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="text-gray-400" size={20} />
                <span className="text-gray-700">Avg Response Time</span>
              </div>
              <span className="text-gray-900">4.2 mins</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <MapPin className="text-gray-400" size={20} />
                <span className="text-gray-700">Total Distance</span>
              </div>
              <span className="text-gray-900">4,582 km</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Award className="text-gray-400" size={20} />
                <span className="text-gray-700">Success Rate</span>
              </div>
              <span className="text-green-600">99.6%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="mx-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4">
          <h4 className="text-gray-900 mb-3">This Month</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-600 text-sm">Transfers</p>
              <p className="text-gray-900">42</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Hours</p>
              <p className="text-gray-900">156</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Distance</p>
              <p className="text-gray-900">687 km</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Rating</p>
              <div className="flex items-center gap-1">
                <Star className="fill-yellow-400 text-yellow-400" size={14} />
                <p className="text-gray-900">4.9</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <h4 className="text-gray-900 mb-3">Recent Achievements</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white">
                🏆
              </div>
              <div>
                <p className="text-gray-900 text-sm">100 Transfers Milestone</p>
                <p className="text-gray-600 text-xs">Earned 3 months ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-white">
                ⭐
              </div>
              <div>
                <p className="text-gray-900 text-sm">Perfect Month</p>
                <p className="text-gray-600 text-xs">100% on-time last month</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white">
                👍
              </div>
              <div>
                <p className="text-gray-900 text-sm">Excellent Service</p>
                <p className="text-gray-600 text-xs">25 five-star ratings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <h4 className="text-gray-900 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <Settings className="text-gray-400" size={20} />
                <span className="text-gray-900">Settings</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <Award className="text-gray-400" size={20} />
                <span className="text-gray-900">View All Achievements</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <Phone className="text-gray-400" size={20} />
                <span className="text-gray-900">Contact Support</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mx-4 mb-4">
        <button className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 p-4 rounded-2xl shadow-md active:scale-95 transition-transform">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

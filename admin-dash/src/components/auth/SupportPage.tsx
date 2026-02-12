import { useState } from 'react';
import { Mail, MessageSquare, Phone, Send, ChevronRight, HelpCircle, LifeBuoy } from 'lucide-react';

interface SupportPageProps {
  onBackToLogin: () => void;
}

export function SupportPage({ onBackToLogin }: SupportPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Technical Issue',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for sending support ticket would go here
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Support Info & FAQs */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="MediGo Logo" className="h-16 w-auto" />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Support Center</h2>
                <p className="text-gray-600">
                  Our dedicated support team is here to help you manage your emergency operations without interruption.
                </p>
              </div>

              <div className="space-y-4">
                <div className="group flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-red-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                    <HelpCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 font-medium">Knowledge Base</h4>
                    <p className="text-gray-500 text-sm">Read tutorials and system documentation.</p>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-red-600" size={20} />
                </div>

                <div className="group flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <LifeBuoy size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 font-medium">System Status</h4>
                    <p className="text-gray-500 text-sm">Check real-time server and GPS availability.</p>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-blue-600" size={20} />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <p className="text-gray-900 font-semibold mb-3">Direct Contact</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} className="text-red-600" /> +1 (555) MEDI-GO
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} className="text-red-600" /> support@medigo.com
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <img src="/logo.png" alt="MediGo Logo" className="h-12 w-auto" />
            </div>

            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                <p className="text-gray-600 mb-8">Your ticket #8429 has been created. A support agent will respond shortly.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-red-600 font-medium hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-gray-900 text-2xl font-bold mb-2">Contact Us</h2>
                  <p className="text-gray-600">Submit a ticket and we'll get back to you within 12 hours.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-gray-700 mb-1.5 text-sm font-medium">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1.5 text-sm font-medium">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                        placeholder="admin@hospital.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1.5 text-sm font-medium">Subject</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none appearance-none bg-white"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      >
                        <option>Technical Issue</option>
                        <option>Billing / Account</option>
                        <option>Feature Request</option>
                        <option>Emergency Access</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1.5 text-sm font-medium">How can we help?</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none resize-none"
                      placeholder="Please provide details about your issue..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <button
                onClick={onBackToLogin}
                className="text-gray-500 hover:text-red-600 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                <ChevronRight className="rotate-180" size={16} />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import 'package:flutter/material.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text("Privacy Policy", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.red.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeaderCard(),
            const SizedBox(height: 20),
            _buildLastUpdatedBadge(),
            const SizedBox(height: 20),
            _buildExpandableSection(
              icon: Icons.info_outline,
              iconColor: Colors.blue,
              title: "1. Information We Collect",
              content:
                  "We collect personal information such as name, email address, "
                  "phone number, vehicle details, and profile photo when you "
                  "register and use the MediGo Driver Application. This information "
                  "helps us provide you with a personalized experience and ensure "
                  "the safety and security of our services.",
            ),
            _buildExpandableSection(
              icon: Icons.location_on_outlined,
              iconColor: Colors.red,
              title: "2. Location Information",
              content:
                  "MediGo uses your real-time location to provide navigation, "
                  "ride tracking, and nearby service features. Location data "
                  "is only used while the app is active and is essential for "
                  "connecting you with patients who need ambulance services. "
                  "You can control location permissions through your device settings.",
            ),
            _buildExpandableSection(
              icon: Icons.settings_outlined,
              iconColor: Colors.orange,
              title: "3. How We Use Your Information",
              content:
                  "We use your data to:\n"
                  "- Provide and improve our services\n"
                  "- Enable ride matching and navigation\n"
                  "- Process payments and maintain records\n"
                  "- Ensure safety and security\n"
                  "- Communicate important updates\n"
                  "- Analyze app performance and user experience",
            ),
            _buildExpandableSection(
              icon: Icons.security_outlined,
              iconColor: Colors.green,
              title: "4. Data Security",
              content:
                  "Your data is securely stored using Firebase services with "
                  "industry-standard encryption. We implement appropriate technical "
                  "and organizational measures to protect your information from "
                  "unauthorized access, disclosure, alteration, or destruction. "
                  "However, no method of transmission over the internet is 100% secure.",
            ),
            _buildExpandableSection(
              icon: Icons.share_outlined,
              iconColor: Colors.purple,
              title: "5. Data Sharing",
              content:
                  "We do not sell or rent your personal data to third parties. "
                  "Your information may be shared only in the following circumstances:\n"
                  "- With patients to facilitate ride services\n"
                  "- When required by law or legal process\n"
                  "- To protect the rights and safety of our users\n"
                  "- With service providers who assist in app operations",
            ),
            _buildExpandableSection(
              icon: Icons.gavel_outlined,
              iconColor: Colors.indigo,
              title: "6. Your Rights",
              content:
                  "You have the right to:\n"
                  "- Access your personal information\n"
                  "- Update or correct your data\n"
                  "- Delete your account and associated data\n"
                  "- Opt-out of non-essential communications\n"
                  "- Control location permissions\n\n"
                  "You can exercise these rights through the application settings "
                  "or by contacting our support team.",
            ),
            _buildExpandableSection(
              icon: Icons.contact_support_outlined,
              iconColor: Colors.teal,
              title: "7. Contact Us",
              content:
                  "If you have questions, concerns, or requests regarding this "
                  "Privacy Policy or your personal data, please contact our "
                  "support team through:\n\n"
                  "- Email: support@medigo.com\n"
                  "- Phone: +94 11 234 5678\n"
                  "- Settings > Contact Support\n\n"
                  "We will respond to your inquiry within 48 hours.",
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade700,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 2,
                ),
                icon: const Icon(Icons.check_circle_outline),
                label: const Text(
                  "I Understand",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.shade700, Colors.red.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
        ],
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.privacy_tip, color: Colors.white, size: 32),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  "MediGo Privacy Policy",
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Text(
            "We value your privacy and are committed to protecting your personal information. "
            "Please read this policy to understand how we collect, use, and safeguard your data.",
            style: TextStyle(fontSize: 14, color: Colors.white70, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildLastUpdatedBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.calendar_today, size: 16, color: Colors.blue.shade700),
          const SizedBox(width: 8),
          Text(
            "Last updated: February 24, 2026",
            style: TextStyle(
              fontSize: 13,
              color: Colors.blue.shade700,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExpandableSection({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String content,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Theme(
        data: ThemeData().copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          title: Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(
                content,
                style: TextStyle(fontSize: 14, height: 1.6, color: Colors.grey.shade800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

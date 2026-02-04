import 'package:flutter/material.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Privacy Policy"),
        backgroundColor: Colors.red.shade500,
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),

        child: Container(
          padding: const EdgeInsets.all(20),

          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 6,
                offset: Offset(0, 3),
              ),
            ],
          ),

          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "MediGo Privacy Policy",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),

              SizedBox(height: 12),

              Text(
                "Last updated: February 2026",
                style: TextStyle(color: Colors.grey),
              ),

              SizedBox(height: 20),

              sectionTitle("1. Information We Collect"),
              sectionText(
                "We collect personal information such as name, email address, "
                "phone number, vehicle details, and profile photo when you "
                "register and use the MediGo Driver Application.",
              ),

              sectionTitle("2. Location Information"),
              sectionText(
                "MediGo uses your real-time location to provide navigation, "
                "ride tracking, and nearby service features. Location data "
                "is only used while the app is active.",
              ),

              sectionTitle("3. How We Use Your Information"),
              sectionText(
                "We use your data to provide services, improve app performance, "
                "support navigation, ensure safety, and communicate important updates.",
              ),

              sectionTitle("4. Data Security"),
              sectionText(
                "Your data is securely stored using Firebase services. "
                "We take reasonable steps to protect your information from "
                "unauthorized access.",
              ),

              sectionTitle("5. Data Sharing"),
              sectionText(
                "We do not sell or rent your personal data to third parties. "
                "Data may only be shared when required by law or to provide "
                "essential application services.",
              ),

              sectionTitle("6. Your Rights"),
              sectionText(
                "You may update or delete your account information at any time "
                "through the application settings.",
              ),

              sectionTitle("7. Contact Us"),
              sectionText(
                "If you have questions about this Privacy Policy, please contact "
                "our support team through the MediGo application.",
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ===== UI Helpers =====

  static Widget sectionTitle(String text) {
    return Padding(
      padding: EdgeInsets.only(top: 14, bottom: 6),
      child: Text(
        text,
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
      ),
    );
  }

  static Widget sectionText(String text) {
    return Text(text, style: TextStyle(fontSize: 14, height: 1.5));
  }
}

import 'package:flutter/material.dart';

class FaqPage extends StatelessWidget {
  const FaqPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("FAQ"),
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
              const Text(
                "Frequently Asked Questions",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 12),

              const Text(
                "Find answers to common questions about MediGo Driver App.",
                style: TextStyle(color: Colors.grey),
              ),

              const SizedBox(height: 20),

              faqQuestion("1. How do I create a MediGo Driver account?"),
              faqAnswer(
                "You can create an account by registering with your email address "
                "and completing your driver profile in the application.",
              ),

              faqQuestion("2. Why does MediGo need my location?"),
              faqAnswer(
                "Your location is required to provide navigation services, "
                "track rides, and display nearby service requests.",
              ),

              faqQuestion("3. How can I change my profile information?"),
              faqAnswer(
                "Go to Settings → Edit Profile to update your personal and "
                "vehicle information.",
              ),

              faqQuestion(
                "4. What should I do if the app is not working properly?",
              ),
              faqAnswer(
                "Try clearing the cache from Settings. If the problem continues, "
                "restart the app or contact support.",
              ),

              faqQuestion("5. How do I logout from the app?"),
              faqAnswer(
                "Open Settings and tap on the Logout button at the bottom of the page.",
              ),

              faqQuestion("6. Is my personal data safe?"),
              faqAnswer(
                "Yes. MediGo uses secure Firebase services to protect your data "
                "and follows standard security practices.",
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ===== UI HELPERS =====

  static Widget faqQuestion(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 6),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
      ),
    );
  }

  static Widget faqAnswer(String text) {
    return Text(text, style: const TextStyle(fontSize: 14, height: 1.5));
  }
}

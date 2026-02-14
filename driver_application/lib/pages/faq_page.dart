import 'package:flutter/material.dart';

class FaqPage extends StatefulWidget {
  const FaqPage({super.key});

  @override
  State<FaqPage> createState() => _FaqPageState();
}

class _FaqPageState extends State<FaqPage> {
  String searchQuery = '';
  String selectedCategory = 'all';

  // FAQ Data organized by category
  final Map<String, List<Map<String, String>>> faqData = {
    'getting_started': [
      {
        'question': 'How do I create a MediGo Driver account?',
        'answer':
            'You can create an account by downloading the MediGo Driver app, '
            'tapping "Sign Up", and completing the registration form with your '
            'email, phone number, and vehicle details. You\'ll need to verify '
            'your email and upload required documents for approval.',
      },
      {
        'question': 'What documents do I need to register?',
        'answer':
            'You need a valid driver\'s license, vehicle registration, '
            'insurance documents, and a profile photo. All documents must be '
            'current and clearly readable.',
      },
      {
        'question': 'How long does account verification take?',
        'answer':
            'Account verification typically takes 24-48 hours. You\'ll receive '
            'an email notification once your account is approved and ready to use.',
      },
    ],
    'using_app': [
      {
        'question': 'Why does MediGo need my location?',
        'answer':
            'Your location is required to provide navigation services, '
            'track rides in real-time, display nearby service requests, and '
            'ensure accurate pickup and drop-off locations. Location is only '
            'used while the app is active.',
      },
      {
        'question': 'How do I accept a ride request?',
        'answer':
            'When a ride request appears, review the pickup location, destination, '
            'and patient details. Tap "Accept" to confirm. You\'ll then receive '
            'navigation directions to the pickup location.',
      },
      {
        'question': 'Can I cancel a ride after accepting?',
        'answer':
            'Yes, but frequent cancellations may affect your driver rating. '
            'To cancel, tap the "Cancel Ride" button and select a reason. '
            'Try to cancel only when absolutely necessary.',
      },
    ],
    'settings': [
      {
        'question': 'How can I change my profile information?',
        'answer':
            'Go to Settings → Edit Profile to update your personal information, '
            'vehicle details, profile photo, and contact information. Changes '
            'are saved automatically.',
      },
      {
        'question': 'How do I change my password?',
        'answer':
            'Navigate to Settings → Edit Profile, scroll to the password section, '
            'enter your current password, then enter and confirm your new password. '
            'Tap "Update Profile" to save changes.',
      },
      {
        'question': 'How do I enable or disable notifications?',
        'answer':
            'Go to Settings → Preferences and toggle the "Enable Notifications" '
            'switch. You can also manage notification permissions in your device settings.',
      },
    ],
    'privacy': [
      {
        'question': 'Is my personal data safe?',
        'answer':
            'Yes. MediGo uses secure Firebase services with industry-standard '
            'encryption to protect your data. We follow strict security practices '
            'and never sell your personal information to third parties.',
      },
      {
        'question': 'Who can see my location?',
        'answer':
            'Your real-time location is only visible to patients you\'re currently '
            'serving and MediGo support staff for safety purposes. Your location '
            'history is private and not shared with other drivers.',
      },
      {
        'question': 'Can I delete my account?',
        'answer':
            'Yes, you can request account deletion by contacting support through '
            'Settings → Contact Support. All your personal data will be permanently '
            'deleted within 30 days, except data required for legal compliance.',
      },
    ],
    'payments': [
      {
        'question': 'How do I receive payments?',
        'answer':
            'Payments are processed automatically after each completed ride. '
            'Earnings are deposited to your registered bank account weekly. '
            'You can view your earnings history in the app.',
      },
      {
        'question': 'When will I get paid?',
        'answer':
            'Payments are processed every Monday for rides completed in the previous '
            'week (Monday to Sunday). It may take 2-3 business days for the funds '
            'to appear in your bank account.',
      },
    ],
    'troubleshooting': [
      {
        'question': 'What should I do if the app is not working properly?',
        'answer':
            'First, try clearing the cache from Settings → Clear Cache. If the '
            'problem persists, restart the app or reinstall it. For ongoing issues, '
            'contact support with details about the problem.',
      },
      {
        'question': 'The app keeps crashing, what should I do?',
        'answer':
            'Ensure you have the latest version of the app installed. Clear the '
            'app cache, restart your device, and check your internet connection. '
            'If crashes continue, contact support with your device model and app version.',
      },
      {
        'question': 'How do I logout from the app?',
        'answer':
            'Open Settings and tap on the "Logout" button at the bottom of the page. '
            'Confirm your choice in the dialog. You can log back in anytime with '
            'your email and password.',
      },
    ],
  };

  List<Map<String, dynamic>> get filteredFAQs {
    List<Map<String, dynamic>> allFAQs = [];

    faqData.forEach((category, questions) {
      if (selectedCategory == 'all' || selectedCategory == category) {
        for (var faq in questions) {
          allFAQs.add({
            'category': category,
            'question': faq['question']!,
            'answer': faq['answer']!,
          });
        }
      }
    });

    if (searchQuery.isNotEmpty) {
      allFAQs = allFAQs.where((faq) {
        return faq['question']
                .toString()
                .toLowerCase()
                .contains(searchQuery.toLowerCase()) ||
            faq['answer']
                .toString()
                .toLowerCase()
                .contains(searchQuery.toLowerCase());
      }).toList();
    }

    return allFAQs;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          "FAQ",
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.red.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Header Card
          _buildHeaderCard(),

          // Search Bar
          _buildSearchBar(),

          // Category Filters
          _buildCategoryFilters(),

          // FAQ List
          Expanded(
            child: filteredFAQs.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredFAQs.length,
                    itemBuilder: (context, index) {
                      final faq = filteredFAQs[index];
                      return _buildFAQItem(
                        question: faq['question'],
                        answer: faq['answer'],
                        category: faq['category'],
                      );
                    },
                  ),
          ),

          // Contact Support Button
          _buildContactSupportButton(),
        ],
      ),
    );
  }

  // ================= HEADER CARD =================

  Widget _buildHeaderCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.shade700, Colors.red.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: const Row(
        children: [
          Icon(
            Icons.help_outline,
            color: Colors.white,
            size: 32,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Frequently Asked Questions",
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  "Find answers to common questions",
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ================= SEARCH BAR =================

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search FAQs...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    setState(() {
                      searchQuery = '';
                    });
                  },
                )
              : null,
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
        onChanged: (value) {
          setState(() {
            searchQuery = value;
          });
        },
      ),
    );
  }

  // ================= CATEGORY FILTERS =================

  Widget _buildCategoryFilters() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _buildCategoryChip('all', 'All', Icons.apps),
          _buildCategoryChip(
              'getting_started', 'Getting Started', Icons.rocket_launch),
          _buildCategoryChip('using_app', 'Using App', Icons.directions_car),
          _buildCategoryChip('settings', 'Settings', Icons.settings),
          _buildCategoryChip('privacy', 'Privacy', Icons.security),
          _buildCategoryChip('payments', 'Payments', Icons.payments),
          _buildCategoryChip('troubleshooting', 'Help', Icons.help),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String category, String label, IconData icon) {
    final isSelected = selectedCategory == category;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : Colors.grey.shade700,
            ),
            const SizedBox(width: 6),
            Text(label),
          ],
        ),
        onSelected: (selected) {
          setState(() {
            selectedCategory = category;
          });
        },
        selectedColor: Colors.red.shade700,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.grey.shade700,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        backgroundColor: Colors.white,
        elevation: 2,
      ),
    );
  }

  // ================= FAQ ITEM =================

  Widget _buildFAQItem({
    required String question,
    required String answer,
    required String category,
  }) {
    final categoryInfo = _getCategoryInfo(category);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Theme(
        data: ThemeData().copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: categoryInfo['color'].withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              categoryInfo['icon'],
              color: categoryInfo['color'],
              size: 24,
            ),
          ),
          title: Text(
            question,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(
                answer,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.6,
                  color: Colors.grey.shade800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Map<String, dynamic> _getCategoryInfo(String category) {
    switch (category) {
      case 'getting_started':
        return {'icon': Icons.rocket_launch, 'color': Colors.blue};
      case 'using_app':
        return {'icon': Icons.directions_car, 'color': Colors.orange};
      case 'settings':
        return {'icon': Icons.settings, 'color': Colors.purple};
      case 'privacy':
        return {'icon': Icons.security, 'color': Colors.green};
      case 'payments':
        return {'icon': Icons.payments, 'color': Colors.teal};
      case 'troubleshooting':
        return {'icon': Icons.help, 'color': Colors.red};
      default:
        return {'icon': Icons.help_outline, 'color': Colors.grey};
    }
  }

  // ================= EMPTY STATE =================

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'No FAQs found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or category filter',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ================= CONTACT SUPPORT BUTTON =================

  Widget _buildContactSupportButton() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red.shade700,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 2,
          ),
          icon: const Icon(Icons.contact_support),
          label: const Text(
            "Still Need Help? Contact Support",
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
          onPressed: () {
            // Navigate back and show contact support
            Navigator.pop(context);
            // Could also open email or support page
          },
        ),
      ),
    );
  }
}

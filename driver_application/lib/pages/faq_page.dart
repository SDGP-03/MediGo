import 'package:driver_application/pages/contact_support_page.dart';
import 'package:driver_application/widgets/side_menu.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FaqPage extends StatefulWidget {
  const FaqPage({super.key});

  @override
  State<FaqPage> createState() => _FaqPageState();
}

class _FaqPageState extends State<FaqPage> {
  final TextEditingController _searchController = TextEditingController();
  String searchQuery = '';
  String selectedCategory = 'all';
  bool _isSinhala = false;

  String t(String en, String si) => _isSinhala ? si : en;

  final Map<String, List<Map<String, String>>> faqDataEnglish = {
    'getting_started': [
      {
        'question': 'How do I create a MediGo Driver account?',
        'answer':
            'You can create an account by downloading the MediGo Driver app, '
            'tapping "Sign Up", and completing the registration form with your '
            'email, phone number, and vehicle details. You need to verify '
            'your email and upload required documents for approval.',
      },
      {
        'question': 'What documents do I need to register?',
        'answer':
            'You need a valid driver license, vehicle registration, insurance '
            'documents, and a profile photo. All documents must be current and readable.',
      },
      {
        'question': 'How long does account verification take?',
        'answer':
            'Account verification typically takes 24-48 hours. You receive an email '
            'notification once your account is approved and ready to use.',
      },
    ],
    'using_app': [
      {
        'question': 'Why does MediGo need my location?',
        'answer':
            'Your location is required to provide navigation services, track rides '
            'in real-time, display nearby service requests, and ensure accurate pickup '
            'and drop-off locations. Location is only used while the app is active.',
      },
      {
        'question': 'How do I accept a ride request?',
        'answer':
            'When a ride request appears, review the pickup location, destination, '
            'and patient details. Tap "Accept" to confirm and receive navigation '
            'directions to the pickup location.',
      },
      {
        'question': 'Can I cancel a ride after accepting?',
        'answer':
            'Yes, but frequent cancellations may affect your driver rating. '
            'Tap "Cancel Ride" and select a reason. Cancel only when necessary.',
      },
    ],
    'settings': [
      {
        'question': 'How can I change my profile information?',
        'answer':
            'Go to Settings -> Edit Profile to update personal information, '
            'vehicle details, profile photo, and contact information.',
      },
      {
        'question': 'How do I change my password?',
        'answer':
            'Navigate to Settings -> Edit Profile, scroll to the password section, '
            'enter your current password, then enter and confirm your new password. '
            'Tap "Save Changes".',
      },
      {
        'question': 'How do I enable or disable notifications?',
        'answer':
            'Go to Settings -> Preferences and toggle "Notifications". '
            'You can also manage permissions in your device settings.',
      },
    ],
    'privacy': [
      {
        'question': 'Is my personal data safe?',
        'answer':
            'Yes. MediGo uses secure Firebase services with industry-standard '
            'encryption and strict data handling practices.',
      },
      {
        'question': 'Who can see my location?',
        'answer':
            'Your real-time location is visible only to patients you are currently '
            'serving and MediGo support staff for operational safety.',
      },
      {
        'question': 'Can I delete my account?',
        'answer':
            'Yes, request account deletion through Settings -> Contact Support. '
            'Personal data is deleted according to policy and legal requirements.',
      },
    ],
    'payments': [
      {
        'question': 'How do I receive payments?',
        'answer':
            'Payments are processed after completed rides and paid out to your '
            'registered account on the payout schedule.',
      },
      {
        'question': 'When will I get paid?',
        'answer':
            'Payments are generally processed weekly. Bank posting times may vary.',
      },
    ],
    'troubleshooting': [
      {
        'question': 'What should I do if the app is not working properly?',
        'answer':
            'Try clearing cache from Settings -> Clear Cache, restart the app, '
            'and check your internet connection. Contact support if the issue persists.',
      },
      {
        'question': 'The app keeps crashing, what should I do?',
        'answer':
            'Ensure you are on the latest app version, clear cache, restart your device, '
            'and contact support with your device model if crashes continue.',
      },
      {
        'question': 'How do I logout from the app?',
        'answer':
            'Open Settings and tap "Logout" at the bottom of the page, then confirm.',
      },
    ],
  };

  final Map<String, List<Map<String, String>>> faqDataSinhala = {
    'getting_started': [
      {
        'question': 'MediGo Driver ගිණුමක් හදන්නේ කොහොමද?',
        'answer':
            'MediGo Driver app එක download කර "Sign Up" ඔබා ලියාපදිංචි පෝරමය '
            'පුරවන්න. ඊමේල්, දුරකථන අංකය සහ වාහන තොරතුරු දාන්න. '
            'ඊමේල් තහවුරු කර අවශ්‍ය ලේඛන upload කළාම අනුමැතිය ලැබේ.',
      },
      {
        'question': 'ලියාපදිංචියට ඕනේ ලේඛන මොනවාද?',
        'answer':
            'වලංගු රියදුරු බලපත්‍රය, වාහන ලියාපදිංචි ලේඛන, රක්ෂණ ලේඛන සහ '
            'පැතිකඩ පින්තූරයක් ඕනේ. ලේඛන පැහැදිලි සහ යාවත්කාලීන විය යුතුයි.',
      },
      {
        'question': 'ගිණුම් තහවුරු කිරීමට කොච්චර වෙලාවක් යනවද?',
        'answer':
            'සාමාන්‍යයෙන් පැය 24-48ක් යයි. ගිණුම අනුමත වුණාම ඊමේල් පණිවිඩයක් '
            'එවනු ලැබේ.',
      },
    ],
    'using_app': [
      {
        'question': 'MediGoට මගේ location එක ඕනේ ඇයි?',
        'answer':
            'මාර්ග පෙන්වීම, ගමන් ලුහුබැඳීම, ලඟම සේවා ඉල්ලීම් පෙන්වීම සහ '
            'නිවැරදි pickup/drop-off තැන් සඳහා location ඕනේ. '
            'යෙදුම භාවිතා කරන විට පමණක් ඒක භාවිතා වෙනවා.',
      },
      {
        'question': 'ride request එක accept කරන්නේ කොහොමද?',
        'answer':
            'request එක එනකොට pickup තැන, ගමනාන්තය සහ රෝගියාගේ තොරතුරු බලන්න. '
            '"Accept" ඔබා අනුමත කරන්න. පසුව pickup තැනට යන මාර්ගය ලැබේ.',
      },
      {
        'question': 'request එක accept කරලා පස්සේ cancel කරන්න පුළුවන්ද?',
        'answer':
            'ඔව්, පුළුවන්. හැබැයි නිතර cancel කළොත් driver rating එකට බලපෑම් '
            'වෙන්න පුළුවන්. අවශ්‍ය වුනොත් පමණක් "Cancel Ride" කරන්න.',
      },
    ],
    'settings': [
      {
        'question': 'මගේ profile තොරතුරු වෙනස් කරන්නේ කොහොමද?',
        'answer':
            'Settings -> Edit Profile වෙත ගිහින් පුද්ගලික තොරතුරු, වාහන තොරතුරු, '
            'පැතිකඩ පින්තූරය සහ සම්බන්ධතා තොරතුරු යාවත්කාලීන කරන්න.',
      },
      {
        'question': 'මුරපදය වෙනස් කරන්නේ කොහොමද?',
        'answer':
            'Settings -> Edit Profile වෙත ගිහින් password කොටසට යන්න. '
            'වත්මන් මුරපදය සහ නව මුරපදය දාලා "Save Changes" ඔබන්න.',
      },
      {
        'question': 'notifications on/off කරන්නේ කොහොමද?',
        'answer':
            'Settings -> Preferences වෙත ගිහින් "Notifications" toggle කරන්න. '
            'අවශ්‍ය නම් දුරකථන settings වලින් permissions වෙනස් කරන්න.',
      },
    ],
    'privacy': [
      {
        'question': 'මගේ පෞද්ගලික දත්ත ආරක්ෂිතද?',
        'answer':
            'ඔව්. MediGo ආරක්ෂිත Firebase සේවා, encryption සහ දැඩි දත්ත '
            'පරිහරණ ක්‍රම භාවිතා කරයි.',
      },
      {
        'question': 'මගේ location එක කවුද බලන්නෙ?',
        'answer':
            'ඔබ සේවය කරන රෝගීන්ට සහ ආරක්ෂාව සඳහා MediGo support කණ්ඩායමට '
            'පමණක් real-time location පෙන්වයි.',
      },
      {
        'question': 'මගේ account එක delete කරන්න පුළුවන්ද?',
        'answer':
            'ඔව්. Settings -> Contact Support හරහා account deletion ඉල්ලීමක් '
            'දෙන්න. නීතිමය හා ප්‍රතිපත්ති අනුව දත්ත ඉවත් කරයි.',
      },
    ],
    'payments': [
      {
        'question': 'ගෙවීම් ලැබෙන්නේ කොහොමද?',
        'answer':
            'ගමන් අවසන් වුණාම ගෙවීම් process කර ඔබ ලියාපදිංචි කර ඇති ගිණුමට '
            'pay-out සැලසුම අනුව යවයි.',
      },
      {
        'question': 'මට ගෙවීම ලැබෙන්නේ කවදාද?',
        'answer':
            'සාමාන්‍යයෙන් සතියකට වරක් ගෙවීම් process කරයි. '
            'බැංකු ක්‍රියාවලිය අනුව කාලය ටිකක් වෙනස් වෙන්න පුළුවන්.',
      },
    ],
    'troubleshooting': [
      {
        'question': 'app එක හරියට වැඩ නොකළොත් මොකද්ද කරන්න ඕනේ?',
        'answer':
            'Settings -> Clear Cache මගින් cache ඉවත් කර app එක restart කරන්න. '
            'internet connection එකත් බලන්න. ගැටලුව තියෙනවානම් support අමතන්න.',
      },
      {
        'question': 'app එක නිතර crash වෙනවා. මොකද්ද කරන්න?',
        'answer':
            'ඔබට latest app version තියෙනවද බලන්න. cache clear කර device restart කරන්න. '
            'තවමත් crash වෙනවානම් device model එකත් එක්ක support අමතන්න.',
      },
      {
        'question': 'app එකෙන් logout වෙන්නේ කොහොමද?',
        'answer':
            'Settings විවෘත කර පහලින් "Logout" ඔබන්න. පසුව confirm කරන්න.',
      },
    ],
  };

  Map<String, List<Map<String, String>>> get faqData =>
      _isSinhala ? faqDataSinhala : faqDataEnglish;

  @override
  void initState() {
    super.initState();
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _isSinhala = prefs.getString('language') == 'Sinhala';
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get filteredFAQs {
    List<Map<String, dynamic>> allFAQs = [];

    faqData.forEach((category, questions) {
      if (selectedCategory == 'all' || selectedCategory == category) {
        for (final faq in questions) {
          allFAQs.add({
            'category': category,
            'question': faq['question']!,
            'answer': faq['answer']!,
          });
        }
      }
    });

    if (searchQuery.isNotEmpty) {
      final normalized = searchQuery.toLowerCase();
      allFAQs = allFAQs.where((faq) {
        return faq['question'].toString().toLowerCase().contains(normalized) ||
            faq['answer'].toString().toLowerCase().contains(normalized);
      }).toList();
    }

    return allFAQs;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const SideMenu(currentRoute: '/faq'),
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              final scaffoldState = Scaffold.maybeOf(context);
              if (scaffoldState?.hasDrawer ?? false) {
                scaffoldState!.openDrawer();
              } else {
                Navigator.maybePop(context);
              }
            },
          ),
        ),
        title: Text(
          t("FAQ", "නිතර අහන ප්‍රශ්න"),
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.red.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Column(
        children: [
          _buildHeaderCard(),
          _buildSearchBar(),
          _buildCategoryFilters(),
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
          _buildContactSupportButton(),
        ],
      ),
    );
  }

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
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Icon(Icons.help_outline, color: Colors.white, size: 32),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t("Frequently Asked Questions", "නිතර අහන ප්‍රශ්න"),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  t(
                    "Find answers to common questions",
                    "සාමාන්‍ය ප්‍රශ්න වලට පිළිතුරු බලන්න",
                  ),
                  style: TextStyle(fontSize: 14, color: Colors.white70),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: t('Search FAQs...', 'ප්‍රශ්න සොයන්න...'),
          prefixIcon: const Icon(Icons.search),
          suffixIcon: searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => searchQuery = '');
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
        onChanged: (value) => setState(() => searchQuery = value),
      ),
    );
  }

  Widget _buildCategoryFilters() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _buildCategoryChip('all', t('All', 'සියලු'), Icons.apps),
          _buildCategoryChip(
            'getting_started',
            t('Getting Started', 'ආරම්භය'),
            Icons.rocket_launch,
          ),
          _buildCategoryChip(
            'using_app',
            t('Using App', 'යෙදුම භාවිතය'),
            Icons.directions_car,
          ),
          _buildCategoryChip(
            'settings',
            t('Settings', 'සැකසුම්'),
            Icons.settings,
          ),
          _buildCategoryChip(
            'privacy',
            t('Privacy', 'පෞද්ගලිකතාව'),
            Icons.security,
          ),
          _buildCategoryChip(
            'payments',
            t('Payments', 'ගෙවීම්'),
            Icons.payments,
          ),
          _buildCategoryChip('troubleshooting', t('Help', 'උදව්'), Icons.help),
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
        onSelected: (_) => setState(() => selectedCategory = category),
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

  Widget _buildFAQItem({
    required String question,
    required String answer,
    required String category,
  }) {
    final categoryInfo = _getCategoryInfo(category);

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
              color: categoryInfo['color'].withValues(alpha: 0.1),
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
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
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

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              t('No FAQs found', 'ප්‍රශ්න හමු වුණේ නැහැ'),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              t(
                'Try adjusting your search or category filter',
                'සෙවුම හෝ ප්‍රවර්ග පෙරහන වෙනස් කර බලන්න',
              ),
              style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactSupportButton() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
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
          label: Text(
            t("Still Need Help? Contact Support", "තව උදව් ඕනේද? සහාය අමතන්න"),
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ContactSupportPage(),
              ),
            );
          },
        ),
      ),
    );
  }
}

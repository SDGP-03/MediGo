import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PrivacyPolicyPage extends StatefulWidget {
  const PrivacyPolicyPage({super.key});

  @override
  State<PrivacyPolicyPage> createState() => _PrivacyPolicyPageState();
}

class _PrivacyPolicyPageState extends State<PrivacyPolicyPage> {
  bool _isSinhala = false;

  String t(String en, String si) => _isSinhala ? si : en;

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
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text(t("Privacy Policy", "පෞද්ගලිකතා ප්‍රතිපත්තිය"), style: const TextStyle(color: Colors.white)),
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
              title: t("1. Information We Collect", "1. අපි එකතු කරන දත්ත"),
              content: t(
                "We collect your name, email, phone number, vehicle details, and profile photo when you register and use the app.",
                "ඔබ ලියාපදිංචි වන විට සහ යෙදුම භාවිතා කරන විට නම, ඊමේල්, දුරකථන අංකය, වාහන තොරතුරු සහ පැතිකඩ පින්තූරය එකතු කරනවා.",
              ),
            ),
            _buildExpandableSection(
              icon: Icons.location_on_outlined,
              iconColor: Colors.red,
              title: t("2. Location Information", "2. ස්ථාන තොරතුරු"),
              content: t(
                "MediGo uses real-time location for navigation, ride tracking, and nearby requests while the app is active.",
                "MediGo යෙදුම සක්‍රීය විට මාර්ගය, ගමන් ලුහුබැඳීම සහ ලඟම ඉල්ලීම් සඳහා ඔබගේ වත්මන් ස්ථානය භාවිතා කරනවා.",
              ),
            ),
            _buildExpandableSection(
              icon: Icons.settings_outlined,
              iconColor: Colors.orange,
              title: t("3. How We Use Your Information", "3. ඔබගේ දත්ත භාවිතා කරන ආකාරය"),
              content: t(
                "We use data to provide rides, improve the app, process payments, and keep services safe.",
                "ගමන් සේවාව ලබාදීමට, යෙදුම වැඩිදියුණු කිරීමට, ගෙවීම් කළමනාකරණයට සහ ආරක්ෂාවට ඔබගේ දත්ත භාවිතා කරනවා.",
              ),
            ),
            _buildExpandableSection(
              icon: Icons.security_outlined,
              iconColor: Colors.green,
              title: t("4. Data Security", "4. දත්ත ආරක්ෂාව"),
              content: t(
                "Your data is protected using secure systems and encryption, but no internet system is 100% risk-free.",
                "ඔබගේ දත්ත ආරක්ෂිත පද්ධති සහ ගුප්තකේතනයෙන් සුරකිනවා. එසේ වුවත් අන්තර්ජාල පද්ධතියක් 100% අවදානම් රහිත නොවේ.",
              ),
            ),
            _buildExpandableSection(
              icon: Icons.share_outlined,
              iconColor: Colors.purple,
              title: t("5. Data Sharing", "5. දත්ත බෙදාගැනීම"),
              content: t(
                "We do not sell your data. We only share when needed for service delivery, legal reasons, or user safety.",
                "අපි ඔබගේ දත්ත විකුණන්නේ නැහැ. සේවාව, නීතිමය අවශ්‍යතා හෝ ආරක්ෂාව සඳහා පමණක් බෙදාගන්නවා.",
              ),
            ),
            _buildExpandableSection(
              icon: Icons.gavel_outlined,
              iconColor: Colors.indigo,
              title: t("6. Your Rights", "6. ඔබගේ අයිතිවාසිකම්"),
              content: t(
                "You can view, update, or delete your data and control app permissions from settings.",
                "සැකසුම් හරහා ඔබගේ දත්ත බලන්න, යාවත්කාලීන කරන්න, ඉවත් කරන්න සහ අවසර පාලනය කරන්න ඔබට හැකියි.",
              ),
            ),
            _buildExpandableSection(
              icon: Icons.contact_support_outlined,
              iconColor: Colors.teal,
              title: t("7. Contact Us", "7. අප අමතන්න"),
              content: t(
                "If you have questions, contact support by email, phone, or Settings > Contact Support.",
                "ඔබට ප්‍රශ්න ඇත්නම් ඊමේල්, දුරකථනය හෝ සැකසුම් > සහාය අමතන්න මගින් සම්බන්ධ වන්න.",
              ),
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
                label: Text(
                  t("I Understand", "මට තේරුණා"),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.privacy_tip, color: Colors.white, size: 32),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  t("MediGo Privacy Policy", "MediGo පෞද්ගලිකතා ප්‍රතිපත්තිය"),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            t(
              "We value your privacy. Please read how we collect, use, and protect your personal information.",
              "අපි ඔබගේ පෞද්ගලිකතාවට වටිනාකම දෙනවා. දත්ත එකතු කරන, භාවිතා කරන සහ සුරකින ආකාරය මෙතැනින් බලන්න.",
            ),
            style: const TextStyle(fontSize: 14, color: Colors.white70, height: 1.5),
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
            t("Last updated: February 24, 2026", "අවසන් යාවත්කාලීන කිරීම: 2026 පෙබරවාරි 24"),
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

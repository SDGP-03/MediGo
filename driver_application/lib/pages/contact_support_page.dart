import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:driver_application/widgets/side_menu.dart';

class ContactSupportPage extends StatefulWidget {
  const ContactSupportPage({super.key});

  @override
  State<ContactSupportPage> createState() => _ContactSupportPageState();
}

class _ContactSupportPageState extends State<ContactSupportPage> {
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

  Future<void> _launchURL(BuildContext context, String url) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final Uri uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        messenger.showSnackBar(
          SnackBar(
            content: Text(
              t("Could not open this link", "මෙම ලින්ක් එක විවෘත කළේ නැහැ"),
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error launching URL: $e');
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            t("Failed to open support option", "සහාය විකල්පය විවෘත කළේ නැහැ"),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const SideMenu(currentRoute: '/contact-support'),
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
          t("Contact Support", "සහාය අමතන්න"),
          style: const TextStyle(color: Colors.white),
        ),
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
            const SizedBox(height: 24),
            _buildContactMethod(
              context: context,
              icon: Icons.email_outlined,
              iconColor: Colors.blue,
              title: t("Email Support", "ඊමේල් සහාය"),
              subtitle: "support@medigo.com",
              description: t(
                "Get a response within 24 hours",
                "පැය 24ක් ඇතුළත පිළිතුරක් ලැබේ",
              ),
              onTap: () => _launchURL(context, "mailto:support@medigo.com"),
            ),
            _buildContactMethod(
              context: context,
              icon: Icons.phone_outlined,
              iconColor: Colors.green,
              title: t("Phone Support", "දුරකථන සහාය"),
              subtitle: "+94 11 234 5678",
              description: t(
                "Available Mon-Fri, 9 AM - 6 PM",
                "සඳුදා-සිකුරාදා, පෙ.ව. 9 - ප.ව. 6",
              ),
              onTap: () => _launchURL(context, "tel:+94112345678"),
            ),
            _buildContactMethod(
              context: context,
              icon: Icons.chat_outlined,
              iconColor: Colors.purple,
              title: t("Live Chat", "සජීවී කතාබහ"),
              subtitle: t(
                "Chat with our support team",
                "අපේ සහාය කණ්ඩායම සමඟ කතා කරන්න",
              ),
              description: t(
                "Average response time: 5 minutes",
                "සාමාන්‍ය පිළිතුරු කාලය: මිනිත්තු 5",
              ),
              onTap: () {
                _showComingSoonDialog(context);
              },
            ),
            _buildContactMethod(
              context: context,
              icon: Icons.help_outline,
              iconColor: Colors.orange,
              title: "FAQ",
              subtitle: t(
                "Find answers to common questions",
                "සාමාන්‍ය ප්‍රශ්න වලට පිළිතුරු බලන්න",
              ),
              description: t(
                "Quick solutions to common issues",
                "සාමාන්‍ය ගැටලු වලට ඉක්මන් පිළිතුරු",
              ),
              onTap: () => Navigator.pushNamed(context, '/faq'),
            ),
            const SizedBox(height: 24),
            _buildQuickTipsCard(),
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
              const Icon(Icons.support_agent, color: Colors.white, size: 32),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  t("We're Here to Help", "අපි උදව් කිරීමට මෙහි සිටිමු"),
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
              "Our support team is ready to assist you with any questions or issues you may have.",
              "ඔබට ඇති ඕනෑම ප්‍රශ්නයකට හෝ ගැටලුවකට අපේ සහාය කණ්ඩායම සූදානම්.",
            ),
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white70,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactMethod({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String description,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: Colors.grey.shade400,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickTipsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.lightbulb_outline,
                color: Colors.blue.shade700,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                t("Quick Tips", "ඉක්මන් උපදෙස්"),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildTipItem(
            t(
              "Check FAQ first for instant answers",
              "ඉක්මන් පිළිතුරු සඳහා මුලින් FAQ බලන්න",
            ),
          ),
          _buildTipItem(
            t(
              "Include your driver ID when contacting support",
              "සහාය අමතන විට ඔබගේ රියදුරු ID දාන්න",
            ),
          ),
          _buildTipItem(
            t(
              "Provide screenshots for technical issues",
              "තාක්ෂණික ගැටලු සඳහා තිර රූප එවන්න",
            ),
          ),
          _buildTipItem(
            t(
              "Be specific about the problem you're facing",
              "ඔබට ඇති ගැටලුව පැහැදිලිව කියන්න",
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTipItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.check_circle, size: 16, color: Colors.blue.shade700),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade800),
            ),
          ),
        ],
      ),
    );
  }

  void _showComingSoonDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.info_outline, color: Colors.blue),
            const SizedBox(width: 8),
            Text(t("Coming Soon", "ඉදිරියේදී")),
          ],
        ),
        content: Text(
          t(
            "Live chat support will be available in a future update. For now, please use email or phone support.",
            "සජීවී කතාබහ සහාය ඉදිරි යාවත්කාලීනයක එයි. දැනට ඊමේල් හෝ දුරකථන සහාය භාවිතා කරන්න.",
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(t("OK", "හරි")),
          ),
        ],
      ),
    );
  }
}

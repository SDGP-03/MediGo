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
  String _language = 'English';
  bool get _isSinhala => _language == 'Sinhala';
  bool get _isTamil => _language == 'Tamil';

  String t(String en, String si, [String? ta]) {
    if (_isSinhala) return si;
    if (_isTamil) return ta ?? en;
    return en;
  }

  @override
  void initState() {
    super.initState();
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _language = prefs.getString('language') ?? 'English';
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
              t(
                'Could not open this link',
                'මෙම ලින්ක් එක විවෘත කළේ නැහැ',
                'இந்த இணைப்பை திறக்க முடியவில்லை',
              ),
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error launching URL: $e');
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            t(
              'Failed to open support option',
              'සහාය විකල්පය විවෘත කළේ නැහැ',
              'உதவி விருப்பத்தை திறக்க முடியவில்லை',
            ),
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
          t('Contact Support', 'සහාය අමතන්න', 'உதவியை தொடர்பு கொள்ளுங்கள்'),
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
              title: t('Email Support', 'ඊමේල් සහාය', 'மின்னஞ்சல் உதவி'),
              subtitle: 'support@medigo.com',
              description: t(
                'Get a response within 24 hours',
                'පැය 24ක් ඇතුළත පිළිතුරක් ලැබේ',
                '24 மணி நேரத்திற்குள் பதில் கிடைக்கும்',
              ),
              onTap: () => _launchURL(context, 'mailto:support@medigo.com'),
            ),
            _buildContactMethod(
              context: context,
              icon: Icons.phone_outlined,
              iconColor: Colors.green,
              title: t('Phone Support', 'දුරකථන සහාය', 'தொலைபேசி உதவி'),
              subtitle: '+94 11 234 5678',
              description: t(
                'Available Mon-Fri, 9 AM - 6 PM',
                'සඳුදා-සිකුරාදා, පෙ.ව. 9 - ප.ව. 6',
                'திங்கள் முதல் வெள்ளி வரை, காலை 9 - மாலை 6',
              ),
              onTap: () => _launchURL(context, 'tel:+94112345678'),
            ),
            _buildContactMethod(
              context: context,
              icon: Icons.chat_outlined,
              iconColor: Colors.purple,
              title: t('Live Chat', 'සජීවී කතාබහ', 'நேரலை அரட்டை'),
              subtitle: t(
                'Chat with our support team',
                'අපේ සහාය කණ්ඩායම සමඟ කතා කරන්න',
                'எங்கள் உதவி குழுவுடன் உரையாடுங்கள்',
              ),
              description: t(
                'Average response time: 5 minutes',
                'සාමාන්‍ය පිළිතුරු කාලය: මිනිත්තු 5',
                'சராசரி பதில் நேரம்: 5 நிமிடங்கள்',
              ),
              onTap: () {
                _showComingSoonDialog(context);
              },
            ),
            _buildContactMethod(
              context: context,
              icon: Icons.help_outline,
              iconColor: Colors.orange,
              title: 'FAQ',
              subtitle: t(
                'Find answers to common questions',
                'සාමාන්‍ය ප්‍රශ්න වලට පිළිතුරු බලන්න',
                'பொதுவான கேள்விகளுக்கான பதில்களை காணுங்கள்',
              ),
              description: t(
                'Quick solutions to common issues',
                'සාමාන්‍ය ගැටලු වලට ඉක්මන් පිළිතුරු',
                'பொதுவான சிக்கல்களுக்கு விரைவான தீர்வுகள்',
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
                  t('We\'re Here to Help', 'අපි උදව් කිරීමට මෙහි සිටිමු', 'உதவ நாங்கள் இருக்கிறோம்'),
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
              'Our support team is ready to assist you with any questions or issues you may have.',
              'ඔබට ඇති ඕනෑම ප්‍රශ්නයක්ට හෝ ගැටලුවක්ට අපේ සහාය කණ්ඩායම සූදානම්.',
              'உங்களிடம் உள்ள கேள்விகள் அல்லது பிரச்சினைகளுக்கு எங்கள் உதவி குழு தயார்.',
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
                t('Quick Tips', 'ඉක්මන් උපදෙස්', 'விரைவு குறிப்புகள்'),
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
              'Check FAQ first for instant answers',
              'ඉක්මන් පිළිතුරු සඳහා මුලින් FAQ බලන්න',
              'உடனடி பதில்களுக்கு முதலில் FAQ பார்க்கவும்',
            ),
          ),
          _buildTipItem(
            t(
              'Include your driver ID when contacting support',
              'සහාය අමතන විට ඔබගේ රියදුරු ID දාන්න',
              'உதவியை தொடர்புகொள்ளும் போது உங்கள் டிரைவர் ID-ஐ சேர்க்கவும்',
            ),
          ),
          _buildTipItem(
            t(
              'Provide screenshots for technical issues',
              'තාක්ෂණික ගැටලු සඳහා තිර රූප එවන්න',
              'தொழில்நுட்ப பிரச்சினைகளுக்கு ஸ்கிரீன்‌ஷாட் சேர்க்கவும்',
            ),
          ),
          _buildTipItem(
            t(
              'Be specific about the problem you\'re facing',
              'ඔබට ඇති ගැටලුව පැහැදිලිව කියන්න',
              'நீங்கள் சந்திக்கும் பிரச்சினையை தெளிவாக எழுதுங்கள்',
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
            Text(t('Coming Soon', 'ඉදිරියේදී', 'விரைவில் வருகிறது')),
          ],
        ),
        content: Text(
          t(
            'Live chat support will be available in a future update. For now, please use email or phone support.',
            'සජීවී කතාබහ සහාය ඉදිරි යාවත්කාලීනයක එයි. දැනට ඊමේල් හෝ දුරකථන සහාය භාවිතා කරන්න.',
            'நேரலை அரட்டை உதவி அடுத்த புதுப்பிப்பில் வரும். தற்போது மின்னஞ்சல் அல்லது தொலைபேசி உதவியை பயன்படுத்தவும்.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(t('OK', 'හරි', 'சரி')),
          ),
        ],
      ),
    );
  }
}

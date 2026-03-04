import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:driver_application/widgets/side_menu.dart';

class PrivacyPolicyPage extends StatefulWidget {
  const PrivacyPolicyPage({super.key});

  @override
  State<PrivacyPolicyPage> createState() => _PrivacyPolicyPageState();
}

class _PrivacyPolicyPageState extends State<PrivacyPolicyPage> {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const SideMenu(currentRoute: '/privacy-policy'),
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
          t('Privacy Policy', 'පෞද්ගලිකතා ප්‍රතිපත්තිය', 'தனியுரிமைக் கொள்கை'),
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
            const SizedBox(height: 20),
            _buildLastUpdatedBadge(),
            const SizedBox(height: 20),
            _buildExpandableSection(
              icon: Icons.info_outline,
              iconColor: Colors.blue,
              title: t('1. Information We Collect', '1. අපි එකතු කරන දත්ත', '1. நாம் சேகரிக்கும் தகவல்'),
              content: t(
                'We collect your name, email, phone number, vehicle details, and profile photo when you register and use the app.',
                'ඔබ ලියාපදිංචි වන විට සහ යෙදුම භාවිතා කරන විට නම, ඊමේල්, දුරකථන අංකය, වාහන තොරතුරු සහ පැතිකඩ පින්තූරය එකතු කරනවා.',
                'நீங்கள் பதிவு செய்து செயலியை பயன்படுத்தும் போது பெயர், மின்னஞ்சல், தொலைபேசி எண், வாகன விவரங்கள் மற்றும் சுயவிவரப் படம் சேகரிக்கிறோம்.',
              ),
            ),
            _buildExpandableSection(
              icon: Icons.location_on_outlined,
              iconColor: Colors.red,
              title: t('2. Location Information', '2. ස්ථාන තොරතුරු', '2. இடம் தொடர்பான தகவல்'),
              content: t(
                'MediGo uses real-time location for navigation, ride tracking, and nearby requests while the app is active.',
                'MediGo යෙදුම සක්‍රීය විට මාර්ගය, ගමන් ලුහුබැඳීම සහ ළඟම ඉල්ලීම් සඳහා ඔබගේ වත්මන් ස්ථානය භාවිතා කරනවා.',
                'செயலி இயங்கும் போது வழிசெலுத்தல், பயண கண்காணிப்பு மற்றும் அருகிலுள்ள கோரிக்கைகளுக்கு நிகழ்நேர இடம் பயன்படுத்தப்படுகிறது.',
              ),
            ),
            _buildExpandableSection(
              icon: Icons.settings_outlined,
              iconColor: Colors.orange,
              title: t(
                '3. How We Use Your Information',
                '3. ඔබගේ දත්ත භාවිතා කරන ආකාරය',
                '3. உங்கள் தகவலை எவ்வாறு பயன்படுத்துகிறோம்',
              ),
              content: t(
                'We use data to provide rides, improve the app, process payments, and keep services safe.',
                'ගමන් සේවාව ලබාදීමට, යෙදුම වැඩිදියුණු කිරීමට, ගෙවීම් කළමනාකරණයට සහ ආරක්ෂාවට ඔබගේ දත්ත භාවිතා කරනවා.',
                'பயண சேவையை வழங்க, செயலியை மேம்படுத்த, கட்டணங்களை செயல்படுத்த மற்றும் பாதுகாப்பை உறுதிப்படுத்த தரவை பயன்படுத்துகிறோம்.',
              ),
            ),
            _buildExpandableSection(
              icon: Icons.security_outlined,
              iconColor: Colors.green,
              title: t('4. Data Security', '4. දත්ත ආරක්ෂාව', '4. தரவு பாதுகாப்பு'),
              content: t(
                'Your data is protected using secure systems and encryption, but no internet system is 100% risk-free.',
                'ඔබගේ දත්ත ආරක්ෂිත පද්ධති සහ ගුප්තකේතනයෙන් සුරකිනවා. එසේ වුවත් අන්තර්ජාල පද්ධතියක් 100% අවදානම් රහිත නොවේ.',
                'உங்கள் தரவு பாதுகாப்பான அமைப்புகள் மற்றும் குறியாக்கம் மூலம் காக்கப்படுகிறது. இருப்பினும் இணையத்தில் 100% அபாயமற்ற அமைப்பு இல்லை.',
              ),
            ),
            _buildExpandableSection(
              icon: Icons.share_outlined,
              iconColor: Colors.purple,
              title: t('5. Data Sharing', '5. දත්ත බෙදාගැනීම', '5. தரவு பகிர்வு'),
              content: t(
                'We do not sell your data. We only share when needed for service delivery, legal reasons, or user safety.',
                'අපි ඔබගේ දත්ත විකුණන්නේ නැහැ. සේවාව, නීතිමය අවශ්‍යතා හෝ ආරක්ෂාව සඳහා පමණක් බෙදාගන්නවා.',
                'உங்கள் தரவை நாங்கள் விற்கவில்லை. சேவை, சட்ட காரணங்கள் அல்லது பயனர் பாதுகாப்பிற்கு தேவைப்படும் போது மட்டுமே பகிர்கிறோம்.',
              ),
            ),
            _buildExpandableSection(
              icon: Icons.gavel_outlined,
              iconColor: Colors.indigo,
              title: t('6. Your Rights', '6. ඔබගේ අයිතිවාසිකම්', '6. உங்கள் உரிமைகள்'),
              content: t(
                'You can view, update, or delete your data and control app permissions from settings.',
                'සැකසුම් හරහා ඔබගේ දත්ත බලන්න, යාවත්කාලීන කරන්න, ඉවත් කරන්න සහ අවසර පාලනය කරන්න ඔබට හැකියි.',
                'அமைப்புகள் வழியாக உங்கள் தரவை பார்க்க, புதுப்பிக்க, நீக்க மற்றும் அனுமதிகளை கட்டுப்படுத்தலாம்.',
              ),
            ),
            _buildExpandableSection(
              icon: Icons.contact_support_outlined,
              iconColor: Colors.teal,
              title: t('7. Contact Us', '7. අප අමතන්න', '7. எங்களை தொடர்பு கொள்ளுங்கள்'),
              content: t(
                'If you have questions, contact support by email, phone, or Settings > Contact Support.',
                'ඔබට ප්‍රශ්න ඇත්නම් ඊමේල්, දුරකථනය හෝ සැකසුම් > සහාය අමතන්න මගින් සම්බන්ධ වන්න.',
                'உங்களுக்கு கேள்விகள் இருந்தால் மின்னஞ்சல், தொலைபேசி அல்லது அமைப்புகள் > உதவி மூலம் எங்களை தொடர்பு கொள்ளுங்கள்.',
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
                  t('I Understand', 'මට තේරුණා', 'எனக்கு புரிந்தது'),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
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
                  t('MediGo Privacy Policy', 'MediGo පෞද්ගලිකතා ප්‍රතිපත්තිය', 'MediGo தனியுரிமைக் கொள்கை'),
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
              'We value your privacy. Please read how we collect, use, and protect your personal information.',
              'අපි ඔබගේ පෞද්ගලිකතාවට වටිනාකම දෙනවා. දත්ත එකතු කරන, භාවිතා කරන සහ සුරකින ආකාරය මෙතැනින් බලන්න.',
              'உங்கள் தனியுரிமையை நாங்கள் மதிக்கிறோம். உங்கள் தகவலை எப்படி சேகரித்து, பயன்படுத்தி, பாதுகாக்கிறோம் என்பதை தயவுசெய்து படிக்கவும்.',
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

  Widget _buildLastUpdatedBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 4,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Icon(Icons.calendar_today, size: 16, color: Colors.blue.shade700),
          Text(
            t(
              'Last updated: February 24, 2026',
              'අවසන් යාවත්කාලීන කිරීම: 2026 පෙබරවාරි 24',
              'கடைசியாக புதுப்பிக்கப்பட்டது: பிப்ரவரி 24, 2026',
            ),
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
}

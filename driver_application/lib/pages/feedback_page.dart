import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:driver_application/widgets/side_menu.dart';

class FeedbackPage extends StatefulWidget {
  const FeedbackPage({super.key});

  @override
  State<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends State<FeedbackPage> {
  final TextEditingController subjectController = TextEditingController();
  final TextEditingController messageController = TextEditingController();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DatabaseReference feedbackRef = FirebaseDatabase.instance.ref().child(
    'feedback',
  );

  bool isSending = false;
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

  void _showSnackBar(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red.shade600 : Colors.green.shade600,
      ),
    );
  }

  @override
  void dispose() {
    subjectController.dispose();
    messageController.dispose();
    super.dispose();
  }

  Future<void> sendFeedback() async {
    final subject = subjectController.text.trim();
    final message = messageController.text.trim();

    if (subject.isEmpty || message.isEmpty) {
      _showSnackBar(
        t(
          'Please fill all fields',
          'කරුණාකර සියලුම තොරතුරු පුරවන්න',
          'தயவுசெய்து எல்லா புலங்களையும் நிரப்புங்கள்',
        ),
        isError: true,
      );
      return;
    }

    if (message.length < 10) {
      _showSnackBar(
        t(
          'Message should be at least 10 characters',
          'පණිවිඩය අකුරු 10ක් වත් තිබිය යුතුය',
          'செய்தி குறைந்தது 10 எழுத்துகள் இருக்க வேண்டும்',
        ),
        isError: true,
      );
      return;
    }

    setState(() {
      isSending = true;
    });

    try {
      final uid = _auth.currentUser?.uid;
      if (uid == null) {
        throw Exception('User not logged in');
      }

      await feedbackRef.push().set({
        'driverId': uid,
        'subject': subject,
        'message': message,
        'timestamp': ServerValue.timestamp,
        'status': 'pending',
      });

      if (!mounted) return;

      subjectController.clear();
      messageController.clear();

      _showSnackBar(
        t(
          'Feedback sent successfully',
          'ප්‍රතිචාරය සාර්ථකව යැව්වා',
          'கருத்து வெற்றிகரமாக அனுப்பப்பட்டது',
        ),
      );
    } catch (e) {
      _showSnackBar(
        t(
          'Failed to send feedback',
          'ප්‍රතිචාරය යැවීමට බැරි වුණා',
          'கருத்தை அனுப்ப முடியவில்லை',
        ),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          isSending = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const SideMenu(currentRoute: '/feedback'),
      appBar: AppBar(
        elevation: 0,
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
          t('Feedback & Support', 'ප්‍රතිචාර සහ සහාය', 'கருத்து மற்றும் உதவி'),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.red.shade500,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.red.shade400, Colors.red.shade600],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.shade200,
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.feedback_outlined,
                        size: 48,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      t(
                        'We Value Your Feedback',
                        'ඔබගේ ප්‍රතිචාර අපට වටිනවා',
                        'உங்கள் கருத்து எங்களுக்கு முக்கியம்',
                      ),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      t(
                        'Help us improve your experience',
                        'ඔබගේ අත්දැකීම හොඳ කරගන්න අපට උදව් කරන්න',
                        'உங்கள் அனுபவத்தை மேம்படுத்த எங்களுக்கு உதவுங்கள்',
                      ),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('Subject', 'මාතෘකාව', 'தலைப்பு'),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: subjectController,
                      textInputAction: TextInputAction.next,
                      maxLength: 80,
                      decoration: InputDecoration(
                        hintText: t(
                          'Brief summary of your feedback',
                          'ඔබගේ ප්‍රතිචාරය කෙටියෙන්',
                          'உங்கள் கருத்தின் சுருக்கம்',
                        ),
                        hintStyle: TextStyle(color: Colors.grey.shade400),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        prefixIcon: Icon(Icons.title, color: Colors.red.shade400),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(
                            color: Colors.red.shade400,
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      t('Message', 'පණිවිඩය', 'செய்தி'),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: messageController,
                      maxLines: 6,
                      minLines: 4,
                      maxLength: 1000,
                      decoration: InputDecoration(
                        hintText: t(
                          'Describe your issue or suggestion in detail...',
                          'ඔබගේ ගැටලුව හෝ යෝජනාව විස්තරයෙන් ලියන්න...',
                          'உங்கள் பிரச்சினை அல்லது பரிந்துரையை விரிவாக எழுதுங்கள்...',
                        ),
                        hintStyle: TextStyle(color: Colors.grey.shade400),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(
                            color: Colors.red.shade400,
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red.shade500,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          shadowColor: Colors.red.shade200,
                        ),
                        onPressed: isSending ? null : sendFeedback,
                        child: isSending
                            ? const SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 3,
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.send, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    t(
                                      'Submit Feedback',
                                      'ප්‍රතිචාර යවන්න',
                                      'கருத்தை அனுப்பு',
                                    ),
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.blue.shade100, width: 1),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Colors.blue.shade700,
                      size: 24,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        t(
                          'We typically respond within 24-48 hours',
                          'සාමාන්‍යයෙන් පැය 24-48ක් ඇතුළත පිළිතුරු දෙනවා',
                          'பொதுவாக 24-48 மணி நேரத்தில் பதில் தருகிறோம்',
                        ),
                        style: TextStyle(
                          color: Colors.blue.shade900,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

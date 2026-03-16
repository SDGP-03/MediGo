import 'package:driver_application/authentication/signup_screen.dart';
import 'package:driver_application/core/utils/validators.dart';
import 'package:driver_application/methods/common_methods.dart';
import 'package:driver_application/pages/home_page.dart';
import 'package:driver_application/widgets/loading_dialog.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  TextEditingController emailTextEditingController = TextEditingController();
  TextEditingController passwordTextEditingController = TextEditingController();
  CommonMethods cMethods = CommonMethods();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
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
  void dispose() {
    emailTextEditingController.dispose();
    passwordTextEditingController.dispose();
    super.dispose();
  }

  Future<void> checkIfNetworkIsAvailable() async {
    bool ok = await cMethods.checkConnectivity(context);
    if (ok) {
      if (_formKey.currentState!.validate()) {
        signInUser();
      }
    }
  }

  Future<void> signInUser() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => LoadingDialog(
        messageText: t(
          "Signing in, please wait...",
          "පිවිසෙමින්... කරුණාකර රැඳී සිටින්න",
          "உள்நுழைகிறது... தயவு செய்து காத்திருக்கவும்",
        ),
      ),
    );

    try {
      UserCredential userCredential = await FirebaseAuth.instance
          .signInWithEmailAndPassword(
            email: emailTextEditingController.text.trim(),
            password: passwordTextEditingController.text.trim(),
          );

      User userFirebase = userCredential.user!;

      DatabaseReference driversRef = FirebaseDatabase.instance
          .ref()
          .child("drivers")
          .child(userFirebase.uid);

      DatabaseEvent event = await driversRef.once();

      if (!mounted) return;
      Navigator.pop(context); // close loading dialog

      if (event.snapshot.value == null) {
        cMethods.displaySnackBar(
          t(
            "No user data found. Please contact support.",
            "පරිශීලක දත්ත හමු වුණේ නැහැ. සහාය අමතන්න.",
            "பயனர் தகவல் இல்லை. உதவியை தொடர்பு கொள்ளுங்கள்.",
          ),
          context,
        );
        await FirebaseAuth.instance.signOut();
        return;
      }

      Map userData = event.snapshot.value as Map;

      if (userData["blockStatus"] != "unblocked") {
        cMethods.displaySnackBar(
          t(
            "Your account is blocked. Please contact support.",
            "ඔබේ ගිණුම අවහිර කර ඇත. සහාය අමතන්න.",
            "உங்கள் கணக்கு தடை செய்யப்பட்டுள்ளது. உதவியை தொடர்பு கொள்ளுங்கள்.",
          ),
          context,
        );
        await FirebaseAuth.instance.signOut();
        return;
      }

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => HomePage()),
      );
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      Navigator.pop(context);

      String errorMessage = t(
        "Something went wrong. Please try again.",
        "දෝෂයක් වුණා. නැවත උත්සාහ කරන්න.",
        "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
      );

      switch (e.code) {
        case 'invalid-email':
          errorMessage = t(
            "Please enter a valid email address.",
            "වලංගු විද්‍යුත් තැපෑලක් ඇතුල් කරන්න.",
            "சரியான மின்னஞ்சல் முகவரியை உள்ளிடுங்கள்.",
          );
          break;

        case 'user-not-found':
          errorMessage = t(
            "No account found with this email.",
            "මේ විද්‍යුත් තැපෑලට ගිණුමක් හමු වුණේ නැහැ.",
            "இந்த மின்னஞ்சலுக்கு கணக்கு இல்லை.",
          );
          break;

        case 'wrong-password':
          errorMessage = t(
            "Incorrect password. Please try again.",
            "මුරපදය වැරදියි. නැවත උත්සාහ කරන්න.",
            "கடவுச்சொல் தவறு. மீண்டும் முயற்சிக்கவும்.",
          );
          break;

        case 'network-request-failed':
          errorMessage = t(
            "Network error. Please check your internet connection.",
            "ජාල දෝෂයක්. ඔබේ අන්තර්ජාල සබැඳිය පරීක්ෂා කරන්න.",
            "நெட்வொர்க் பிழை. உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.",
          );
          break;
      }

      cMethods.displaySnackBar(errorMessage, context);
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        cMethods.displaySnackBar(
          t(
            "Something went wrong. Please try again.",
            "දෝෂයක් වුණා. නැවත උත්සාහ කරන්න.",
            "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
          ),
          context,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ScrollIfNeeded(
        padding: const EdgeInsets.all(22),
        child: Column(
          children: [
            const SizedBox(height: 60),

            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(38),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withValues(alpha: 0.96),
                    const Color(0xFFFFE6E6),
                  ],
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x24A12A2A),
                    blurRadius: 26,
                    offset: Offset(0, 14),
                  ),
                ],
              ),
              child: Center(
                child: Semantics(
                  label: t('MediGo logo', 'MediGo ලාංඡනය', 'MediGo லோகோ'),
                  child: Image.asset("assets/logo/logo.png", height: 100),
                ),
              ),
            ),

            const SizedBox(height: 60),

            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, 5),
                  ),
                ],
              ),

              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.red.shade700,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(24),
                        topRight: Radius.circular(24),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t(
                            "Welcome Back",
                            "නැවත සාදරයෙන් පිළිගනිමු",
                            "மீண்டும் வரவேற்கிறோம்",
                          ),
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 5),
                        Text(
                          t(
                            "Sign in to continue as driver",
                            "රියදුරෙකු ලෙස ඉදිරියට යාමට පිවිසෙන්න",
                            "டிரைவராக தொடர உள்நுழையவும்",
                          ),
                          style: TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t("Email Address", "විද්‍යුත් තැපෑල", "மின்னஞ்சல்"),
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextFormField(
                          controller: emailTextEditingController,
                          keyboardType: TextInputType.emailAddress,
                          validator: Validators.validateEmail,
                          decoration: InputDecoration(
                            hintText: "driver@medigo.lk",
                            prefixIcon: Icon(Icons.email_outlined),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.all(
                                Radius.circular(12),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        Text(
                          t("Password", "මුරපදය", "கடவுச்சொல்"),
                          style: TextStyle(fontWeight: FontWeight.w500),
                        ),

                        const SizedBox(height: 8),

                        TextFormField(
                          controller: passwordTextEditingController,
                          obscureText: true,
                          keyboardType: TextInputType.visiblePassword,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Password is required';
                            }
                            return null;
                          },
                          decoration: InputDecoration(
                            hintText: t(
                              "Enter your password",
                              "ඔබගේ මුරපදය ඇතුල් කරන්න",
                              "உங்கள் கடவுச்சொல்லை உள்ளிடவும்",
                            ),
                            prefixIcon: const Icon(Icons.lock_outline),
                            border: const OutlineInputBorder(
                              borderRadius: BorderRadius.all(
                                Radius.circular(12),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 33),

                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red.shade700,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),

                            onPressed: () {
                              checkIfNetworkIsAvailable();
                            },

                            child: Text(
                              t("Sign In", "පිවිසෙන්න", "உள்நுழை"),
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                        ],
                      ),
                    ),
                  ),

                  Center(
                    child: TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => SignupScreen()),
                        );
                      },
                      child: Text(
                        t(
                          "Don't have an Account? Register Here",
                          "ගිණුමක් නැද්ද? මෙතනින් ලියාපදිංචි වන්න",
                          "கணக்கு இல்லையா? இங்கே பதிவு செய்யுங்கள்",
                        ),
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

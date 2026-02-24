import 'package:driver_application/authentication/signup_screen.dart';
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
  void dispose() {
    emailTextEditingController.dispose();
    passwordTextEditingController.dispose();
    super.dispose();
  }

  Future<void> checkIfNetworkIsAvailable() async {
    bool ok = await cMethods.checkConnectivity(context);
    if (ok) {
      signInFormValidation();
    }
  }

  void signInFormValidation() {
    if (!emailTextEditingController.text.contains("@medigo.lk")) {
      cMethods.displaySnackBar(
        t(
          "Please write valid email.",
          "කරුණාකර වලංගු විද්‍යුත් තැපෑලක් ඇතුල් කරන්න.",
        ),
        context,
      );
    } else if (passwordTextEditingController.text.trim().length < 6) {
      cMethods.displaySnackBar(
        t(
          "Your password must be atleast 6 or more characters.",
          "මුරපදය අකුරු 6කට වැඩි විය යුතුයි.",
        ),
        context,
      );
    } else {
      signInUser();
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

      if (!context.mounted) return;
      Navigator.pop(context); // close loading dialog

      if (event.snapshot.value == null) {
        cMethods.displaySnackBar(
          t(
            "No user data found. Please contact support.",
            "පරිශීලක දත්ත හමු වුණේ නැහැ. සහාය අමතන්න.",
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
      if (!context.mounted) return;
      Navigator.pop(context);

      String errorMessage = t(
        "Something went wrong. Please try again.",
        "දෝෂයක් වුණා. නැවත උත්සාහ කරන්න.",
      );

      switch (e.code) {
        case 'invalid-email':
          errorMessage = t(
            "Please enter a valid email address.",
            "වලංගු විද්‍යුත් තැපෑලක් ඇතුල් කරන්න.",
          );
          break;

        case 'user-not-found':
          errorMessage = t(
            "No account found with this email.",
            "මේ විද්‍යුත් තැපෑලට ගිණුමක් හමු වුණේ නැහැ.",
          );
          break;

        case 'wrong-password':
          errorMessage = t(
            "Incorrect password. Please try again.",
            "මුරපදය වැරදියි. නැවත උත්සාහ කරන්න.",
          );
          break;

        case 'network-request-failed':
          errorMessage = t(
            "Network error. Please check your internet connection.",
            "ජාල දෝෂයක්. ඔබේ අන්තර්ජාල සබැඳිය පරීක්ෂා කරන්න.",
          );
          break;
      }

      cMethods.displaySnackBar(errorMessage, context);
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        cMethods.displaySnackBar(
          t(
            "Something went wrong. Please try again.",
            "දෝෂයක් වුණා. නැවත උත්සාහ කරන්න.",
          ),
          context,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            children: [
              const SizedBox(height: 60),

              Center(child: Image.asset("assets/logo/logo.png", height: 160)),

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
                            t("Welcome Back", "නැවත සාදරයෙන් පිළිගනිමු"),
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
                            ),
                            style: TextStyle(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t("Email Address", "විද්‍යුත් තැපෑල"),
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: emailTextEditingController,
                            keyboardType: TextInputType.emailAddress,
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
                            t("Password", "මුරපදය"),
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: passwordTextEditingController,
                            obscureText: true,
                            keyboardType: TextInputType.visiblePassword,
                            decoration: InputDecoration(
                              hintText: t(
                                "Enter your password",
                                "ඔබගේ මුරපදය ඇතුල් කරන්න",
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
                                t("Sign In", "පිවිසෙන්න"),
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
      ),
    );
  }
}

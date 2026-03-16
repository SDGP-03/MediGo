import 'dart:io';

import 'package:driver_application/authentication/login_screen.dart';
import 'package:driver_application/methods/common_methods.dart';
import 'package:driver_application/pages/home_page.dart';
import 'package:driver_application/widgets/loading_dialog.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  TextEditingController userNameTextEditingController = TextEditingController();
  TextEditingController userPhoneTextEditingController =
      TextEditingController();
  TextEditingController emailTextEditingController = TextEditingController();
  TextEditingController passwordTextEditingController = TextEditingController();
  TextEditingController confirmPasswordTextEditingController =
      TextEditingController();
  File? selectedImage;
  final ImagePicker _picker = ImagePicker();
  String _language = 'English';
  bool get _isSinhala => _language == 'Sinhala';
  bool get _isTamil => _language == 'Tamil';

  CommonMethods cMethods = CommonMethods();

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
    userNameTextEditingController.dispose();
    userPhoneTextEditingController.dispose();
    emailTextEditingController.dispose();
    passwordTextEditingController.dispose();
    confirmPasswordTextEditingController.dispose();
    super.dispose();
  }

  Future<void> pickProfileImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
      maxWidth: 512,
    );

    if (image != null) {
      setState(() {
        selectedImage = File(image.path);
      });
    }
  }

  Future<String?> uploadProfileImage(String uid) async {
    if (selectedImage == null) return null;

    Reference storageRef = FirebaseStorage.instance
        .ref()
        .child("driver_profile_images")
        .child("$uid.jpg");

    UploadTask uploadTask = storageRef.putFile(selectedImage!);
    TaskSnapshot snapshot = await uploadTask;

    return await snapshot.ref.getDownloadURL();
  }

  Future<void> checkIfNetworkIsAvailable() async {
    bool ok = await cMethods.checkConnectivity(context);
    if (ok) {
      signUpFormValidation();
    }
  }

  void signUpFormValidation() {
    if (userNameTextEditingController.text.trim().length < 4) {
      cMethods.displaySnackBar(
        t(
          "Your name must be atleast 4 or more characters.",
          "නම අකුරු 4කට වැඩි විය යුතුයි.",
          "பெயர் குறைந்தது 4 எழுத்துகள் இருக்க வேண்டும்.",
        ),
        context,
      );
    } else if (userPhoneTextEditingController.text.trim().length < 10) {
      cMethods.displaySnackBar(
        t(
          "Your phone number must be atleast 10 or more characters.",
          "දුරකථන අංකය අංක 10ක් විය යුතුයි.",
          "தொலைபேசி எண் குறைந்தது 10 இலக்கங்கள் இருக்க வேண்டும்.",
        ),
        context,
      );
    } else if (!emailTextEditingController.text.contains("@medigo.lk")) {
      cMethods.displaySnackBar(
        t(
          "Please write valid email.",
          "කරුණාකර වලංගු විද්‍යුත් තැපෑලක් ඇතුල් කරන්න.",
          "சரியான மின்னஞ்சலை உள்ளிடுங்கள்.",
        ),
        context,
      );
    } else if (passwordTextEditingController.text.trim().length < 6) {
      cMethods.displaySnackBar(
        t(
          "Your password must be atleast 6 or more characters.",
          "මුරපදය අකුරු 6කට වැඩි විය යුතුයි.",
          "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.",
        ),
        context,
      );
    } else if (confirmPasswordTextEditingController.text.trim() !=
        passwordTextEditingController.text.trim()) {
      cMethods.displaySnackBar(
        t(
          "Passwords do not match.",
          "මුරපද දෙක එකිනෙකට නොගැලපේ.",
          "கடவுச்சொற்கள் பொருந்தவில்லை.",
        ),
        context,
      );
    } else {
      registerNewUser();
    }
  }

  Future<void> registerNewUser() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => LoadingDialog(
        messageText: t(
          "Registering, please wait...",
          "ලියාපදිංචි වෙමින්... කරුණාකර රැඳී සිටින්න",
          "பதிவாகிறது... தயவு செய்து காத்திருக்கவும்",
        ),
      ),
    );

    try {
      UserCredential userCredential = await FirebaseAuth.instance
          .createUserWithEmailAndPassword(
            email: emailTextEditingController.text.trim(),
            password: passwordTextEditingController.text.trim(),
          );

      User userFirebase = userCredential.user!;

      String uid = userFirebase.uid;

      String? imageUrl = await uploadProfileImage(uid);

      DatabaseReference driversRef = FirebaseDatabase.instance
          .ref()
          .child("drivers")
          .child(userFirebase.uid);

      Map<String, dynamic> driverMap = {
        "id": uid,
        "name": userNameTextEditingController.text.trim(),
        "phone": userPhoneTextEditingController.text.trim(),
        "email": emailTextEditingController.text.trim(),
        "profileImage": imageUrl ?? "",
        "blockStatus": "unblocked",
      };

      await driversRef.set(driverMap);

      if (!context.mounted) return;
      Navigator.pop(context); // close loading dialog

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

        case 'email-already-in-use':
          errorMessage = t(
            "This email is already registered.",
            "මෙම විද්‍යුත් තැපෑල දැනටමත් ලියාපදිංචි කර ඇත.",
            "இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டு உள்ளது.",
          );
          break;

        case 'weak-password':
          errorMessage = t(
            "Password is too weak. Use at least 6 characters.",
            "මුරපදය දුර්වලයි. අවමයෙන් අකුරු 6ක් භාවිතා කරන්න.",
            "கடவுச்சொல் பலவீனமாக உள்ளது. குறைந்தது 6 எழுத்துகள் பயன்படுத்தவும்.",
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
      if (context.mounted) {
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
              const SizedBox(height: 50),

              // PROFILE IMAGE (SIGNUP)
              Stack(
                children: [
                  CircleAvatar(
                    radius: 80,
                    backgroundColor: const Color.fromARGB(255, 223, 181, 181),

                    backgroundImage: selectedImage != null
                        ? FileImage(selectedImage!)
                        : null,

                    child: selectedImage == null
                        ? const Icon(
                            Icons.person,
                            size: 80,
                            color: Colors.white,
                          )
                        : null,
                  ),

                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.red.shade700,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.camera_alt,
                          size: 18,
                          color: Colors.white,
                        ),
                        onPressed: () {
                          pickProfileImage();
                        },
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 50),

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
                            t("Welcome", "සාදරයෙන් පිළිගනිමු", "வரவேற்கிறோம்"),
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 5),
                          Text(
                            t(
                              "Create a new user account",
                              "නව රියදුරු ගිණුමක් සාදන්න",
                              "புதிய டிரைவர் கணக்கை உருவாக்குங்கள்",
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
                            t("Username", "පරිශීලක නම", "பெயர்"),
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: userNameTextEditingController,
                            keyboardType: TextInputType.text,
                            decoration: InputDecoration(
                              hintText: t(
                                "Enter your user name",
                                "ඔබගේ නම ඇතුල් කරන්න",
                                "உங்கள் பெயரை உள்ளிடவும்",
                              ),
                              prefixIcon: const Icon(Icons.person_outline),
                              border: const OutlineInputBorder(
                                borderRadius: BorderRadius.all(
                                  Radius.circular(12),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          Text(
                            t("Phone Number", "දුරකථන අංකය", "தொலைபேசி எண்"),
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: userPhoneTextEditingController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              hintText: t(
                                "Enter your phone number",
                                "ඔබගේ දුරකථන අංකය ඇතුල් කරන්න",
                                "உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்",
                              ),
                              prefixIcon: const Icon(Icons.phone_outlined),
                              border: const OutlineInputBorder(
                                borderRadius: BorderRadius.all(
                                  Radius.circular(12),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          Text(
                            t("Email Address", "විද්‍යුත් තැපෑල", "மின்னஞ்சல்"),
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
                            t("Password", "මුරපදය", "கடவுச்சொல்"),
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

                          const SizedBox(height: 16),

                          Text(
                            t(
                              "Confirm Password",
                              "මුරපදය තහවුරු කරන්න",
                              "கடவுச்சொல்லை உறுதி செய்யவும்",
                            ),
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: confirmPasswordTextEditingController,
                            obscureText: true,
                            keyboardType: TextInputType.visiblePassword,
                            decoration: InputDecoration(
                              hintText: t(
                                "Re-enter your password",
                                "මුරපදය නැවත ඇතුල් කරන්න",
                                "கடவுச்சொல்லை மீண்டும் உள்ளிடவும்",
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
                                t("Sign Up", "ලියාපදිංචි වන්න", "பதிவு செய்யவும்"),
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
                            MaterialPageRoute(builder: (_) => LoginScreen()),
                          );
                        },
                        child: Text(
                          t(
                            "Already have an Account? Login Here",
                            "දැනටමත් ගිණුමක් තියෙනවාද? මෙතනින් පිවිසෙන්න",
                            "ஏற்கனவே கணக்கு உள்ளதா? இங்கே உள்நுழையவும்",
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

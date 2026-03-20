import 'dart:io';

import 'package:driver_application/authentication/login_screen.dart';
import 'package:driver_application/core/utils/validators.dart';
import 'package:driver_application/methods/common_methods.dart';
import 'package:driver_application/pages/home_page.dart';
import 'package:driver_application/widgets/loading_dialog.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _HospitalOption {
  final String placeId;
  final String name;
  final String address;

  const _HospitalOption({
    required this.placeId,
    required this.name,
    required this.address,
  });
}

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

  final List<_HospitalOption> _hospitals = [];
  String? _selectedHospitalPlaceId;
  bool _hospitalsLoading = true;
  String? _hospitalsError;

  CommonMethods cMethods = CommonMethods();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  String t(String en, String si, [String? ta]) {
    if (_isSinhala) return si;
    if (_isTamil) return ta ?? en;
    return en;
  }

  @override
  void initState() {
    super.initState();
    _loadLanguage();
    _loadHospitalsWithAdmins();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _language = prefs.getString('language') ?? 'English';
    });
  }

  Future<void> _loadHospitalsWithAdmins() async {
    try {
      if (mounted) {
        setState(() {
          _hospitalsLoading = true;
          _hospitalsError = null;
        });
      }

      final snapshot = await FirebaseDatabase.instance.ref("hospitals").get();
      final List<_HospitalOption> options = [];

      if (snapshot.exists && snapshot.value is Map) {
        final hospitalsMap = snapshot.value as Map;
        for (final entry in hospitalsMap.entries) {
          final String hospitalKey = entry.key.toString();
          final dynamic hospitalValue = entry.value;

          if (hospitalValue is! Map) continue;

          final dynamic admins = hospitalValue["admins"];
          if (admins is! Map || admins.isEmpty) continue;

          final dynamic info = hospitalValue["info"];
          if (info is! Map) continue;

          final String name = (info["name"] ?? "").toString().trim();
          if (name.isEmpty) continue;

          final String placeId =
              (info["placeId"] ?? hospitalKey).toString().trim();
          if (placeId.isEmpty) continue;

          options.add(
            _HospitalOption(
              placeId: placeId,
              name: name,
              address: (info["address"] ?? "").toString().trim(),
            ),
          );
        }
      }

      options.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));

      if (!mounted) return;
      setState(() {
        _hospitals
          ..clear()
          ..addAll(options);
        _hospitalsLoading = false;

        if (_selectedHospitalPlaceId == null && options.length == 1) {
          _selectedHospitalPlaceId = options.first.placeId;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _hospitalsLoading = false;
        _hospitalsError = e.toString();
      });
    }
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
      if (_formKey.currentState!.validate()) {
        registerNewUser();
      }
    }
  }

  Future<void> registerNewUser() async {
    final String? hospitalPlaceId = _selectedHospitalPlaceId;
    if (hospitalPlaceId == null || hospitalPlaceId.isEmpty) {
      cMethods.displaySnackBar(
        t(
          "Please select a hospital.",
          "කරුණාකර රෝහලක් තෝරන්න.",
          "தயவு செய்து ஒரு மருத்துவமனையைத் தேர்ந்தெடுக்கவும்.",
        ),
        context,
      );
      return;
    }

    final String hospitalName = _hospitals
        .firstWhere(
          (h) => h.placeId == hospitalPlaceId,
          orElse: () =>
              _HospitalOption(placeId: hospitalPlaceId, name: "", address: ""),
        )
        .name;

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

      final DatabaseReference rootDriverRef = FirebaseDatabase.instance
          .ref()
          .child("drivers")
          .child(userFirebase.uid);

      final DatabaseReference hospitalDriverRef = FirebaseDatabase.instance
          .ref()
          .child("hospitals")
          .child(hospitalPlaceId)
          .child("drivers")
          .child(userFirebase.uid);

      Map<String, dynamic> driverMap = {
        "id": uid,
        "name": userNameTextEditingController.text.trim(),
        "phone": userPhoneTextEditingController.text.trim(),
        "email": emailTextEditingController.text.trim(),
        "profileImage": imageUrl ?? "",
        "blockStatus": "unblocked",
        "hospitalPlaceId": hospitalPlaceId,
        if (hospitalName.isNotEmpty) "hospitalName": hospitalName,
      };

      await Future.wait([
        rootDriverRef.set(driverMap),
        hospitalDriverRef.set(driverMap),
      ]);

      if (!mounted) return;
      Navigator.pop(context); // close loading dialog

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
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t("Username", "පරිශීලක නම", "பெயர்"),
                              style: TextStyle(fontWeight: FontWeight.w500),
                            ),

                            const SizedBox(height: 8),

                            TextFormField(
                              controller: userNameTextEditingController,
                              keyboardType: TextInputType.text,
                              validator: Validators.validateName,
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

                            TextFormField(
                              controller: userPhoneTextEditingController,
                              keyboardType: TextInputType.phone,
                              validator: Validators.validatePhone,
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
                              t("Hospital", "රෝහල", "மருத்துவமனை"),
                              style: TextStyle(fontWeight: FontWeight.w500),
                            ),

                            const SizedBox(height: 8),

                            DropdownButtonFormField<String>(
                              key: ValueKey(_selectedHospitalPlaceId ?? "none"),
                              initialValue: _selectedHospitalPlaceId,
                              isExpanded: true,
                              items: _hospitals
                                  .map(
                                    (h) => DropdownMenuItem<String>(
                                      value: h.placeId,
                                      child: Text(
                                        h.name,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  )
                                  .toList(),
                              onChanged: _hospitalsLoading
                                  ? null
                                  : (value) {
                                      setState(() {
                                        _selectedHospitalPlaceId = value;
                                      });
                                    },
                              validator: (value) {
                                if (_hospitalsLoading) {
                                  return t(
                                    "Loading hospitals...",
                                    "රෝහල් ලැයිස්තුව ලබාගනිමින්...",
                                    "மருத்துவமனைகளை ஏற்றுகிறது...",
                                  );
                                }
                                if (value == null || value.isEmpty) {
                                  return t(
                                    "Please select a hospital.",
                                    "කරුණාකර රෝහලක් තෝරන්න.",
                                    "தயவு செய்து ஒரு மருத்துவமனையைத் தேர்ந்தெடுக்கவும்.",
                                  );
                                }
                                if (_hospitals.isEmpty) {
                                  return t(
                                    "No hospitals available. Ask an admin to register first.",
                                    "රෝහල් නොමැත. පළමුව පරිපාලකයෙකු ලියාපදිංචි වන්න කියන්න.",
                                    "மருத்துவமனைகள் இல்லை. முதலில் நிர்வாகி ஒருவர் பதிவு செய்யுமாறு கேளுங்கள்.",
                                  );
                                }
                                return null;
                              },
                              decoration: InputDecoration(
                                hintText: _hospitalsLoading
                                    ? t(
                                        "Loading hospitals...",
                                        "රෝහල් ලැයිස්තුව ලබාගනිමින්...",
                                        "மருத்துவமனைகளை ஏற்றுகிறது...",
                                      )
                                    : t(
                                        "Select your hospital",
                                        "ඔබේ රෝහල තෝරන්න",
                                        "உங்கள் மருத்துவமனையைத் தேர்ந்தெடுக்கவும்",
                                      ),
                                prefixIcon: const Icon(Icons.local_hospital),
                                border: const OutlineInputBorder(
                                  borderRadius: BorderRadius.all(
                                    Radius.circular(12),
                                  ),
                                ),
                                suffixIcon: _hospitalsLoading
                                    ? const Padding(
                                        padding: EdgeInsets.all(12),
                                        child: SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                          ),
                                        ),
                                      )
                                    : IconButton(
                                        tooltip: t(
                                          "Refresh",
                                          "යාවත්කාලීන කරන්න",
                                          "புதுப்பிக்கவும்",
                                        ),
                                        icon: const Icon(Icons.refresh),
                                        onPressed: _loadHospitalsWithAdmins,
                                      ),
                              ),
                            ),

                            if (_hospitalsError != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                t(
                                  "Couldn't load hospitals. Tap refresh to try again.",
                                  "රෝහල් ලබාගත නොහැක. නැවත උත්සාහ කිරීමට යාවත්කාලීන කරන්න.",
                                  "மருத்துவமனைகளை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்க புதுப்பிக்கவும்.",
                                ),
                                style: const TextStyle(
                                  color: Colors.red,
                                  fontSize: 12,
                                ),
                              ),
                            ],

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
                                return Validators.validatePassword(value);
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

                            TextFormField(
                              controller: confirmPasswordTextEditingController,
                              obscureText: true,
                              keyboardType: TextInputType.visiblePassword,
                              validator: (value) =>
                                  Validators.validatePasswordConfirmation(
                                value,
                                passwordTextEditingController.text,
                              ),
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

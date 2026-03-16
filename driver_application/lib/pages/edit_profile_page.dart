import 'dart:io';
import 'package:driver_application/core/utils/validators.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:driver_application/widgets/side_menu.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  File? selectedImage;
  String? networkProfileImage;

  final TextEditingController nameController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController emailController = TextEditingController();

  final TextEditingController currentPasswordController =
      TextEditingController();
  final TextEditingController newPasswordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();

  final ImagePicker _picker = ImagePicker();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DatabaseReference driversRef = FirebaseDatabase.instance.ref().child(
    "drivers",
  );

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  bool isSaving = false;
  bool isLoadingProfile = true;
  bool isUploadingImage = false;
  double uploadProgress = 0.0;

  // Password visibility states
  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
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
    loadProfileData();
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
    // Properly dispose all controllers
    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    currentPasswordController.dispose();
    newPasswordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  // ================= LOAD PROFILE =================

  Future<void> loadProfileData() async {
    setState(() {
      isLoadingProfile = true;
    });

    try {
      User? user = _auth.currentUser;
      if (user == null) {
        setState(() => isLoadingProfile = false);
        return;
      }

      DatabaseEvent event = await driversRef.child(user.uid).once();

      if (event.snapshot.value != null) {
        Map data = event.snapshot.value as Map;

        if (mounted) {
          setState(() {
            networkProfileImage = data["profileImage"];
            nameController.text = data["name"] ?? "";
            phoneController.text = data["phone"] ?? "";
            emailController.text = data["email"] ?? user.email ?? "";
          });
        }
      }
    } catch (e) {
      debugPrint('Error loading profile: $e');
      if (mounted) {
        _showErrorSnackBar(t('Failed to load profile data', 'පැතිකඩ දත්ත පූරණයට බැරි වුණා', 'சுயவிவர தகவலை ஏற்ற முடியவில்லை'));
      }
    } finally {
      if (mounted) {
        setState(() {
          isLoadingProfile = false;
        });
      }
    }
  }

  // ================= IMAGE PICK =================

  Future<void> pickProfileImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1024,
        maxHeight: 1024,
      );

      if (image != null) {
        setState(() {
          selectedImage = File(image.path);
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      _showErrorSnackBar(t('Failed to select image', 'පින්තූරය තෝරාගැනීමට බැරි වුණා', 'படத்தை தேர்வு செய்ய முடியவில்லை'));
    }
  }

  // ================= IMAGE COMPRESSION =================

  Future<File?> compressImage(File file) async {
    try {
      final dir = await getTemporaryDirectory();
      final targetPath =
          '${dir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.jpg';

      final result = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: 70,
        minWidth: 512,
        minHeight: 512,
      );

      return result != null ? File(result.path) : null;
    } catch (e) {
      debugPrint('Error compressing image: $e');
      return file; // Return original if compression fails
    }
  }

  // ================= IMAGE UPLOAD =================

  Future<String?> uploadProfileImage(String uid) async {
    if (selectedImage == null) return null;

    setState(() {
      isUploadingImage = true;
      uploadProgress = 0.0;
    });

    try {
      // Compress image before upload
      File? compressedImage = await compressImage(selectedImage!);
      if (compressedImage == null) {
        throw Exception('Image compression failed');
      }

      Reference storageRef = FirebaseStorage.instance
          .ref()
          .child("driver_profile_images")
          .child("$uid.jpg");

      UploadTask uploadTask = storageRef.putFile(compressedImage);

      // Listen to upload progress
      uploadTask.snapshotEvents.listen((TaskSnapshot snapshot) {
        if (mounted) {
          setState(() {
            uploadProgress = snapshot.bytesTransferred / snapshot.totalBytes;
          });
        }
      });

      TaskSnapshot snapshot = await uploadTask;
      String downloadUrl = await snapshot.ref.getDownloadURL();

      return downloadUrl;
    } catch (e) {
      debugPrint('Error uploading image: $e');
      throw Exception('Failed to upload image');
    } finally {
      if (mounted) {
        setState(() {
          isUploadingImage = false;
          uploadProgress = 0.0;
        });
      }
    }
  }

  // ================= PASSWORD CHANGE =================

  Future<void> changePassword() async {
    User? user = _auth.currentUser;
    if (user == null) return;
    final email = user.email;
    if (email == null || email.isEmpty) {
      throw Exception('This account cannot change password with email credentials');
    }

    String currentPassword = currentPasswordController.text.trim();
    String newPassword = newPasswordController.text.trim();

    try {
      AuthCredential credential = EmailAuthProvider.credential(
        email: email,
        password: currentPassword,
      );

      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
    } on FirebaseAuthException catch (e) {
      // Re-throw with more context
      if (e.code == 'wrong-password') {
        throw Exception(t('Current password is incorrect', 'වත්මන් මුරපදය වැරදියි', 'தற்போதைய கடவுச்சொல் தவறு'));
      } else if (e.code == 'weak-password') {
        throw Exception(t('New password is too weak', 'නව මුරපදය දුර්වලයි', 'புதிய கடவுச்சொல் பலவீனம்'));
      } else if (e.code == 'requires-recent-login') {
        throw Exception(t('Please log in again to change your password', 'මුරපදය වෙනස් කිරීමට නැවත පිවිසෙන්න', 'கடவுச்சொல் மாற்ற மீண்டும் உள்நுழையவும்'));
      } else {
        throw Exception('Failed to change password: ${e.message}');
      }
    }
  }

  // ================= SAVE PROFILE =================

  Future<void> saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    FocusScope.of(context).unfocus();

    setState(() {
      isSaving = true;
    });

    try {
      User? user = _auth.currentUser;
      if (user == null) throw Exception("User not logged in");

      String uid = user.uid;

      // Upload image if selected
      String? imageUrl;
      if (selectedImage != null) {
        imageUrl = await uploadProfileImage(uid);
      }

      // Update database
      Map<String, dynamic> updates = {
        "name": nameController.text.trim(),
        "phone": phoneController.text.trim(),
      };

      if (imageUrl != null) {
        updates["profileImage"] = imageUrl;
      }

      await driversRef.child(uid).update(updates);

      // Update UI instantly
      if (imageUrl != null) {
        setState(() {
          networkProfileImage = imageUrl;
          selectedImage = null;
        });
      }

      // Change password if provided
      if (newPasswordController.text.isNotEmpty) {
        await changePassword();
      }

      if (!mounted) return;

      _showSuccessSnackBar(t("Profile updated successfully", "පැතිකඩ සාර්ථකව යාවත්කාලීන කළා", "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது"));

      // Clear password fields
      currentPasswordController.clear();
      newPasswordController.clear();
      confirmPasswordController.clear();
    } catch (error) {
      debugPrint('Error saving profile: $error');

      if (mounted) {
        String message = error.toString().replaceFirst('Exception: ', '');
        _showErrorSnackBar(message);
      }
    } finally {
      if (mounted) {
        setState(() {
          isSaving = false;
        });
      }
    }
  }

  // ================= HELPER METHODS =================

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.red.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  // ================= UI =================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const SideMenu(currentRoute: '/edit-profile'),
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
        title: Text(t("Edit Profile", "පැතිකඩ වෙනස් කරන්න", "சுயவிவரம் திருத்து"), style: const TextStyle(color: Colors.white)),
        backgroundColor: Colors.red.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: isLoadingProfile
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.red.shade700),
                  const SizedBox(height: 12),
                  Text(t("Loading profile...", "පැතිකඩ පූරණය වෙයි...", "சுயவிவரம் ஏற்றப்படுகிறது...")),
                ],
              ),
            )
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  children: [
                    const SizedBox(height: 20),

                    // PROFILE IMAGE
                    _buildProfileImage(),

                    const SizedBox(height: 30),

                    // FORM CARD
                    _buildFormCard(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildProfileImage() {
    return Stack(
      children: [
        CircleAvatar(
          radius: 77,
          backgroundColor: Colors.grey.shade300,
          child: ClipOval(
            child: selectedImage != null
                ? Image.file(
                    selectedImage!,
                    width: 154,
                    height: 154,
                    fit: BoxFit.cover,
                  )
                : (networkProfileImage != null
                    ? CachedNetworkImage(
                        imageUrl: networkProfileImage!,
                        width: 154,
                        height: 154,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(),
                        ),
                        errorWidget: (context, url, error) => const Icon(
                          Icons.person,
                          size: 60,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(
                        Icons.person,
                        size: 60,
                        color: Colors.white,
                      )),
          ),
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
              onPressed: isUploadingImage ? null : pickProfileImage,
            ),
          ),
        ),
        if (isUploadingImage)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(
                      value: uploadProgress,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(uploadProgress * 100).toInt()}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildFormCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          // HEADER
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
                  t("Edit Profile", "පැතිකඩ වෙනස් කරන්න", "சுயவிவரம் திருத்து"),
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  t("Update your driver information", "ඔබගේ රියදුරු තොරතුරු යාවත්කාලීන කරන්න", "உங்கள் டிரைவர் தகவலை புதுப்பிக்கவும்"),
                  style: TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),

          // FORM
          Padding(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  buildInput(
                    controller: nameController,
                    hint: t("Full Name", "සම්පූර්ණ නම", "முழு பெயர்"),
                    icon: Icons.person_outline,
                    validator: Validators.validateName,
                  ),

                  const SizedBox(height: 16),

                  buildInput(
                    controller: emailController,
                    hint: t("Email", "විද්‍යුත් තැපෑල", "மின்னஞ்சல்"),
                    icon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    validator: Validators.validateEmail,
                    readOnly: true,
                  ),

                  const SizedBox(height: 16),

                  buildInput(
                    controller: phoneController,
                    hint: t("Phone Number (e.g., 0771234567)", "දුරකථන අංකය (උදා: 0771234567)", "தொலைபேசி எண் (உ.தா.: 0771234567)"),
                    icon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    validator: Validators.validatePhone,
                  ),

                  const SizedBox(height: 16),

                  const SizedBox(height: 30),

                  const Divider(),
                  const SizedBox(height: 10),

                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      t("Change Password (Optional)", "මුරපදය වෙනස් කරන්න (විකල්ප)", "கடவுச்சொல் மாற்று (விருப்பம்)"),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  buildPasswordInput(
                    controller: currentPasswordController,
                    hint: t("Current Password", "වත්මන් මුරපදය", "தற்போதைய கடவுச்சொல்"),
                    icon: Icons.lock_outline,
                    obscureText: _obscureCurrentPassword,
                    onToggleVisibility: () {
                      setState(() {
                        _obscureCurrentPassword = !_obscureCurrentPassword;
                      });
                    },
                    validator: (value) => Validators.validateCurrentPassword(
                      value,
                      newPasswordController.text.isNotEmpty,
                    ),
                  ),

                  const SizedBox(height: 16),

                  buildPasswordInput(
                    controller: newPasswordController,
                    hint: t("New Password (min 8 chars)", "නව මුරපදය (අකුරු 8ක් වත්)", "புதிய கடவுச்சொல் (குறைந்தது 8 எழுத்து)"),
                    icon: Icons.lock_reset,
                    obscureText: _obscureNewPassword,
                    onToggleVisibility: () {
                      setState(() {
                        _obscureNewPassword = !_obscureNewPassword;
                      });
                    },
                    validator: Validators.validatePassword,
                  ),

                  const SizedBox(height: 16),

                  buildPasswordInput(
                    controller: confirmPasswordController,
                    hint: t("Confirm New Password", "නව මුරපදය නැවත දාන්න", "புதிய கடவுச்சொல்லை மீண்டும் உள்ளிடவும்"),
                    icon: Icons.lock,
                    obscureText: _obscureConfirmPassword,
                    onToggleVisibility: () {
                      setState(() {
                        _obscureConfirmPassword = !_obscureConfirmPassword;
                      });
                    },
                    validator: (value) =>
                        Validators.validatePasswordConfirmation(
                      value,
                      newPasswordController.text,
                    ),
                  ),

                  const SizedBox(height: 30),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            isSaving ? Colors.grey : Colors.red.shade700,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: isSaving ? null : saveProfile,
                      child: isSaving
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              t("Save Changes", "වෙනස්කම් සුරකින්න", "மாற்றங்களை சேமிக்கவும்"),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ================= INPUT FIELD =================

  Widget buildInput({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    required String? Function(String?) validator,
    bool readOnly = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      readOnly: readOnly,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: Colors.grey.shade100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.red.shade700, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 2),
        ),
      ),
    );
  }

  Widget buildPasswordInput({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    required bool obscureText,
    required VoidCallback onToggleVisibility,
    required String? Function(String?) validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.visiblePassword,
      validator: validator,
      obscureText: obscureText,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon),
        suffixIcon: IconButton(
          icon: Icon(
            obscureText ? Icons.visibility_off : Icons.visibility,
            color: Colors.grey.shade600,
          ),
          onPressed: onToggleVisibility,
        ),
        filled: true,
        fillColor: Colors.grey.shade100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.red.shade700, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 2),
        ),
      ),
    );
  }
}

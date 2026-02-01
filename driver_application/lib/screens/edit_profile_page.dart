import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';

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
  final TextEditingController vehicleController = TextEditingController();

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

  @override
  void initState() {
    super.initState();
    loadProfileData();
  }

  // ================= LOAD PROFILE =================

  void loadProfileData() async {
    User? user = _auth.currentUser;
    if (user == null) return;

    DatabaseEvent event = await driversRef.child(user.uid).once();

    if (event.snapshot.value == null) return;

    Map data = event.snapshot.value as Map;

    setState(() {
      networkProfileImage = data["profileImage"];
      nameController.text = data["name"] ?? "";
      phoneController.text = data["phone"] ?? "";
      vehicleController.text = data["vehicleNumber"] ?? "";
    });
  }

  // ================= IMAGE PICK =================

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

  // ================= IMAGE UPLOAD =================

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

  // ================= PASSWORD CHANGE =================

  Future<void> changePassword() async {
    User? user = _auth.currentUser;
    if (user == null) return;

    String currentPassword = currentPasswordController.text.trim();
    String newPassword = newPasswordController.text.trim();

    AuthCredential credential = EmailAuthProvider.credential(
      email: user.email!,
      password: currentPassword,
    );

    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
  }

  // ================= SAVE PROFILE =================

  void saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    FocusScope.of(context).unfocus();

    setState(() {
      isSaving = true;
    });

    try {
      User? user = _auth.currentUser;
      if (user == null) throw Exception("User not logged in");

      String uid = user.uid;

      // Upload image
      String? imageUrl = await uploadProfileImage(uid);

      // Update database
      await driversRef.child(uid).update({
        "name": nameController.text.trim(),
        "phone": phoneController.text.trim(),
        "vehicleNumber": vehicleController.text.trim(),
        if (imageUrl != null) "profileImage": imageUrl,
      });

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

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Profile updated successfully")),
      );

      // Clear password fields
      currentPasswordController.clear();
      newPasswordController.clear();
      confirmPasswordController.clear();
    } catch (error) {
      if (mounted) {
        String message = "Failed to update profile";

        if (error is FirebaseAuthException) {
          if (error.code == 'wrong-password') {
            message = "Current password is incorrect";
          } else if (error.code == 'weak-password') {
            message = "New password is too weak";
          } else if (error.code == 'requires-recent-login') {
            message = "Please login again to change password";
          }
        }

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) {
        setState(() {
          isSaving = false;
        });
      }
    }
  }

  // ================= UI =================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            children: [
              const SizedBox(height: 60),

              // PROFILE IMAGE
              Stack(
                children: [
                  CircleAvatar(
                    radius: 55,
                    backgroundColor: Colors.grey.shade300,

                    backgroundImage: selectedImage != null
                        ? FileImage(selectedImage!)
                        : (networkProfileImage != null
                              ? NetworkImage(networkProfileImage!)
                              : null),

                    child:
                        (selectedImage == null && networkProfileImage == null)
                        ? const Icon(
                            Icons.person,
                            size: 60,
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
                        onPressed: pickProfileImage,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 30),

              // FORM CARD
              Container(
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
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Edit Profile",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 5),
                          Text(
                            "Update your driver information",
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
                              hint: "Full Name",
                              icon: Icons.person_outline,
                              validator: (value) =>
                                  value!.isEmpty ? "Name is required" : null,
                            ),

                            const SizedBox(height: 16),

                            buildInput(
                              controller: phoneController,
                              hint: "Phone Number",
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Phone number is required";
                                }

                                if (value.length != 10) {
                                  return "Invalid phone number";
                                }

                                return null;
                              },
                            ),

                            const SizedBox(height: 16),

                            buildInput(
                              controller: vehicleController,
                              hint: "Vehicle Number",
                              icon: Icons.directions_car_outlined,
                              validator: (value) => value!.isEmpty
                                  ? "Vehicle number required"
                                  : null,
                            ),

                            const SizedBox(height: 30),

                            buildInput(
                              controller: currentPasswordController,
                              hint: "Current Password",
                              icon: Icons.lock_outline,
                              keyboardType: TextInputType.visiblePassword,
                              validator: (value) {
                                if (newPasswordController.text.isNotEmpty &&
                                    value!.isEmpty) {
                                  return "Enter current password";
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 16),

                            buildInput(
                              controller: newPasswordController,
                              hint: "New Password",
                              icon: Icons.lock_reset,
                              keyboardType: TextInputType.visiblePassword,
                              validator: (value) {
                                if (value!.isNotEmpty && value.length < 6) {
                                  return "Min 6 characters";
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 16),

                            buildInput(
                              controller: confirmPasswordController,
                              hint: "Confirm New Password",
                              icon: Icons.lock,
                              keyboardType: TextInputType.visiblePassword,
                              validator: (value) {
                                if (newPasswordController.text.isNotEmpty &&
                                    value != newPasswordController.text) {
                                  return "Passwords do not match";
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 30),

                            SizedBox(
                              width: double.infinity,
                              height: 50,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: isSaving
                                      ? Colors.grey
                                      : Colors.red.shade700,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                                onPressed: isSaving ? null : saveProfile,
                                child: isSaving
                                    ? const CircularProgressIndicator(
                                        color: Colors.white,
                                      )
                                    : const Text(
                                        "Save Changes",
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
              ),
            ],
          ),
        ),
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
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      obscureText: keyboardType == TextInputType.visiblePassword,
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
      ),
    );
  }
}

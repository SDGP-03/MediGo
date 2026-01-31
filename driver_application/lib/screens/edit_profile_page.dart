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
  final ImagePicker _picker = ImagePicker();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DatabaseReference driversRef = FirebaseDatabase.instance.ref().child(
    "drivers",
  );

  bool isSaving = false;

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

  @override
  void initState() {
    super.initState();
    loadProfileData(); // AUTO LOAD PROFILE DATA
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

    String downloadUrl = await snapshot.ref.getDownloadURL();

    return downloadUrl;
  }

  void saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    FocusScope.of(context).unfocus();

    setState(() {
      isSaving = true;
    });

    try {
      User? user = _auth.currentUser;

      if (user == null) {
        throw Exception("User not logged in");
      }

      String uid = user.uid;
      String? imageUrl = await uploadProfileImage(uid);

      await driversRef.child(uid).update({
        "name": nameController.text.trim(),
        "phone": phoneController.text.trim(),
        "vehicleNumber": vehicleController.text.trim(),
        if (imageUrl != null) "profileImage": imageUrl,
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Profile updated successfully")),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to update profile")),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          isSaving = false;
        });
      }
    }
  }

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

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
                                    as ImageProvider
                              : null),

                    child: selectedImage == null
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
                        onPressed: () {
                          pickProfileImage();
                        },
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 30),

              // MAIN CARD
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // HEADER STRIP
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

                    // FORM AREA
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            buildLabel("Full Name"),

                            buildInput(
                              controller: nameController,
                              hint: "Enter your name",
                              icon: Icons.person_outline,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Name is required";
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 16),

                            buildLabel("Phone Number"),

                            buildInput(
                              controller: phoneController,
                              hint: "07X XXX XXXX",
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Phone number is required";
                                } else if (value.length < 10) {
                                  return "Enter valid phone number";
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 16),

                            buildLabel("Vehicle Number"),

                            buildInput(
                              controller: vehicleController,
                              hint: "ABC-1234",
                              icon: Icons.directions_car_outlined,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "Vehicle number is required";
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 30),

                            // SAVE BUTTON
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
                                    ? const SizedBox(
                                        height: 22,
                                        width: 22,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          color: Colors.white,
                                        ),
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

  // ===== UI COMPONENTS =====

  Widget buildLabel(String text) {
    return Text(text, style: const TextStyle(fontWeight: FontWeight.w500));
  }

  Widget buildInput({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    required String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,

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
      ),
    );
  }
}

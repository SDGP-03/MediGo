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

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  TextEditingController userNameTextEditingController = TextEditingController();
  TextEditingController userPhoneTextEditingController =
      TextEditingController();
  TextEditingController userVehicleNumberEditingController =
      TextEditingController();
  TextEditingController emailTextEditingController = TextEditingController();
  TextEditingController passwordTextEditingController = TextEditingController();
  File? selectedImage;
  final ImagePicker _picker = ImagePicker();

  CommonMethods cMethods = CommonMethods();

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
        "Your name must be atleast 4 or more characters.",
        context,
      );
    } else if (userPhoneTextEditingController.text.trim().length < 10) {
      cMethods.displaySnackBar(
        "Your phone number must be atleast 10 or more characters.",
        context,
      );
    } else if (!emailTextEditingController.text.contains("@medigo.lk")) {
      cMethods.displaySnackBar("Please write valid email.", context);
    } else if (passwordTextEditingController.text.trim().length < 6) {
      cMethods.displaySnackBar(
        "Your password must be atleast 6 or more characters.",
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
      builder: (_) =>
          const LoadingDialog(messageText: "Registering, Please wait..."),
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
        "vehicleNumber": userVehicleNumberEditingController.text.trim(),
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

      String errorMessage = "Something went wrong. Please try again.";

      switch (e.code) {
        case 'invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;

        case 'email-already-in-use':
          errorMessage = "This email is already registered.";
          break;

        case 'weak-password':
          errorMessage = "Password is too weak. Use at least 6 characters.";
          break;

        case 'network-request-failed':
          errorMessage =
              "Network error. Please check your internet connection.";
          break;
      }

      cMethods.displaySnackBar(errorMessage, context);
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        cMethods.displaySnackBar(
          "Something went wrong. Please try again.",
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
                        children: const [
                          Text(
                            "Welcome",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 5),
                          Text(
                            "Create a new user account",
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
                            "Username",
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: userNameTextEditingController,
                            keyboardType: TextInputType.text,
                            decoration: const InputDecoration(
                              hintText: "Enter your user name",
                              prefixIcon: Icon(Icons.person_outline),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.all(
                                  Radius.circular(12),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          Text(
                            "Phone Number",
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: userPhoneTextEditingController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              hintText: "Enter your phone number",
                              prefixIcon: Icon(Icons.phone_outlined),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.all(
                                  Radius.circular(12),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          Text(
                            "Vehicle Number",
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: userVehicleNumberEditingController,
                            keyboardType: TextInputType.text,
                            decoration: InputDecoration(
                              hintText: "Enter your vehicle number",
                              prefixIcon: Icon(Icons.directions_car_outlined),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.all(
                                  Radius.circular(12),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          Text(
                            "Email Address",
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
                            "Password",
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: passwordTextEditingController,
                            obscureText: true,
                            keyboardType: TextInputType.visiblePassword,
                            decoration: const InputDecoration(
                              hintText: "Enter your password",
                              prefixIcon: Icon(Icons.lock_outline),
                              border: OutlineInputBorder(
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

                              child: const Text(
                                "Sign Up",
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
                        child: const Text(
                          "Already have an Account? Login Here",
                          style: TextStyle(color: Colors.grey),
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

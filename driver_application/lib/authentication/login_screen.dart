import 'package:driver_application/authentication/signup_screen.dart';
import 'package:driver_application/methods/common_methods.dart';
import 'package:driver_application/pages/home_page.dart';
import 'package:driver_application/widgets/loading_dialog.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  TextEditingController emailTextEditingController = TextEditingController();
  TextEditingController passwordTextEditingController = TextEditingController();
  CommonMethods cMethods = CommonMethods();

  Future<void> checkIfNetworkIsAvailable() async {
    bool ok = await cMethods.checkConnectivity(context);
    if (ok) {
      signInFormValidation();
    }
  }

  void signInFormValidation() {
    if (!emailTextEditingController.text.contains("@medigo.lk")) {
      cMethods.displaySnackBar("Please write valid email.", context);
    } else if (passwordTextEditingController.text.trim().length < 6) {
      cMethods.displaySnackBar(
        "Your password must be atleast 6 or more characters.",
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
      builder: (_) =>
          const LoadingDialog(messageText: "Signing in, Please wait..."),
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
          "No user data found. Please contact support.",
          context,
        );
        await FirebaseAuth.instance.signOut();
        return;
      }

      Map userData = event.snapshot.value as Map;

      if (userData["blockStatus"] != "unblocked") {
        cMethods.displaySnackBar(
          "Your account is blocked. Please contact support.",
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

      String errorMessage = "Something went wrong. Please try again.";

      switch (e.code) {
        case 'invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;

        case 'user-not-found':
          errorMessage = "No account found with this email.";
          break;

        case 'wrong-password':
          errorMessage = "Incorrect password. Please try again.";
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
                        children: const [
                          Text(
                            "Welcome Back",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 5),
                          Text(
                            "Sign in to continue as driver",
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
                            MaterialPageRoute(builder: (_) => SignupScreen()),
                          );
                        },
                        child: const Text(
                          "Don't have an Account? Register Here",
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

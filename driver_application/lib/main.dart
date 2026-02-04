import 'package:driver_application/pages/home_page.dart';
import 'package:driver_application/screens/start_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:permission_handler/permission_handler.dart';
import 'pages/privacy_policy_page.dart';
import 'pages/edit_profile_page.dart';
import 'pages/settings_page.dart';
import 'authentication/login_screen.dart';
import 'pages/faq_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await Permission.locationWhenInUse.isDenied.then((valueOfPermission) {
    if (valueOfPermission) {
      Permission.locationWhenInUse.request();
    }
  });
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediGo Driver Application',
      debugShowCheckedModeBanner: false,

      theme: ThemeData.light().copyWith(
        scaffoldBackgroundColor: const Color(0xFFF4E6EA),
      ),

      home: FirebaseAuth.instance.currentUser == null
          ? const StartScreen()
          : const HomePage(),

      routes: {
        '/start': (context) => const StartScreen(),

        '/home': (context) => const HomePage(),

        '/edit-profile': (context) => const EditProfilePage(),

        '/login': (context) => const LoginScreen(),

        '/settings': (context) => const SettingsPage(),

        '/privacy-policy': (context) => const PrivacyPolicyPage(),

        '/faq': (context) => const FaqPage(),
      },
    );
  }
}

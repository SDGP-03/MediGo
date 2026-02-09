import 'dart:async';
import 'package:driver_application/authentication/login_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class SideMenu extends StatefulWidget {
  const SideMenu({super.key});

  @override
  State<SideMenu> createState() => _SideMenuState();
}

class _SideMenuState extends State<SideMenu> {
  String? profileImageUrl;
  String userName = "";

  StreamSubscription<DatabaseEvent>? _driverSubscription;

  @override
  void initState() {
    super.initState();
    _setupDriverListener();
  }

  @override
  void dispose() {
    _driverSubscription?.cancel();
    super.dispose();
  }

  void _setupDriverListener() {
    User? user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      DatabaseReference driversRef = FirebaseDatabase.instance
          .ref()
          .child("drivers")
          .child(user.uid);

      _driverSubscription = driversRef.onValue.listen((event) {
        if (event.snapshot.value != null) {
          final data = event.snapshot.value as Map;
          if (mounted) {
            setState(() {
              // Safe access to map keys
              if (data.containsKey("name") && data["name"] != null) {
                userName = data["name"].toString();
              }
              if (data.containsKey("profileImage") &&
                  data["profileImage"] != null) {
                profileImageUrl = data["profileImage"].toString();
              }
            });
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Container(
        color: const Color.fromARGB(255, 255, 230, 230), // light red
        child: Column(
          children: [
            Container(
              height: 240,
              width: double.infinity,
              color: const Color.fromARGB(255, 255, 171, 171),
              child: SafeArea(
                bottom: false,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    profileImageUrl != null && profileImageUrl!.isNotEmpty
                        ? CircleAvatar(
                            radius: 70,
                            backgroundColor: Colors.white,
                            backgroundImage: NetworkImage(profileImageUrl!),
                          )
                        : CircleAvatar(
                            radius: 70,
                            backgroundColor: const Color.fromARGB(
                              255,
                              223,
                              181,
                              181,
                            ),
                            child: const Icon(
                              Icons.person,
                              size: 70,
                              color: Colors.white,
                            ),
                          ),

                    const SizedBox(height: 12),

                    Text(
                      userName,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color.fromARGB(255, 255, 255, 255),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Home
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Home'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
            ),

            // Edit Profile
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Edit Profile'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/edit-profile');
              },
            ),

            // History
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('History'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/history');
              },
            ),

            const Spacer(),

            ListTile(
              leading: const Icon(Icons.feedback_outlined),
              title: const Text('Feedback / Complaints'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/feedback');
              },
            ),

            // Settings
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Settings'),
              onTap: () async {
                // ✅ Get root navigator BEFORE closing drawer
                final navigator = Navigator.of(context, rootNavigator: true);

                // Close drawer
                Navigator.of(context).pop();

                // Navigate safely
                final result = await navigator.pushNamed('/settings');

                // Reload Home if style changed
                if (result == "styleChanged") {
                  navigator.pushReplacementNamed('/home');
                }
              },
            ),

            const Divider(
              thickness: 1.5,
              color: Colors.redAccent,
              indent: 16,
              endIndent: 16,
            ),

            // Logout
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red)),
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Logout'),
                    content: const Text('Do you really want to logout?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () async {
                          Navigator.pop(context);
                          Navigator.pop(context);

                          await FirebaseAuth.instance.signOut();

                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const LoginScreen(),
                            ),
                            (route) => false,
                          );
                        },
                        child: const Text(
                          'Logout',
                          style: TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

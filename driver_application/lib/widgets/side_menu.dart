import 'package:driver_application/authentication/login_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class SideMenu extends StatelessWidget {
  const SideMenu({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Container(
        color: const Color.fromARGB(255, 255, 230, 230), // light red
        child: Column(
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(
                color: Color.fromARGB(255, 255, 171, 171),
              ),
              child: Center(
                child: Image(
                  image: AssetImage('assets/logo/logo.png'),
                  width: 120,
                  height: 120,
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

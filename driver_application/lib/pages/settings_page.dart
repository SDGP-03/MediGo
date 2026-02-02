import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool notificationsEnabled = true;
  bool darkModeEnabled = false;

  final FirebaseAuth _auth = FirebaseAuth.instance;

  // ================= LOGOUT =================

  Future<void> logout() async {
    await _auth.signOut();

    if (!mounted) return;

    Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
  }

  // ================= UI =================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Settings"),
        backgroundColor: Colors.red.shade700,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ---------- ACCOUNT ----------
          sectionTitle("Account"),

          settingsTile(
            icon: Icons.person_outline,
            title: "Edit Profile",
            onTap: () {
              Navigator.pushNamed(context, '/edit-profile');
            },
          ),

          settingsTile(
            icon: Icons.lock_outline,
            title: "Change Password",
            onTap: () {
              Navigator.pushNamed(context, '/edit-profile');
            },
          ),

          const SizedBox(height: 20),

          // ---------- PREFERENCES ----------
          sectionTitle("Preferences"),

          SwitchListTile(
            value: notificationsEnabled,
            onChanged: (value) {
              setState(() {
                notificationsEnabled = value;
              });
            },
            title: const Text("Enable Notifications"),
            secondary: const Icon(Icons.notifications_outlined),
          ),

          SwitchListTile(
            value: darkModeEnabled,
            onChanged: (value) {
              setState(() {
                darkModeEnabled = value;
              });
            },
            title: const Text("Dark Mode"),
            secondary: const Icon(Icons.dark_mode_outlined),
          ),

          const SizedBox(height: 20),

          // ---------- APP INFO ----------
          sectionTitle("App Information"),

          settingsTile(
            icon: Icons.info_outline,
            title: "About App",
            onTap: () {
              showAboutDialog(
                context: context,
                applicationName: "MediGo Driver",
                applicationVersion: "1.0.0",
                applicationIcon: const Icon(Icons.local_taxi),
                children: [const Text("MediGo Driver App for managing rides.")],
              );
            },
          ),

          settingsTile(
            icon: Icons.privacy_tip_outlined,
            title: "Privacy Policy",
            onTap: () {
              // Add navigation to privacy policy page
            },
          ),

          const SizedBox(height: 30),

          // ---------- LOGOUT ----------
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.logout),
            label: const Text("Logout"),
            onPressed: logout,
          ),
        ],
      ),
    );
  }

  // ================= COMPONENTS =================

  Widget sectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget settingsTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Icon(icon, color: Colors.red.shade700),
        title: Text(title),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }
}

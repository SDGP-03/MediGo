import '../authentication/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:path_provider/path_provider.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  String selectedMapStyle = "standard";

  bool notificationsEnabled = true;
  bool darkModeEnabled = false;

  final FirebaseAuth _auth = FirebaseAuth.instance;

  @override
  void initState() {
    super.initState();
    requestNotificationPermission();
    loadNotificationSetting();
    loadMapStyle();
  }

  Future<void> requestNotificationPermission() async {
    FirebaseMessaging messaging = FirebaseMessaging.instance;

    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Notification permission denied")),
      );
    }
  }

  Future<void> loadNotificationSetting() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();

    bool enabled = prefs.getBool('notifications') ?? true;

    setState(() {
      notificationsEnabled = enabled;
    });

    if (enabled) {
      await FirebaseMessaging.instance.subscribeToTopic("drivers");
    } else {
      await FirebaseMessaging.instance.unsubscribeFromTopic("drivers");
    }
  }

  Future<void> loadMapStyle() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      selectedMapStyle = prefs.getString("mapStyle") ?? "standard";
    });
  }

  Future<void> saveMapStyle(String style) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("mapStyle", style);
  }

  Future<void> clearAppCache() async {
    try {
      // Clear temporary directory
      final tempDir = await getTemporaryDirectory();
      if (tempDir.existsSync()) {
        tempDir.deleteSync(recursive: true);
      }

      // Clear Flutter image cache
      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Cache cleared successfully")),
      );
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Failed to clear cache")));
    }
  }

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
            onChanged: (value) async {
              SharedPreferences prefs = await SharedPreferences.getInstance();

              setState(() {
                notificationsEnabled = value;
              });

              await prefs.setBool('notifications', value);

              if (value) {
                await FirebaseMessaging.instance.subscribeToTopic("drivers");
              } else {
                await FirebaseMessaging.instance.unsubscribeFromTopic(
                  "drivers",
                );
              }
            },

            activeTrackColor: Colors.red.shade700,

            title: const Text("Enable Notifications"),
            secondary: const Icon(Icons.notifications_outlined),
          ),

          ListTile(
            leading: const Icon(Icons.map),
            title: const Text("Map Style"),
            trailing: DropdownButton<String>(
              value: selectedMapStyle,

              onChanged: (value) {
                if (value == null) return;

                setState(() {
                  selectedMapStyle = value;
                });

                saveMapStyle(value);

                Navigator.pop(context, "styleChanged");
              },

              items: const [
                DropdownMenuItem(value: "standard", child: Text("Standard")),
                DropdownMenuItem(value: "silver", child: Text("Silver")),
                DropdownMenuItem(value: "retro", child: Text("Retro")),
                DropdownMenuItem(value: "dark", child: Text("Dark")),
                DropdownMenuItem(value: "night", child: Text("Night")),
                DropdownMenuItem(value: "aubergine", child: Text("Aubergine")),
              ],
            ),
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
              Navigator.pushNamed(context, '/privacy-policy');
            },
          ),

          settingsTile(
            icon: Icons.delete_outline,
            title: "Clear Cache",
            onTap: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text("Clear Cache"),
                  content: const Text(
                    "This will remove temporary files and cached images. "
                    "Your account data will not be affected.",
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text("Cancel"),
                    ),

                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        clearAppCache();
                      },
                      child: const Text(
                        "Clear",
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 120),

          // ---------- LOGOUT ----------
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.logout),
            label: const Text(
              "Logout",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            onPressed: () {
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

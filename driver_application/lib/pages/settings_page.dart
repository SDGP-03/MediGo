import 'dart:io';
import '../authentication/login_screen.dart';
import 'privacy_policy_page.dart';
import 'faq_page.dart';
import 'contact_support_page.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
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
  bool soundEffectsEnabled = true;
  bool vibrationEnabled = true;
  String selectedLanguage = "English";
  String distanceUnit = "km";

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DatabaseReference driversRef = FirebaseDatabase.instance.ref().child(
    "drivers",
  );

  String appVersion = "Loading...";
  String cacheSize = "Calculating...";

  // User data
  String userName = "Driver";
  String userEmail = "";
  String? userProfileImage;

  @override
  void initState() {
    super.initState();
    _initializeSettings();
  }

  Future<void> _initializeSettings() async {
    await Future.wait([
      requestNotificationPermission(),
      loadNotificationSetting(),
      loadMapStyle(),
      loadPreferences(),
      loadAppVersion(),
      loadUserData(),
      calculateCacheSize(),
    ]);
  }

  Future<void> loadUserData() async {
    try {
      User? user = _auth.currentUser;
      if (user == null) return;

      DatabaseEvent event = await driversRef.child(user.uid).once();

      if (event.snapshot.value != null) {
        Map data = event.snapshot.value as Map;

        if (mounted) {
          setState(() {
            userName = data["name"] ?? "Driver";
            userEmail = data["email"] ?? user.email ?? "";
            userProfileImage = data["profileImage"];
          });
        }
      } else {
        if (mounted) {
          setState(() {
            userEmail = user.email ?? "";
          });
        }
      }
    } catch (e) {
      debugPrint('Error loading user data: $e');
    }
  }

  Future<void> loadAppVersion() async {
    // TODO: Add package_info_plus when dependency conflicts are resolved
    if (mounted) {
      setState(() {
        appVersion = "1.0.0 (1)";
      });
    }
  }

  Future<void> calculateCacheSize() async {
    try {
      final tempDir = await getTemporaryDirectory();
      int totalSize = 0;

      if (tempDir.existsSync()) {
        tempDir.listSync(recursive: true).forEach((file) {
          if (file is File) {
            totalSize += file.lengthSync();
          }
        });
      }

      if (mounted) {
        setState(() {
          cacheSize = '${(totalSize / 1024 / 1024).toStringAsFixed(2)} MB';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          cacheSize = "Unknown";
        });
      }
    }
  }

  Future<void> loadPreferences() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();

    if (mounted) {
      setState(() {
        soundEffectsEnabled = prefs.getBool('soundEffects') ?? true;
        vibrationEnabled = prefs.getBool('vibration') ?? true;
        selectedLanguage = prefs.getString('language') ?? 'English';
        distanceUnit = prefs.getString('distanceUnit') ?? 'km';
      });
    }
  }

  Future<void> savePreference(String key, dynamic value) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();

    if (value is bool) {
      await prefs.setBool(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    }
  }

  Future<void> requestNotificationPermission() async {
    try {
      FirebaseMessaging messaging = FirebaseMessaging.instance;

      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        if (mounted) {
          _showSnackBar("Notification permission denied", isError: true);
        }
      }
    } catch (e) {
      debugPrint('Error requesting notification permission: $e');
    }
  }

  Future<void> loadNotificationSetting() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    bool enabled = prefs.getBool('notifications') ?? true;

    if (mounted) {
      setState(() {
        notificationsEnabled = enabled;
      });
    }

    try {
      if (enabled) {
        await FirebaseMessaging.instance.subscribeToTopic("drivers");
      } else {
        await FirebaseMessaging.instance.unsubscribeFromTopic("drivers");
      }
    } catch (e) {
      debugPrint('Error managing notification topic: $e');
    }
  }

  Future<void> loadMapStyle() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        selectedMapStyle = prefs.getString("mapStyle") ?? "standard";
      });
    }
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

      // Recalculate cache size
      await calculateCacheSize();

      if (!mounted) return;

      _showSnackBar("Cache cleared successfully");
    } catch (e) {
      debugPrint('Error clearing cache: $e');
      if (mounted) {
        _showSnackBar("Failed to clear cache", isError: true);
      }
    }
  }

  Future<void> logout() async {
    try {
      await _auth.signOut();

      if (!mounted) return;

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    } catch (e) {
      debugPrint('Error logging out: $e');
      if (mounted) {
        _showSnackBar("Failed to logout", isError: true);
      }
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.error_outline : Icons.check_circle,
              color: Colors.white,
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: isError ? Colors.red.shade600 : Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text("Settings", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.red.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Header
          _buildProfileHeader(),

          const SizedBox(height: 20),

          // Account Section
          _buildSectionCard(
            title: "Account",
            children: [
              _buildSettingsTile(
                icon: Icons.person_outline,
                iconColor: Colors.blue,
                title: "Edit Profile",
                onTap: () => Navigator.pushNamed(context, '/edit-profile'),
              ),
              _buildSettingsTile(
                icon: Icons.lock_outline,
                iconColor: Colors.orange,
                title: "Change Password",
                onTap: () => Navigator.pushNamed(context, '/edit-profile'),
              ),
              _buildSettingsTile(
                icon: Icons.history,
                iconColor: Colors.purple,
                title: "Trip History",
                onTap: () => Navigator.pushNamed(context, '/history'),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Preferences Section
          _buildSectionCard(
            title: "Preferences",
            children: [
              _buildSwitchTile(
                icon: Icons.notifications_outlined,
                iconColor: Colors.red,
                title: "Notifications",
                subtitle: "Receive trip alerts",
                value: notificationsEnabled,
                onChanged: (value) async {
                  setState(() => notificationsEnabled = value);
                  await savePreference('notifications', value);

                  if (value) {
                    await FirebaseMessaging.instance.subscribeToTopic(
                      "drivers",
                    );
                  } else {
                    await FirebaseMessaging.instance.unsubscribeFromTopic(
                      "drivers",
                    );
                  }
                },
              ),
              _buildSwitchTile(
                icon: Icons.volume_up_outlined,
                iconColor: Colors.green,
                title: "Sound Effects",
                subtitle: "Play sounds for actions",
                value: soundEffectsEnabled,
                onChanged: (value) {
                  setState(() => soundEffectsEnabled = value);
                  savePreference('soundEffects', value);
                },
              ),
              _buildSwitchTile(
                icon: Icons.vibration,
                iconColor: Colors.indigo,
                title: "Vibration",
                subtitle: "Vibrate on notifications",
                value: vibrationEnabled,
                onChanged: (value) {
                  setState(() => vibrationEnabled = value);
                  savePreference('vibration', value);
                },
              ),
              _buildMapStyleTile(),
              _buildLanguageTile(),
              _buildDistanceUnitTile(),
            ],
          ),

          const SizedBox(height: 16),

          // App Information Section
          _buildSectionCard(
            title: "App Information",
            children: [
              _buildSettingsTile(
                icon: Icons.info_outline,
                iconColor: Colors.blue,
                title: "About App",
                subtitle: "Version $appVersion",
                onTap: () {
                  showAboutDialog(
                    context: context,
                    applicationName: "MediGo Driver",
                    applicationVersion: appVersion,
                    applicationIcon: Icon(
                      Icons.local_shipping,
                      size: 48,
                      color: Colors.red.shade700,
                    ),
                    children: const [
                      Text("MediGo Driver App for managing ambulance rides."),
                    ],
                  );
                },
              ),
              _buildSettingsTile(
                icon: Icons.star_outline,
                iconColor: Colors.amber,
                title: "Rate App",
                subtitle: "Share your feedback",
                onTap: () {
                  // TODO: Replace with actual Play Store URL
                  _showSnackBar("Thank you for your support!");
                },
              ),
              _buildSettingsTile(
                icon: Icons.support_agent,
                iconColor: Colors.teal,
                title: "Contact Support",
                subtitle: "Get help",
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ContactSupportPage(),
                    ),
                  );
                },
              ),
              _buildSettingsTile(
                icon: Icons.help_outline,
                iconColor: Colors.indigo,
                title: "FAQ",
                subtitle: "Frequently asked questions",
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const FaqPage()),
                  );
                },
              ),
              _buildSettingsTile(
                icon: Icons.privacy_tip_outlined,
                iconColor: Colors.grey,
                title: "Privacy Policy",
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const PrivacyPolicyPage(),
                    ),
                  );
                },
              ),
              _buildSettingsTile(
                icon: Icons.delete_outline,
                iconColor: Colors.orange,
                title: "Clear Cache",
                subtitle: cacheSize,
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text("Clear Cache"),
                      content: Text(
                        "This will remove $cacheSize of temporary files and cached images. "
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
            ],
          ),

          const SizedBox(height: 30),

          // Logout Button
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 2,
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
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        logout();
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

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // ================= PROFILE HEADER =================

  Widget _buildProfileHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.shade700, Colors.red.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          // Profile Image
          CircleAvatar(
            radius: 35,
            backgroundColor: Colors.white,
            child: userProfileImage != null
                ? ClipOval(
                    child: CachedNetworkImage(
                      imageUrl: userProfileImage!,
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      placeholder: (context, url) =>
                          const CircularProgressIndicator(),
                      errorWidget: (context, url, error) => const Icon(
                        Icons.person,
                        size: 40,
                        color: Colors.grey,
                      ),
                    ),
                  )
                : Icon(Icons.person, size: 40, color: Colors.red.shade700),
          ),

          const SizedBox(width: 16),

          // User Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  userEmail,
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Edit Icon
          IconButton(
            onPressed: () => Navigator.pushNamed(context, '/edit-profile'),
            icon: const Icon(Icons.edit, color: Colors.white),
          ),
        ],
      ),
    );
  }

  // ================= SECTION CARD =================

  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  // ================= SETTINGS TILE =================

  Widget _buildSettingsTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 24),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: subtitle != null
          ? Text(subtitle, style: const TextStyle(fontSize: 12))
          : null,
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  // ================= SWITCH TILE =================

  Widget _buildSwitchTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      secondary: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 24),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      value: value,
      onChanged: onChanged,
      activeColor: Colors.red.shade700,
    );
  }

  // ================= MAP STYLE TILE =================

  Widget _buildMapStyleTile() {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.cyan.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.map, color: Colors.cyan, size: 24),
      ),
      title: const Text(
        "Map Style",
        style: TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        selectedMapStyle.toUpperCase(),
        style: const TextStyle(fontSize: 12),
      ),
      trailing: DropdownButton<String>(
        value: selectedMapStyle,
        underline: const SizedBox(),
        onChanged: (value) {
          if (value == null) return;
          setState(() => selectedMapStyle = value);
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
    );
  }

  // ================= LANGUAGE TILE =================

  Widget _buildLanguageTile() {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.deepPurple.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.language, color: Colors.deepPurple, size: 24),
      ),
      title: const Text(
        "Language",
        style: TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(selectedLanguage, style: const TextStyle(fontSize: 12)),
      trailing: DropdownButton<String>(
        value: selectedLanguage,
        underline: const SizedBox(),
        onChanged: (value) {
          if (value == null) return;
          setState(() => selectedLanguage = value);
          savePreference('language', value);
          _showSnackBar("Language changed to $value");
        },
        items: const [
          DropdownMenuItem(value: "English", child: Text("English")),
          DropdownMenuItem(value: "Sinhala", child: Text("සිංහල")),
          DropdownMenuItem(value: "Tamil", child: Text("தமிழ்")),
        ],
      ),
    );
  }

  // ================= DISTANCE UNIT TILE =================

  Widget _buildDistanceUnitTile() {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.pink.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.straighten, color: Colors.pink, size: 24),
      ),
      title: const Text(
        "Distance Unit",
        style: TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        distanceUnit == 'km' ? 'Kilometers' : 'Miles',
        style: const TextStyle(fontSize: 12),
      ),
      trailing: DropdownButton<String>(
        value: distanceUnit,
        underline: const SizedBox(),
        onChanged: (value) {
          if (value == null) return;
          setState(() => distanceUnit = value);
          savePreference('distanceUnit', value);
        },
        items: const [
          DropdownMenuItem(value: "km", child: Text("Kilometers")),
          DropdownMenuItem(value: "mi", child: Text("Miles")),
        ],
      ),
    );
  }
}

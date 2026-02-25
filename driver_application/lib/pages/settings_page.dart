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
import '../widgets/map_styles.dart';

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

  bool get _isSinhala => selectedLanguage == "Sinhala";

  String t(String en, String si) => _isSinhala ? si : en;

  String _mapStyleLabel(String value) {
    switch (value) {
      case "standard":
        return t("STANDARD", "සාමාන්‍ය");
      case "silver":
        return t("SILVER", "සිල්වර්");
      case "retro":
        return t("RETRO", "රෙට්‍රෝ");
      case "dark":
        return t("DARK", "අඳුරු");
      case "night":
        return t("NIGHT", "රාත්‍රී");
      case "aubergine":
        return t("AUBERGINE", "ඕබර්ජීන්");
      default:
        return value.toUpperCase();
    }
  }

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
          _showSnackBar(
            t(
              "Notification permission denied",
              "දැනුම්දීම් අවසරය ප්‍රතික්ෂේප වුණා",
            ),
            isError: true,
          );
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
    final normalizedStyle = MapStyles.normalizeStyle(
      prefs.getString("mapStyle"),
    );
    if (mounted) {
      setState(() {
        selectedMapStyle = normalizedStyle;
      });
    }
    MapStyles.setSelectedStyle(normalizedStyle);
  }

  Future<void> saveMapStyle(String style) async {
    final prefs = await SharedPreferences.getInstance();
    final normalizedStyle = MapStyles.normalizeStyle(style);
    await prefs.setString("mapStyle", normalizedStyle);
    MapStyles.setSelectedStyle(normalizedStyle);
  }

  Future<void> clearAppCache() async {
    try {
      // Clear temporary directory contents without deleting the directory itself.
      final tempDir = await getTemporaryDirectory();
      if (tempDir.existsSync()) {
        for (final entity in tempDir.listSync()) {
          entity.deleteSync(recursive: true);
        }
      }

      // Clear Flutter image cache
      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();

      // Recalculate cache size
      await calculateCacheSize();

      if (!mounted) return;

      _showSnackBar(t("Cache cleared successfully", "කැෂේ සාර්ථකව ඉවත් කළා"));
    } catch (e) {
      debugPrint('Error clearing cache: $e');
      if (mounted) {
        _showSnackBar(
          t("Failed to clear cache", "කැෂේ ඉවත් කිරීමට බැරි වුණා"),
          isError: true,
        );
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
        _showSnackBar(
          t("Failed to logout", "ඉවත් වීමට බැරි වුණා"),
          isError: true,
        );
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
      appBar: AppBar(
        title: Text(
          t("Settings", "සැකසුම්"),
          style: const TextStyle(color: Colors.white),
        ),
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
            title: t("Account", "ගිණුම"),
            children: [
              _buildSettingsTile(
                icon: Icons.person_outline,
                iconColor: Colors.blue,
                title: t("Edit Profile", "පැතිකඩ වෙනස් කරන්න"),
                onTap: () => Navigator.pushNamed(context, '/edit-profile'),
              ),
              _buildSettingsTile(
                icon: Icons.lock_outline,
                iconColor: Colors.orange,
                title: t("Change Password", "මුරපදය වෙනස් කරන්න"),
                onTap: () => Navigator.pushNamed(context, '/edit-profile'),
              ),
              _buildSettingsTile(
                icon: Icons.history,
                iconColor: Colors.purple,
                title: t("Trip History", "ගමන් ඉතිහාසය"),
                onTap: () => Navigator.pushNamed(context, '/history'),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Preferences Section
          _buildSectionCard(
            title: t("Preferences", "අභිරුචි"),
            children: [
              _buildSwitchTile(
                icon: Icons.notifications_outlined,
                iconColor: Colors.red,
                title: t("Notifications", "දැනුම්දීම්"),
                subtitle: t("Receive trip alerts", "ගමන් දැනුම්දීම් ලබාගන්න"),
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
                title: t("Sound Effects", "ශබ්ද"),
                subtitle: t(
                  "Play sounds for actions",
                  "ක්‍රියා සඳහා ශබ්ද දාන්න",
                ),
                value: soundEffectsEnabled,
                onChanged: (value) {
                  setState(() => soundEffectsEnabled = value);
                  savePreference('soundEffects', value);
                },
              ),
              _buildSwitchTile(
                icon: Icons.vibration,
                iconColor: Colors.indigo,
                title: t("Vibration", "කම්පනය"),
                subtitle: t(
                  "Vibrate on notifications",
                  "දැනුම්දීම්වලදී කම්පනය",
                ),
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
            title: t("App Information", "යෙදුම් තොරතුරු"),
            children: [
              _buildSettingsTile(
                icon: Icons.info_outline,
                iconColor: Colors.blue,
                title: t("About App", "යෙදුම ගැන"),
                subtitle: t("Version $appVersion", "සංස්කරණය $appVersion"),
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
                    children: [
                      Text(
                        t(
                          "MediGo Driver App for managing ambulance rides.",
                          "අම්බුලන්ස් ගමන් කළමනාකරණයට MediGo රියදුරු යෙදුම.",
                        ),
                      ),
                    ],
                  );
                },
              ),
              _buildSettingsTile(
                icon: Icons.feedback_outlined,
                iconColor: Colors.amber,
                title: t("Send Feedback", "ප්‍රතිචාර යවන්න"),
                subtitle: t(
                  "Tell us how we can improve",
                  "අපි හොඳ කරගන්න දේ කියන්න",
                ),
                onTap: () => Navigator.pushNamed(context, '/feedback'),
              ),
              _buildSettingsTile(
                icon: Icons.support_agent,
                iconColor: Colors.teal,
                title: t("Contact Support", "සහාය අමතන්න"),
                subtitle: t("Get help", "උදව් ලබාගන්න"),
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
                subtitle: t("Frequently asked questions", "නිතර අහන ප්‍රශ්න"),
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
                title: t("Privacy Policy", "පෞද්ගලිකතා ප්‍රතිපත්තිය"),
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
                title: t("Clear Cache", "කැෂේ ඉවත් කරන්න"),
                subtitle: cacheSize,
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: Text(t("Clear Cache", "කැෂේ ඉවත් කරන්න")),
                      content: Text(
                        t(
                          "This will remove $cacheSize of temporary files and cached images. "
                              "Your account data will not be affected.",
                          "$cacheSize තාවකාලික ගොනු සහ කැෂ් පින්තූර ඉවත් වේ. ඔබගේ ගිණුම් දත්ත වෙනස් වෙන්නේ නැහැ.",
                        ),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: Text(t("Cancel", "අවලංගු කරන්න")),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.pop(context);
                            clearAppCache();
                          },
                          child: Text(
                            t("Clear", "ඉවත් කරන්න"),
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
            label: Text(
              t("Logout", "ඉවත් වන්න"),
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text(t('Logout', 'ඉවත් වීම')),
                  content: Text(
                    t(
                      'Are you sure you want to logout?',
                      'ඔබට ඉවත් වෙන්න ඕනෙද?',
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(t('Cancel', 'අවලංගු කරන්න')),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        logout();
                      },
                      child: Text(
                        t('Logout', 'ඉවත් වන්න'),
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
          color: iconColor.withValues(alpha: 0.1),
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
          color: iconColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 24),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      value: value,
      onChanged: onChanged,
      activeThumbColor: Colors.red.shade700,
    );
  }

  // ================= MAP STYLE TILE =================

  Widget _buildMapStyleTile() {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.cyan.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.map, color: Colors.cyan, size: 24),
      ),
      title: Text(
        t("Map Style", "සිතියම් විලාසය"),
        style: TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        _mapStyleLabel(selectedMapStyle),
        style: const TextStyle(fontSize: 12),
      ),
      trailing: DropdownButton<String>(
        value: selectedMapStyle,
        underline: const SizedBox(),
        onChanged: (value) {
          if (value == null) return;
          setState(() => selectedMapStyle = value);
          saveMapStyle(value);
          _showSnackBar(
            t(
              "Map style changed to ${value.toUpperCase()}",
              "සිතියම් විලාසය ${_mapStyleLabel(value)} ලෙස වෙනස් වුණා",
            ),
          );
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
          color: Colors.deepPurple.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.language, color: Colors.deepPurple, size: 24),
      ),
      title: Text(
        t("Language", "භාෂාව"),
        style: TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        selectedLanguage == "Sinhala"
            ? "සිංහල"
            : selectedLanguage == "Tamil"
            ? "தமிழ்"
            : "English",
        style: const TextStyle(fontSize: 12),
      ),
      trailing: DropdownButton<String>(
        value: selectedLanguage,
        underline: const SizedBox(),
        onChanged: (value) {
          if (value == null) return;
          setState(() => selectedLanguage = value);
          savePreference('language', value);
          _showSnackBar(
            value == "Sinhala"
                ? "භාෂාව සිංහල ලෙස වෙනස් වුණා"
                : "Language changed to $value",
          );
        },
        items: const [
          DropdownMenuItem(value: "Sinhala", child: Text("සිංහල")),
          DropdownMenuItem(value: "English", child: Text("English")),
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
          color: Colors.pink.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.straighten, color: Colors.pink, size: 24),
      ),
      title: Text(
        t("Distance Unit", "දුර ඒකකය"),
        style: TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        distanceUnit == 'km'
            ? t('Kilometers', 'කිලෝමීටර්')
            : t('Miles', 'සැතපුම්'),
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

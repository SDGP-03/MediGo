import 'dart:async';

import 'package:driver_application/authentication/login_screen.dart';
import 'package:driver_application/pages/contact_support_page.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class SideMenu extends StatefulWidget {
  const SideMenu({super.key, this.currentRoute});

  final String? currentRoute;

  @override
  State<SideMenu> createState() => _SideMenuState();
}

class _SideMenuState extends State<SideMenu> {
  String? profileImageUrl;
  String userName = 'Driver';

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
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final driversRef = FirebaseDatabase.instance
        .ref()
        .child('drivers')
        .child(user.uid);

    _driverSubscription = driversRef.onValue.listen((event) {
      final snapshot = event.snapshot.value;
      if (snapshot == null || !mounted) return;

      final data = Map<String, dynamic>.from(snapshot as Map);

      setState(() {
        userName = data['name']?.toString() ?? 'Driver';
        profileImageUrl = data['profileImage']?.toString();
      });
    });
  }

  String? _resolvedCurrentRoute(BuildContext context) {
    return widget.currentRoute ?? ModalRoute.of(context)?.settings.name;
  }

  Widget _buildAvatar() {
    final imageUrl = profileImageUrl;

    if (imageUrl != null && imageUrl.isNotEmpty) {
      return ClipOval(
        child: Image.network(
          imageUrl,
          width: 80,
          height: 80,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _defaultAvatar(),
        ),
      );
    }

    return _defaultAvatar();
  }

  Widget _defaultAvatar() {
    return Container(
      width: 84,
      height: 84,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withOpacity(0.2),
      ),
      child: const Icon(Icons.person, color: Colors.white, size: 32),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final email = FirebaseAuth.instance.currentUser?.email ?? '';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.shade700, Colors.red.shade400],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            _buildAvatar(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    userName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  if (email.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  ListTile _buildMenuTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool selected = false,
  }) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right, size: 20),
      selected: selected,
      selectedTileColor: Colors.red.withOpacity(0.08),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      onTap: onTap,
    );
  }

  Future<void> _openNamedRoute(String routeName) async {
    Navigator.of(context).pop(); // close drawer

    if (_resolvedCurrentRoute(context) == routeName) return;

    await Navigator.of(context, rootNavigator: true).pushNamed(routeName);
  }

  Future<void> _openContactSupport() async {
    Navigator.of(context).pop();

    await Navigator.of(
      context,
      rootNavigator: true,
    ).push(MaterialPageRoute(builder: (_) => const ContactSupportPage()));
  }

  Future<void> _confirmLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Do you really want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (shouldLogout != true || !mounted) return;

    await FirebaseAuth.instance.signOut();
    if (!mounted) return;

    Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentRoute = _resolvedCurrentRoute(context);

    return Drawer(
      backgroundColor: const Color(0xFFF8EEF1),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _buildHeader(context),
          const SizedBox(height: 8),

          _buildMenuTile(
            icon: Icons.home_outlined,
            title: 'Home',
            selected: currentRoute == '/home',
            onTap: () {
              Navigator.of(
                context,
                rootNavigator: true,
              ).popUntil((route) => route.isFirst);
            },
          ),

          _buildMenuTile(
            icon: Icons.person_outline,
            title: 'Edit Profile',
            selected: currentRoute == '/edit-profile',
            onTap: () => _openNamedRoute('/edit-profile'),
          ),

          _buildMenuTile(
            icon: Icons.history,
            title: 'History',
            selected: currentRoute == '/history',
            onTap: () => _openNamedRoute('/history'),
          ),

          const Divider(height: 24, indent: 16, endIndent: 16),

          _buildMenuTile(
            icon: Icons.support_agent_outlined,
            title: 'Contact Support',
            onTap: _openContactSupport,
          ),

          _buildMenuTile(
            icon: Icons.feedback_outlined,
            title: 'Feedback / Complaints',
            selected: currentRoute == '/feedback',
            onTap: () => _openNamedRoute('/feedback'),
          ),

          _buildMenuTile(
            icon: Icons.help_outline,
            title: 'FAQ',
            selected: currentRoute == '/faq',
            onTap: () => _openNamedRoute('/faq'),
          ),

          _buildMenuTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            selected: currentRoute == '/privacy-policy',
            onTap: () => _openNamedRoute('/privacy-policy'),
          ),

          const Divider(height: 24, indent: 16, endIndent: 16),

          /// SETTINGS MENU
          _buildMenuTile(
            icon: Icons.settings_outlined,
            title: 'Settings',
            selected: currentRoute == '/settings',
            onTap: () async {
              Navigator.of(context).pop(); // close drawer

              final navigator = Navigator.of(context, rootNavigator: true);

              final result = await navigator.pushNamed('/settings');

              if (result == 'styleChanged') {
                navigator.pushReplacementNamed('/home');
              }
            },
          ),

          const SizedBox(height: 8),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text(
                'Logout',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
              tileColor: Colors.red.withOpacity(0.06),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              onTap: _confirmLogout,
            ),
          ),

          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:driver_application/authentication/login_screen.dart';
import 'package:driver_application/authentication/signup_screen.dart';
import 'package:driver_application/methods/common_methods.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  bool _isSinhala = false;

  String t(String en, String si) => _isSinhala ? si : en;

  @override
  void initState() {
    super.initState();
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _isSinhala = prefs.getString('language') == 'Sinhala';
    });
  }

  Future<void> _setLanguage(String language) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language', language);
    if (!mounted) return;
    setState(() {
      _isSinhala = language == 'Sinhala';
    });
  }

  Widget _buildLanguagePicker() {
    final selectedValue = _isSinhala ? "Sinhala" : "English";

    Widget buildMenuItem({
      required String value,
      required String title,
      required String code,
    }) {
      final isSelected = selectedValue == value;
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFEFEF) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Container(
              width: 26,
              height: 26,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.red.shade700
                    : const Color(0xFFFFDCDC),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                code,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.red.shade700,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  color: const Color(0xFF3F4A4A),
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                ),
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, size: 18, color: Colors.red.shade700),
          ],
        ),
      );
    }

    return PopupMenuButton<String>(
      tooltip: t("Select language", "භාෂාව තෝරන්න"),
      onSelected: _setLanguage,
      color: Colors.white,
      elevation: 12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      offset: const Offset(0, 44),
      itemBuilder: (context) => [
        PopupMenuItem(
          value: "Sinhala",
          child: buildMenuItem(value: "Sinhala", title: "සිංහල", code: "SI"),
        ),
        PopupMenuItem(
          value: "English",
          child: buildMenuItem(value: "English", title: "English", code: "EN"),
        ),
      ],
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.white, const Color(0xFFFFF5F5)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.red.shade200),
          boxShadow: const [
            BoxShadow(
              color: Color(0x15000000),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 26,
              height: 26,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.red.shade700,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _isSinhala ? "SI" : "EN",
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              t("Language", "භාෂාව"),
              style: TextStyle(
                color: const Color(0xFF3F4A4A),
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.expand_more_rounded,
              color: Colors.red.shade700,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.24)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          SafeArea(
            child: ScrollIfNeeded(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
              fillViewport: true,
              child: Column(
                children: [
                  Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildLanguagePicker(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.9),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              t("Driver App", "රියදුරු යෙදුම"),
                              style: TextStyle(
                                color: Colors.red.shade700,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      TweenAnimationBuilder<double>(
                        duration: const Duration(milliseconds: 700),
                        tween: Tween(begin: 0.0, end: 1.0),
                        builder: (context, value, child) {
                          final easedScale =
                              0.94 +
                              (0.06 * Curves.easeOutBack.transform(value));
                          final easedOpacity = Curves.easeOutCubic.transform(
                            value,
                          );
                          return Transform.scale(
                            scale: easedScale,
                            child: Opacity(opacity: easedOpacity, child: child),
                          );
                        },
                        child: Container(
                          width: 150,
                          height: 150,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(38),
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Colors.white.withValues(alpha: 0.96),
                                const Color(0xFFFFE6E6),
                              ],
                            ),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x24A12A2A),
                                blurRadius: 26,
                                offset: Offset(0, 14),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Semantics(
                              label: t('MediGo logo', 'MediGo ලාංඡනය'),
                              child: Image.asset(
                                "assets/logo/logo.png",
                                height: 100,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 30),
                      Text(
                        t(
                          "Fast, Reliable Ambulance Management",
                          "ඉක්මන් සහ විශ්වාසදායක ගිලන් රථ කළමනාකරණය",
                        ),
                        textAlign: TextAlign.center,
                        style: textTheme.titleLarge?.copyWith(
                          color: const Color(0xFF3F4A4A),
                          height: 1.2,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        t(
                          "Real-time tracking, seamless coordination, and efficient patient care delivery",
                          "සජීවී ලුහුබැඳීම, පහසු සම්බන්ධීකරණය සහ කාර්යක්ෂම රෝගී සේවාව",
                        ),
                        textAlign: TextAlign.center,
                        style: textTheme.titleMedium?.copyWith(
                          color: const Color(0xFF5E6767),
                          height: 1.32,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.center,
                        children: [
                          _buildMetricChip(
                            icon: Icons.speed_outlined,
                            label: t("Fast Dispatch", "ඉක්මන් යොමු කිරීම"),
                            color: const Color(0xFFC0392B),
                          ),
                          _buildMetricChip(
                            icon: Icons.location_pin,
                            label: t("Live Tracking", "සජීවී ලුහුබැඳීම"),
                            color: const Color(0xFFB03A2E),
                          ),
                          _buildMetricChip(
                            icon: Icons.verified_user_outlined,
                            label: t("Secure Access", "ආරක්ෂිත ප්‍රවේශය"),
                            color: const Color(0xFF9C2A22),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),
                  Column(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.95),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFFF2D6D6)),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x14000000),
                              blurRadius: 16,
                              offset: Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            children: [
                              _FeatureRow(
                                icon: Icons.location_on_outlined,
                                text: t(
                                  "Live driver & patient tracking",
                                  "රියදුරු සහ රෝගී සජීවී ලුහුබැඳීම",
                                ),
                              ),
                              const SizedBox(height: 10),
                              _FeatureRow(
                                icon: Icons.schedule_outlined,
                                text: t(
                                  "Faster dispatch & coordination",
                                  "ඉක්මන් යොමු කිරීම සහ සම්බන්ධීකරණය",
                                ),
                              ),
                              const SizedBox(height: 10),
                              _FeatureRow(
                                icon: Icons.shield_outlined,
                                text: t(
                                  "Secure driver access",
                                  "ආරක්ෂිත රියදුරු ප්‍රවේශය",
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.95),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFF2D6D6)),
                        ),
                        child: Column(
                          children: [
                            SizedBox(
                              width: double.infinity,
                              height: 40,
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red.shade700,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const SignupScreen(),
                                    ),
                                  );
                                },
                                icon: const Icon(
                                  Icons.arrow_forward_rounded,
                                  color: Colors.white,
                                ),
                                label: Text(
                                  t("Get Started", "ආරම්භ කරමු"),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              height: 40,
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(color: Colors.red.shade700),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const LoginScreen(),
                                    ),
                                  );
                                },
                                child: Text(
                                  t(
                                    "I already have an account",
                                    "මට ගිණුමක් තියෙනවා",
                                  ),
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.red.shade700,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  const _FeatureRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.red.shade700, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey.shade800,
              height: 1.25,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

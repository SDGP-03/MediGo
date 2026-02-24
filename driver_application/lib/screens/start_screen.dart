import 'package:flutter/material.dart';
import 'package:driver_application/authentication/login_screen.dart';
import 'package:driver_application/authentication/signup_screen.dart';
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

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.red.shade50, Colors.white],
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.all(22),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        children: [
                          const SizedBox(height: 18),

                          TweenAnimationBuilder<double>(
                            duration: const Duration(milliseconds: 650),
                            tween: Tween(begin: 0.0, end: 1.0),
                            builder: (context, t, child) {
                              final easedScale =
                                  0.92 +
                                  (0.08 * Curves.easeOutBack.transform(t));
                              final easedOpacity = Curves.easeOut.transform(t);

                              return Transform.scale(
                                scale: easedScale,
                                child: Opacity(
                                  opacity: easedOpacity,
                                  child: child,
                                ),
                              );
                            },
                            child: Semantics(
                              label: t('MediGo logo', 'MediGo ලාංඡනය'),
                              child: Image.asset(
                                "assets/logo/logo.png",
                                height: 170,
                              ),
                            ),
                          ),

                          const SizedBox(height: 22),

                          Text(
                            t(
                              "Fast, Reliable Ambulance Management",
                              "ඉක්මන් සහ විශ්වාසදායක රථ ගිලන් කළමනාකරණය",
                            ),
                            textAlign: TextAlign.center,
                            style: textTheme.titleLarge?.copyWith(
                              color: const Color(0xFF4D5757),
                              height: 1.25,
                              fontWeight: FontWeight.w700,
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
                              color: Colors.grey.shade700,
                              height: 1.35,
                            ),
                          ),

                          const SizedBox(height: 18),

                          Card(
                            elevation: 0,
                            color: Colors.white.withValues(alpha: 0.92),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(22),
                              side: BorderSide(color: Colors.grey.shade200),
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
                        ],
                      ),

                      Column(
                        children: [
                          SizedBox(
                            width: double.infinity,
                            height: 52,
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
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          SizedBox(
                            width: double.infinity,
                            height: 48,
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
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 14),

                          Text(
                            "v1.0.0",
                            style: textTheme.bodySmall?.copyWith(
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
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

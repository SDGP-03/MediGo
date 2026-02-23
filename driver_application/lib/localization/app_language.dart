import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppLanguageController extends ChangeNotifier {
  static const String _languageCodeKey = 'languageCode';
  static const String _legacyLanguageKey = 'language';

  String _languageCode = 'en';

  String get languageCode => _languageCode;
  Locale get locale => Locale(_languageCode);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = _normalizeCode(
      prefs.getString(_languageCodeKey) ?? prefs.getString(_legacyLanguageKey),
    );

    _languageCode = code;

    // Keep old key in sync with new code for backward compatibility.
    await prefs.setString(_legacyLanguageKey, _nameForCode(code));
  }

  Future<void> setLanguage(String code) async {
    final normalized = _normalizeCode(code);
    if (normalized == _languageCode) return;

    _languageCode = normalized;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languageCodeKey, normalized);
    await prefs.setString(_legacyLanguageKey, _nameForCode(normalized));
  }

  static String _normalizeCode(String? raw) {
    switch ((raw ?? '').toLowerCase().trim()) {
      case 'sinhala':
      case 'si':
        return 'si';
      case 'tamil':
      case 'ta':
        return 'ta';
      default:
        return 'en';
    }
  }

  static String _nameForCode(String code) {
    switch (code) {
      case 'si':
        return 'Sinhala';
      case 'ta':
        return 'Tamil';
      default:
        return 'English';
    }
  }
}

class AppLanguageScope extends InheritedNotifier<AppLanguageController> {
  const AppLanguageScope({
    super.key,
    required AppLanguageController controller,
    required Widget child,
  }) : super(notifier: controller, child: child);

  static AppLanguageController of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<AppLanguageScope>();
    assert(scope != null, 'AppLanguageScope not found in widget tree');
    return scope!.notifier!;
  }
}

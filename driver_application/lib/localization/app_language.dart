import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppLanguageController extends ChangeNotifier {
  static const _languageCodeKey = 'languageCode';

  String _code = 'en';

  String get code => _code;
  Locale get locale => Locale(_code);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _code = _normalize(prefs.getString(_languageCodeKey) ?? 'en');
  }

  Future<void> setLanguage(String code) async {
    final normalized = _normalize(code);
    if (normalized == _code) return;

    _code = normalized;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languageCodeKey, normalized);
    await prefs.setString('language', _legacyLabel(normalized));
  }

  String _normalize(String value) {
    switch (value.toLowerCase().trim()) {
      case 'si':
      case 'sinhala':
        return 'si';
      case 'ta':
      case 'tamil':
        return 'ta';
      default:
        return 'en';
    }
  }

  String _legacyLabel(String code) {
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
    final scope = context.dependOnInheritedWidgetOfExactType<AppLanguageScope>();
    assert(scope != null, 'AppLanguageScope is missing');
    return scope!.notifier!;
  }
}

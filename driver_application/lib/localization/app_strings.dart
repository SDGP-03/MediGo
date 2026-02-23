import 'package:driver_application/localization/app_language.dart';
import 'package:flutter/material.dart';

class AppStrings {
  const AppStrings(this.langCode);

  final String langCode;

  static const Map<String, String> _en = {};

  static const Map<String, String> _si = {};

  static const Map<String, String> _ta = {};

  String t(String key, {Map<String, String> params = const {}}) {
    final map = switch (langCode) {
      'si' => _si,
      'ta' => _ta,
      _ => _en,
    };

    var value = map[key] ?? _en[key] ?? key;
    params.forEach((k, v) {
      value = value.replaceAll('{$k}', v);
    });
    return value;
  }
}

extension AppStringsX on BuildContext {
  AppLanguageController get appLanguage => AppLanguageScope.of(this);

  String tr(String key, {Map<String, String> params = const {}}) {
    return AppStrings(appLanguage.code).t(key, params: params);
  }

  Future<void> setAppLanguage(String code) => appLanguage.setLanguage(code);
}

import 'package:driver_application/localization/app_language.dart';
import 'package:flutter/material.dart';

class AppStrings {
  const AppStrings(this.langCode);

  final String langCode;

  static const Map<String, String> _en = {
    'settings': 'Settings',
    'account': 'Account',
    'edit_profile': 'Edit Profile',
    'change_password': 'Change Password',
    'trip_history': 'Trip History',
    'preferences': 'Preferences',
    'notifications': 'Notifications',
    'receive_trip_alerts': 'Receive trip alerts',
    'sound_effects': 'Sound Effects',
    'play_sounds_for_actions': 'Play sounds for actions',
    'vibration': 'Vibration',
    'vibrate_on_notifications': 'Vibrate on notifications',
    'map_style': 'Map Style',
    'language': 'Language',
    'distance_unit': 'Distance Unit',
    'kilometers': 'Kilometers',
    'miles': 'Miles',
    'app_information': 'App Information',
    'about_app': 'About App',
    'version': 'Version',
    'about_description': 'MediGo Driver App for managing ambulance rides.',
    'rate_app': 'Rate App',
    'share_feedback': 'Share your feedback',
    'contact_support': 'Contact Support',
    'get_help': 'Get help',
    'faq': 'FAQ',
    'frequently_asked_questions': 'Frequently asked questions',
    'privacy_policy': 'Privacy Policy',
    'clear_cache': 'Clear Cache',
    'clear_cache_message':
        'This will remove {size} of temporary files and cached images. Your account data will not be affected.',
    'cancel': 'Cancel',
    'clear': 'Clear',
    'logout': 'Logout',
    'logout_confirm': 'Are you sure you want to logout?',
    'language_changed': 'Language changed to {value}',
    'map_style_changed': 'Map style changed to {value}',
    'cache_cleared': 'Cache cleared successfully',
    'cache_clear_failed': 'Failed to clear cache',
    'notification_denied': 'Notification permission denied',
    'logout_failed': 'Failed to logout',
    'support_thanks': 'Thank you for your support!',
  };

  static const Map<String, String> _si = {
    'settings': 'සැකසීම්',
    'account': 'ගිණුම',
    'edit_profile': 'පැතිකඩ සංස්කරණය',
    'change_password': 'මුරපදය වෙනස් කරන්න',
    'trip_history': 'ගමන් ඉතිහාසය',
    'preferences': 'මනාප',
    'notifications': 'දැනුම්දීම්',
    'receive_trip_alerts': 'ගමන් ඇඟවීම් ලබාගන්න',
    'sound_effects': 'ශබ්ද ප්‍රතිඵල',
    'play_sounds_for_actions': 'ක්‍රියා සඳහා ශබ්ද වාදනය කරන්න',
    'vibration': 'කම්පනය',
    'vibrate_on_notifications': 'දැනුම්දීම්දී කම්පනය කරන්න',
    'map_style': 'නක්ෂා ශෛලිය',
    'language': 'භාෂාව',
    'distance_unit': 'දුර ඒකකය',
    'kilometers': 'කිලෝමීටර්',
    'miles': 'සැතපුම්',
    'app_information': 'යෙදුම් තොරතුරු',
    'about_app': 'යෙදුම පිළිබඳව',
    'version': 'අනුවාදය',
    'about_description': 'ඇම්බුලන්ස් ගමන් කළමනාකරණයට MediGo Driver යෙදුම.',
    'rate_app': 'යෙදුම ඇගයීම',
    'share_feedback': 'ඔබේ ප්‍රතිචාරය බෙදාගන්න',
    'contact_support': 'සහාය අමතන්න',
    'get_help': 'උදව් ලබාගන්න',
    'faq': 'නිතර අසන ප්‍රශ්න',
    'frequently_asked_questions': 'නිතර අසන ප්‍රශ්න',
    'privacy_policy': 'පෞද්ගලිකත්ව ප්‍රතිපත්තිය',
    'clear_cache': 'කෑෂ් මකන්න',
    'clear_cache_message':
        'මෙය තාවකාලික ගොනු සහ කෑෂ් රූප {size} ක් ඉවත් කරයි. ඔබගේ ගිණුම් දත්ත බලපාන්නේ නැත.',
    'cancel': 'අවලංගු කරන්න',
    'clear': 'මකන්න',
    'logout': 'පිටවීම',
    'logout_confirm': 'ඔබට සැබවින්ම පිටවීමට අවශ්‍යද?',
    'language_changed': 'භාෂාව {value} ලෙස වෙනස් විය',
    'map_style_changed': 'නක්ෂා ශෛලිය {value} ලෙස වෙනස් විය',
    'cache_cleared': 'කෑෂ් සාර්ථකව මකා ඇත',
    'cache_clear_failed': 'කෑෂ් මැකීමට අසමත් විය',
    'notification_denied': 'දැනුම්දීම් අවසරය ප්‍රතික්ෂේප විය',
    'logout_failed': 'පිටවීමට අසමත් විය',
    'support_thanks': 'ඔබගේ සහයෝගයට ස්තූතියි!',
  };

  static const Map<String, String> _ta = {
    'settings': 'அமைப்புகள்',
    'account': 'கணக்கு',
    'edit_profile': 'சுயவிவரம் திருத்து',
    'change_password': 'கடவுச்சொல்லை மாற்று',
    'trip_history': 'பயண வரலாறு',
    'preferences': 'விருப்பங்கள்',
    'notifications': 'அறிவிப்புகள்',
    'receive_trip_alerts': 'பயண எச்சரிக்கைகளை பெறுங்கள்',
    'sound_effects': 'ஒலி விளைவுகள்',
    'play_sounds_for_actions': 'செயல்களுக்கு ஒலி இயக்கவும்',
    'vibration': 'அதிர்வு',
    'vibrate_on_notifications': 'அறிவிப்புகளில் அதிர்வு செய்',
    'map_style': 'வரைபட பாணி',
    'language': 'மொழி',
    'distance_unit': 'தூர அலகு',
    'kilometers': 'கிலோமீட்டர்கள்',
    'miles': 'மைல்கள்',
    'app_information': 'பயன்பாட்டு தகவல்',
    'about_app': 'பயன்பாட்டைப் பற்றி',
    'version': 'பதிப்பு',
    'about_description': 'ஆம்புலன்ஸ் பயணங்களை நிர்வகிக்க MediGo Driver பயன்பாடு.',
    'rate_app': 'பயன்பாட்டை மதிப்பிடு',
    'share_feedback': 'உங்கள் கருத்தை பகிரவும்',
    'contact_support': 'ஆதரவை தொடர்பு கொள்ளுங்கள்',
    'get_help': 'உதவி பெறுங்கள்',
    'faq': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    'frequently_asked_questions': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    'privacy_policy': 'தனியுரிமைக் கொள்கை',
    'clear_cache': 'கேஷ் அழி',
    'clear_cache_message':
        'இது தற்காலிக கோப்புகள் மற்றும் கேஷ் படங்களை {size} அளவிற்கு அகற்றும். உங்கள் கணக்கு தரவு பாதிக்கப்படாது.',
    'cancel': 'ரத்து செய்',
    'clear': 'அழி',
    'logout': 'வெளியேறு',
    'logout_confirm': 'நீங்கள் வெளியேற விரும்புகிறீர்களா?',
    'language_changed': 'மொழி {value} ஆக மாற்றப்பட்டது',
    'map_style_changed': 'வரைபட பாணி {value} ஆக மாற்றப்பட்டது',
    'cache_cleared': 'கேஷ் வெற்றிகரமாக அழிக்கப்பட்டது',
    'cache_clear_failed': 'கேஷ் அழிக்க முடியவில்லை',
    'notification_denied': 'அறிவிப்பு அனுமதி மறுக்கப்பட்டது',
    'logout_failed': 'வெளியேற முடியவில்லை',
    'support_thanks': 'உங்கள் ஆதரவிற்கு நன்றி!',
  };

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

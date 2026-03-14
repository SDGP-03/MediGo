import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class MapsConfig {
  static const MethodChannel _channel = MethodChannel(
    'com.medigo.driver/config',
  );

  static Future<bool> isGmsApiKeyConfigured() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.iOS) return true;
    try {
      final res = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'gmsApiKeyStatus',
      );
      final configured = res?['configured'];
      return configured == true;
    } catch (_) {
      // If channel isn't available, assume not configured to avoid native crashes.
      return false;
    }
  }
}

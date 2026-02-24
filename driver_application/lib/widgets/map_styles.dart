import 'package:flutter/foundation.dart';

class MapStyles {
  const MapStyles._();

  static const String standard = '';

  static const String silver = '''
[
  {
    "elementType": "geometry",
    "stylers": [{"color": "#f5f5f5"}]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}]
  }
]
''';

  static const String retro = '''
[
  {
    "elementType": "geometry",
    "stylers": [{"color": "#ebe3cd"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#523735"}]
  }
]
''';

  static const String dark = '''
[
  {
    "elementType": "geometry",
    "stylers": [{"color": "#212121"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  }
]
''';

  static const String night = '''
[
  {
    "elementType": "geometry",
    "stylers": [{"color": "#242f3e"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#746855"}]
  }
]
''';

  static const String aubergine = '''
[
  {
    "elementType": "geometry",
    "stylers": [{"color": "#1d2c4d"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8ec3b9"}]
  }
]
''';

  static const List<String> supportedStyles = [
    'standard',
    'silver',
    'retro',
    'dark',
    'night',
    'aubergine',
  ];

  static final ValueNotifier<String> selectedStyleNotifier = ValueNotifier(
    'standard',
  );

  static String byName(String styleName) {
    switch (normalizeStyle(styleName)) {
      case 'silver':
        return silver;
      case 'retro':
        return retro;
      case 'dark':
        return dark;
      case 'night':
        return night;
      case 'aubergine':
        return aubergine;
      case 'standard':
      default:
        return standard;
    }
  }

  static String normalizeStyle(String? styleName) {
    final normalized = (styleName ?? 'standard').trim().toLowerCase();
    return supportedStyles.contains(normalized) ? normalized : 'standard';
  }

  static void setSelectedStyle(String? styleName) {
    selectedStyleNotifier.value = normalizeStyle(styleName);
  }
}

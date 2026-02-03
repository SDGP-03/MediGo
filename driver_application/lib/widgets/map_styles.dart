class MapStyles {
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
}

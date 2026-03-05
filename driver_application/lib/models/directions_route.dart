import 'package:google_maps_flutter/google_maps_flutter.dart';

class DirectionsStep {
  DirectionsStep({
    required this.instruction,
    required this.distanceText,
    required this.distanceMeters,
    required this.durationText,
    required this.durationSeconds,
    required this.endLocation,
    this.maneuver,
  });

  final String instruction;
  final String distanceText;
  final int distanceMeters;
  final String durationText;
  final int durationSeconds;
  final LatLng endLocation;
  final String? maneuver;
}

class DirectionsRoute {
  DirectionsRoute({
    required this.polylinePoints,
    required this.steps,
    required this.totalDistanceText,
    required this.totalDistanceMeters,
    required this.totalDurationText,
    required this.totalDurationSeconds,
    required this.bounds,
  });

  final List<LatLng> polylinePoints;
  final List<DirectionsStep> steps;
  final String totalDistanceText;
  final int totalDistanceMeters;
  final String totalDurationText;
  final int totalDurationSeconds;
  final LatLngBounds bounds;
}


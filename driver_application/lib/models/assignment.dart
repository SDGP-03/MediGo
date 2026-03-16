import 'package:google_navigation_flutter/google_navigation_flutter.dart';

class Assignment {
  static double _parseDouble(dynamic value, {double fallback = 0.0}) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  final String requestId;
  final String status; // pending, accepted, in_progress, completed, cancelled
  final String priority; // critical, urgent, standard

  // Assigned resources
  final String? ambulanceId;

  // Patient info
  final String patientName;
  final String? patientAge;
  final String? patientGender;

  // Pickup (source hospital)
  final String pickupName;
  final String pickupAddress;
  final LatLng pickupLatLng;

  // Destination hospital
  final String dropName;
  final String dropAddress;
  final LatLng dropLatLng;

  // Requirements
  final bool requiresDoctor;
  final bool requiresVentilator;
  final bool requiresOxygen;
  final String? reason;

  Assignment({
    required this.requestId,
    required this.status,
    required this.priority,
    this.ambulanceId,
    required this.patientName,
    this.patientAge,
    this.patientGender,
    required this.pickupName,
    required this.pickupAddress,
    required this.pickupLatLng,
    required this.dropName,
    required this.dropAddress,
    required this.dropLatLng,
    this.requiresDoctor = false,
    this.requiresVentilator = false,
    this.requiresOxygen = false,
    this.reason,
  });

  /// Parse assignment from Firebase Realtime Database snapshot
  factory Assignment.fromJson(String id, Map<dynamic, dynamic> json) {
    final patient = json['patient'] as Map<dynamic, dynamic>? ?? {};
    final pickup = json['pickup'] as Map<dynamic, dynamic>? ?? {};
    final destination = json['destination'] as Map<dynamic, dynamic>? ?? {};
    final requirements = json['requirements'] as Map<dynamic, dynamic>? ?? {};

    return Assignment(
      requestId: id,
      status: json['status'] ?? 'pending',
      priority: json['priority'] ?? 'standard',
      ambulanceId: json['ambulanceId'],
      patientName: patient['name'] ?? 'Unknown Patient',
      patientAge: patient['age']?.toString(),
      patientGender: patient['gender'],
      pickupName: pickup['hospitalName'] ?? 'Pickup Location',
      pickupAddress: pickup['address'] ?? '',
      pickupLatLng: LatLng(
        latitude: _parseDouble(pickup['lat']),
        longitude: _parseDouble(pickup['lng']),
      ),
      dropName: destination['hospitalName'] ?? 'Destination',
      dropAddress: destination['address'] ?? '',
      dropLatLng: LatLng(
        latitude: _parseDouble(destination['lat']),
        longitude: _parseDouble(destination['lng']),
      ),
      requiresDoctor: requirements['requiresDoctor'] ?? false,
      requiresVentilator: requirements['requiresVentilator'] ?? false,
      requiresOxygen: requirements['requiresOxygen'] ?? false,
      reason: json['reason'],
    );
  }
}

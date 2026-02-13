/// Model class representing a trip in the driver's history
class Trip {
  final String id;
  final String pickup;
  final String dropoff;
  final String? patientName;
  final DateTime timestamp;
  final String status;
  final double? distance;
  final int? duration; // in minutes
  final double? earnings;
  final String? priority;
  final String? notes;

  Trip({
    required this.id,
    required this.pickup,
    required this.dropoff,
    this.patientName,
    required this.timestamp,
    required this.status,
    this.distance,
    this.duration,
    this.earnings,
    this.priority,
    this.notes,
  });

  /// Create Trip from Firebase JSON data
  factory Trip.fromJson(String id, Map<dynamic, dynamic> json) {
    return Trip(
      id: id,
      pickup: json['pickup'] ?? json['pickupName'] ?? 'Unknown',
      dropoff: json['dropoff'] ?? json['dropName'] ?? 'Unknown',
      patientName: json['patientName'],
      timestamp: _parseTimestamp(json['timestamp'] ?? json['date']),
      status: json['status'] ?? 'unknown',
      distance: _parseDouble(json['distance']),
      duration: _parseInt(json['duration']),
      earnings: _parseDouble(json['earnings'] ?? json['fare']),
      priority: json['priority'],
      notes: json['notes'],
    );
  }

  /// Convert Trip to JSON for Firebase
  Map<String, dynamic> toJson() {
    return {
      'pickup': pickup,
      'dropoff': dropoff,
      if (patientName != null) 'patientName': patientName,
      'timestamp': timestamp.millisecondsSinceEpoch,
      'status': status,
      if (distance != null) 'distance': distance,
      if (duration != null) 'duration': duration,
      if (earnings != null) 'earnings': earnings,
      if (priority != null) 'priority': priority,
      if (notes != null) 'notes': notes,
    };
  }

  /// Helper to parse timestamp from various formats
  static DateTime _parseTimestamp(dynamic value) {
    if (value == null) return DateTime.now();
    
    if (value is int) {
      // Milliseconds since epoch
      return DateTime.fromMillisecondsSinceEpoch(value);
    } else if (value is String) {
      // Try parsing ISO 8601 string
      try {
        return DateTime.parse(value);
      } catch (e) {
        return DateTime.now();
      }
    }
    
    return DateTime.now();
  }

  /// Helper to parse double values
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  /// Helper to parse int values
  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }

  /// Check if trip is completed
  bool get isCompleted => status.toLowerCase() == 'completed';

  /// Check if trip is cancelled
  bool get isCancelled => status.toLowerCase() == 'cancelled';

  /// Get formatted distance string
  String get formattedDistance {
    if (distance == null) return 'N/A';
    return '${distance!.toStringAsFixed(1)} km';
  }

  /// Get formatted duration string
  String get formattedDuration {
    if (duration == null) return 'N/A';
    final hours = duration! ~/ 60;
    final minutes = duration! % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }

  /// Get formatted earnings string
  String get formattedEarnings {
    if (earnings == null) return 'N/A';
    return 'Rs. ${earnings!.toStringAsFixed(2)}';
  }
}

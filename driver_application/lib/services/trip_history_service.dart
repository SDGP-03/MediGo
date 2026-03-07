import 'package:driver_application/models/assignment.dart';
import 'package:firebase_database/firebase_database.dart';

class TripHistoryService {
  DatabaseReference get _root => FirebaseDatabase.instance.ref();

  Future<void> upsertTrip({
    required String driverId,
    required Assignment assignment,
    required String status,
    Map<String, Object?> extra = const {},
  }) async {
    final ref = _root
        .child('trip_history')
        .child(driverId)
        .child(assignment.requestId);

    await ref.update({
      'pickup': assignment.pickupName,
      'dropoff': assignment.dropName,
      'patientName': assignment.patientName,
      'status': status,
      'timestamp': ServerValue.timestamp,
      ...extra,
    });
  }
}


import 'package:driver_application/models/assignment.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Assignment.fromJson', () {
    test('parses nested structures and applies defaults', () {
      final assignment = Assignment.fromJson('req1', {
        'status': 'accepted',
        'priority': 'urgent',
        'patient': {'name': 'Jane Doe', 'age': 42, 'gender': 'F'},
        'pickup': {
          'hospitalName': 'Pickup Hospital',
          'address': 'Pickup Address',
          'lat': 6.9271,
          'lng': 79.8612,
        },
        'destination': {
          'hospitalName': 'Destination Hospital',
          'address': 'Destination Address',
          'lat': '7.0',
          'lng': '80.0',
        },
        'requirements': {
          'requiresDoctor': true,
          'requiresVentilator': false,
          'requiresOxygen': true,
        },
        'reason': 'Emergency',
      });

      expect(assignment.requestId, 'req1');
      expect(assignment.status, 'accepted');
      expect(assignment.priority, 'urgent');

      expect(assignment.patientName, 'Jane Doe');
      expect(assignment.patientAge, '42');
      expect(assignment.patientGender, 'F');

      expect(assignment.pickupName, 'Pickup Hospital');
      expect(assignment.pickupAddress, 'Pickup Address');
      expect(assignment.pickupLatLng.latitude, closeTo(6.9271, 0.000001));
      expect(assignment.pickupLatLng.longitude, closeTo(79.8612, 0.000001));

      expect(assignment.dropName, 'Destination Hospital');
      expect(assignment.dropAddress, 'Destination Address');
      expect(assignment.dropLatLng.latitude, closeTo(7.0, 0.000001));
      expect(assignment.dropLatLng.longitude, closeTo(80.0, 0.000001));

      expect(assignment.requiresDoctor, true);
      expect(assignment.requiresVentilator, false);
      expect(assignment.requiresOxygen, true);
      expect(assignment.reason, 'Emergency');
    });

    test('uses safe defaults when data is missing', () {
      final assignment = Assignment.fromJson('req2', {});

      expect(assignment.requestId, 'req2');
      expect(assignment.status, 'pending');
      expect(assignment.priority, 'standard');
      expect(assignment.patientName, 'Unknown Patient');
      expect(assignment.pickupName, 'Pickup Location');
      expect(assignment.dropName, 'Destination');
      expect(assignment.pickupLatLng.latitude, 0.0);
      expect(assignment.pickupLatLng.longitude, 0.0);
      expect(assignment.dropLatLng.latitude, 0.0);
      expect(assignment.dropLatLng.longitude, 0.0);
      expect(assignment.requiresDoctor, false);
      expect(assignment.requiresVentilator, false);
      expect(assignment.requiresOxygen, false);
    });
  });
}
